import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface LeadPayload {
  name: string;
  phone: string;
  address?: string;
  viloyat?: string;
  comment?: string;
  fbp?: string;
  fbc?: string;
  userAgent?: string;
  pageUrl?: string;
  // Xalqaro forma maydonlari
  platforma?: string;
  davlat?: string;
  bog_lanish_vaqti?: string;
  contact_value?: string;
  product?: string;
  source?: string;
  // YANGI: Pixel bilan deduplikatsiya uchun
  event_id?: string;
}

// Viloyat nomi → amoCRM enum_id mapping
const VILOYAT_ENUM_IDS: Record<string, number> = {
  "Toshkent": 622167,
  "Andijon": 622169,
  "Farg'ona": 622171,
  "Sirdaryo": 622173,
  "Jizzax": 622175,
  "Samarqand": 622177,
  "Qashqadaryo": 622179,
  "Surxondaryo": 622181,
  "Buxoro": 622183,
  "Xorazm": 622185,
  "Qoraqalpog'iston": 622187,
  "Namangan": 165431,
};

const VILOYAT_TO_CITY: Record<string, string> = {
  "Toshkent": "tashkent",
  "Andijon": "andijan",
  "Farg'ona": "fergana",
  "Sirdaryo": "sirdaryo",
  "Jizzax": "jizzakh",
  "Samarqand": "samarkand",
  "Qashqadaryo": "qashqadaryo",
  "Surxondaryo": "surxondaryo",
  "Buxoro": "bukhara",
  "Xorazm": "khorezm",
  "Qoraqalpog'iston": "karakalpakstan",
  "Namangan": "namangan",
  "Navoiy": "navoi",
};

const VILOYAT_FIELD_ID = 316123;

export async function POST(req: NextRequest) {
  try {
    const body: LeadPayload = await req.json();
    const {
      name,
      phone,
      address,
      viloyat,
      comment,
      fbp,
      fbc,
      userAgent,
      pageUrl,
      platforma,
      davlat,
      bog_lanish_vaqti,
      contact_value,
      product,
      source,
      event_id, // YANGI: brauzerdan keladi (Pixel bilan dedup uchun)
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Ism va telefon majburiy" }, { status: 400 });
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Xalqaro forma uchun comment yaratish
    let finalComment = comment || "";
    if (source === "forma") {
      const parts: string[] = [];
      if (platforma) parts.push(`📱 Platforma: ${platforma}`);
      if (contact_value) parts.push(`👤 Username/Raqam: ${contact_value}`);
      if (davlat) parts.push(`🌍 Davlat: ${davlat}`);
      if (bog_lanish_vaqti) parts.push(`⏰ Qulay vaqt: ${bog_lanish_vaqti}`);
      if (product) parts.push(`📦 Mahsulot: ${product}`);
      parts.push(`🔗 Manba: forma sahifasi (xorijdan)`);
      finalComment = parts.join("\n");
    }

    // Ichki bozor (zayavka) uchun comment
    if (source === "zayavka") {
      const parts: string[] = [];
      if (bog_lanish_vaqti) parts.push(`⏰ Qulay vaqt: ${bog_lanish_vaqti}`);
      if (product) parts.push(`📦 Mahsulot: ${product}`);
      parts.push(`🔗 Manba: zayavka sahifasi (ichki bozor)`);
      finalComment = parts.join("\n");
    }

    // 1-QADAM: AmoCRM'ga yuborish
    let amoResult: any = null;
    try {
      amoResult = await createAmoCRMLead({
        name,
        phone,
        address: address || viloyat || davlat || "",
        viloyat: viloyat || "",
        comment: finalComment,
        fbp,
        fbc,
        clientIp,
        userAgent: userAgent || "",
      });
    } catch (amoErr: any) {
      console.error("[AMOCRM XATO]", amoErr.message);
      amoResult = { error: amoErr.message };
    }

    // 2-QADAM: Meta'ga yuborish
    let metaResult: any = null;
    try {
      metaResult = await sendToMetaCAPI({
        name,
        phone,
        viloyat: viloyat || "",
        fbp,
        fbc,
        clientIp,
        userAgent: userAgent || "",
        pageUrl: pageUrl || process.env.NEXT_PUBLIC_SITE_URL || "",
        contactId: amoResult?.contactId ? String(amoResult.contactId) : "",
        leadId: amoResult?.leadId ? String(amoResult.leadId) : "",
        eventId: event_id, // YANGI: brauzerdan kelgan event_id
      });
    } catch (metaErr: any) {
      console.error("[META XATO]", metaErr.message);
      metaResult = { error: metaErr.message };
    }

    // 3-QADAM: Telegram'ga yuborish (yangi!)
    try {
      await sendToTelegram({
        name,
        phone,
        platforma,
        contact_value,
        davlat,
        bog_lanish_vaqti,
        product,
        source: source || "noma'lum",
        amoLeadId: amoResult?.leadId,
      });
    } catch (tgErr: any) {
      console.error("[TELEGRAM XATO]", tgErr.message);
      // Telegram xato bo'lsa ham, lid muvaffaqiyatli hisoblanadi
    }

    if (amoResult?.error && metaResult?.error) {
      return NextResponse.json(
        { error: "Xizmat vaqtincha ishlamayapti, iltimos qayta urining" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, meta: metaResult, amo: amoResult });
  } catch (err: any) {
    console.error("[LEAD API ERROR]", err);
    return NextResponse.json({ error: err.message || "Server xatoligi" }, { status: 500 });
  }
}

// YANGI FUNKSIYA: Telegram guruhga lid yuborish
async function sendToTelegram(data: {
  name: string;
  phone: string;
  platforma?: string;
  contact_value?: string;
  davlat?: string;
  bog_lanish_vaqti?: string;
  product?: string;
  source: string;
  amoLeadId?: number;
}) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("[TELEGRAM] credentials yo'q, o'tkazib yuborildi");
    return { skipped: true };
  }

  // Manba turini aniqlash
  let sourceLabel = "Noma'lum manba";
  if (data.source === "forma") sourceLabel = "🌍 Xorijdan (forma)";
  else if (data.source === "zayavka") sourceLabel = "🇺🇿 Ichki bozor (zayavka)";

  // Xabar matnini tayyorlash
  const lines: string[] = [
    `🆕 <b>YANGI LID!</b>`,
    ``,
    `👤 <b>Ism:</b> ${escapeHtml(data.name)}`,
    `📞 <b>Aloqa:</b> ${escapeHtml(data.phone)}`,
  ];

  if (data.platforma) {
    lines.push(`📱 <b>Platforma:</b> ${escapeHtml(data.platforma)}`);
  }

  if (data.davlat) {
    lines.push(`🌐 <b>Davlat:</b> ${escapeHtml(data.davlat)}`);
  }

  if (data.bog_lanish_vaqti) {
    lines.push(`⏰ <b>Qulay vaqt:</b> ${escapeHtml(data.bog_lanish_vaqti)}`);
  }

  if (data.product) {
    lines.push(`📦 <b>Mahsulot:</b> ${escapeHtml(data.product)}`);
  }

  lines.push(``);
  lines.push(`🔗 <b>Manba:</b> ${sourceLabel}`);

  if (data.amoLeadId) {
    lines.push(`🆔 <b>AmoCRM ID:</b> ${data.amoLeadId}`);
  }

  const message = lines.join("\n");

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const result = await res.json();
  if (!res.ok) {
    console.error("[TELEGRAM ERROR]", result);
    throw new Error(`Telegram API xatosi: ${result.description || "unknown"}`);
  }

  console.log("[TELEGRAM] ✅ Lid guruhga yuborildi");
  return result;
}

// HTML belgilarni escape qilish (xavfsizlik uchun)
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendToMetaCAPI(data: {
  name: string;
  phone: string;
  viloyat: string;
  fbp?: string;
  fbc?: string;
  clientIp: string;
  userAgent: string;
  pageUrl: string;
  contactId: string;
  leadId: string;
  eventId?: string; // YANGI
}) {
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn("[META CAPI] credentials yo'q, o'tkazib yuborildi");
    return { skipped: true };
  }

  const hash = (value: string) =>
    crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");

  const normalizedPhone = data.phone.replace(/[\s\-\(\)\+]/g, "");

  const nameParts = data.name.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");

  const userData: Record<string, any> = {
    ph: [hash(normalizedPhone)],
    client_ip_address: data.clientIp,
    client_user_agent: data.userAgent,
    country: [hash("uz")],
  };

  if (firstName) userData.fn = [hash(firstName)];
  if (lastName) userData.ln = [hash(lastName)];

  const city = VILOYAT_TO_CITY[data.viloyat];
  if (city) userData.ct = [hash(city)];

  if (data.contactId) {
    userData.external_id = [hash(data.contactId)];
  }

  if (data.fbp) userData.fbp = data.fbp;
  if (data.fbc) userData.fbc = data.fbc;

  // MUHIM: event_id brauzerdan keladi (Pixel bilan dedup uchun)
  // Agar yo'q bo'lsa, fallback sifatida leadId yoki timestamp ishlatamiz
  const finalEventId =
    data.eventId || (data.leadId ? `lead_${data.leadId}` : `lead_${Date.now()}`);

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: finalEventId, // Pixel bilan bir xil bo'lishi kerak (dedup)
        event_source_url: data.pageUrl,
        action_source: "website",
        user_data: userData,
        // YANGI: Meta diagnostikasi valyutani talab qiladi
        custom_data: {
          currency: "UZS",
          value: 0,
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_TEST_EVENT_CODE }
      : {}),
  };

  console.log("[META CAPI] event_id:", finalEventId);
  console.log("[META CAPI] user_data keys:", Object.keys(userData));

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const result = await res.json();
  if (!res.ok) {
    console.error("[META CAPI ERROR]", result);
    return { error: result };
  }

  console.log("[META CAPI] ✅ Lead event yuborildi");
  return result;
}

async function createAmoCRMLead(data: {
  name: string;
  phone: string;
  address: string;
  viloyat: string;
  comment: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
}) {
  const DOMAIN = process.env.AMOCRM_DOMAIN;
  const ACCESS_TOKEN = process.env.AMOCRM_ACCESS_TOKEN;
  const FIELD_FBP = process.env.AMOCRM_FIELD_FBP;
  const FIELD_FBC = process.env.AMOCRM_FIELD_FBC;
  const FIELD_IP = process.env.AMOCRM_FIELD_IP;
  const FIELD_USER_AGENT = process.env.AMOCRM_FIELD_USER_AGENT;
  const PIPELINE_ID = process.env.AMOCRM_PIPELINE_ID
    ? parseInt(process.env.AMOCRM_PIPELINE_ID)
    : null;

  if (!DOMAIN || !ACCESS_TOKEN) {
    console.warn("[AMOCRM] credentials yo'q, o'tkazib yuborildi");
    return { skipped: true };
  }

  const baseUrl = `https://${DOMAIN}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ACCESS_TOKEN}`,
  };

  const contactCustomFields: any[] = [
    {
      field_code: "PHONE",
      values: [{ value: data.phone, enum_code: "WORK" }],
    },
  ];

  const leadCustomFields: any[] = [];

  if (data.viloyat && VILOYAT_ENUM_IDS[data.viloyat]) {
    leadCustomFields.push({
      field_id: VILOYAT_FIELD_ID,
      values: [{ enum_id: VILOYAT_ENUM_IDS[data.viloyat] }],
    });
  }

  if (FIELD_FBP && data.fbp) {
    leadCustomFields.push({
      field_id: parseInt(FIELD_FBP),
      values: [{ value: data.fbp }],
    });
  }

  if (FIELD_FBC && data.fbc) {
    leadCustomFields.push({
      field_id: parseInt(FIELD_FBC),
      values: [{ value: data.fbc }],
    });
  }

  if (FIELD_IP && data.clientIp) {
    leadCustomFields.push({
      field_id: parseInt(FIELD_IP),
      values: [{ value: data.clientIp }],
    });
  }

  if (FIELD_USER_AGENT && data.userAgent) {
    leadCustomFields.push({
      field_id: parseInt(FIELD_USER_AGENT),
      values: [{ value: data.userAgent }],
    });
  }

  const unsortedPayload = [{
    source_name: "Website",
    source_uid: `web_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...(PIPELINE_ID ? { pipeline_id: PIPELINE_ID } : {}),
    metadata: {
      form_id: "website_form",
      form_name: "Website Lead Form",
      form_page: process.env.NEXT_PUBLIC_SITE_URL || "https://massajor.uz",
      ip: data.clientIp || "127.0.0.1",
      form_sent_at: Math.floor(Date.now() / 1000),
      referer: process.env.NEXT_PUBLIC_SITE_URL || "https://massajor.uz",
    },
    _embedded: {
      leads: [{
        name: `${data.name} - ${data.phone}`,
        ...(PIPELINE_ID ? { pipeline_id: PIPELINE_ID } : {}),
        ...(leadCustomFields.length > 0 ? { custom_fields_values: leadCustomFields } : {}),
      }],
      contacts: [{
        name: data.name,
        custom_fields_values: contactCustomFields,
      }],
    },
  }];

  const unsortedRes = await fetch(`${baseUrl}/api/v4/leads/unsorted/forms`, {
    method: "POST",
    headers,
    body: JSON.stringify(unsortedPayload),
  });

  const unsortedData = await unsortedRes.json();
  if (!unsortedRes.ok) {
    console.error("[AMOCRM UNSORTED XATOLIK]", JSON.stringify(unsortedData, null, 2));
    throw new Error("AmoCRM Неразобранное ga lid yaratishda xatolik");
  }

  const unsortedItem = unsortedData?._embedded?.unsorted?.[0];
  const leadId = unsortedItem?._embedded?.leads?.[0]?.id;
  const contactId = unsortedItem?._embedded?.contacts?.[0]?.id;

  console.log("[AMOCRM] Неразобранное'ga lid tushdi! ID:", leadId, "Viloyat:", data.viloyat);

  if (leadId && data.comment) {
    try {
      const noteText = [
        `Mijoz: ${data.name}`,
        `Telefon: ${data.phone}`,
        data.viloyat ? `Viloyat: ${data.viloyat}` : "",
        data.comment ? `\n${data.comment}` : "",
      ].filter(Boolean).join("\n");

      await fetch(`${baseUrl}/api/v4/leads/${leadId}/notes`, {
        method: "POST",
        headers,
        body: JSON.stringify([{
          note_type: "common",
          params: { text: noteText },
        }]),
      });
      console.log("[AMOCRM] Izoh qo'shildi");
    } catch (err) {
      console.warn("[AMOCRM] Izoh qo'shishda xatolik:", err);
    }
  }

  return { leadId, contactId };
}
