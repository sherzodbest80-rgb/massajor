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
}

// Viloyat nomi → amoCRM enum_id mapping (custom field 316123)
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

// Viloyat nomi → Meta uchun shahar slug (lowercase, no spaces)
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
    const { name, phone, address, viloyat, comment, fbp, fbc, userAgent, pageUrl } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Ism va telefon majburiy" }, { status: 400 });
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 1-QADAM: AmoCRM'ga yuborish (try/catch bilan o'ralgan)
    // Agar AmoCRM xato bersa, Meta'ga baribir event yuboramiz
    let amoResult: any = null;
    try {
      amoResult = await createAmoCRMLead({
        name,
        phone,
        address: address || viloyat || "",
        viloyat: viloyat || "",
        comment: comment || "",
        fbp,
        fbc,
        clientIp,
        userAgent: userAgent || "",
      });
    } catch (amoErr: any) {
      console.error("[AMOCRM XATO] Lid yaratilmadi, lekin Meta'ga baribir yuboramiz:", amoErr.message);
      amoResult = { error: amoErr.message };
    }

    // 2-QADAM: Meta'ga yuborish (har doim ishlaydi)
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
      });
    } catch (metaErr: any) {
      console.error("[META XATO]", metaErr.message);
      metaResult = { error: metaErr.message };
    }

    // Agar AmoCRM ham, Meta ham xato bergan bo'lsa — foydalanuvchiga xato qaytaramiz
    if (amoResult?.error && metaResult?.error) {
      return NextResponse.json(
        { error: "Xizmat vaqtincha ishlamayapti, iltimos qayta urining" },
        { status: 500 }
      );
    }

    // Hech bo'lmaganda biri ishlasa — muvaffaqiyat
    return NextResponse.json({ success: true, meta: metaResult, amo: amoResult });
  } catch (err: any) {
    console.error("[LEAD API ERROR]", err);
    return NextResponse.json({ error: err.message || "Server xatoligi" }, { status: 500 });
  }
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

  // Ism va familiyani ajratish
  const nameParts = data.name.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");

  // user_data ni dinamik qurish — bo'sh qiymatlarni QO'SHMAYMIZ
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

  const payload = {
    data: [{
      event_name: "Lead",
      event_time: Math.floor(Date.now() / 1000),
      event_id: data.leadId ? `lead_${data.leadId}` : `lead_${Date.now()}`,
      event_source_url: data.pageUrl,
      action_source: "website",
      user_data: userData,
    }],
    ...(process.env.META_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_TEST_EVENT_CODE }
      : {}),
  };

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

  if (leadId) {
    try {
      const noteText = [
        `Mijoz: ${data.name}`,
        `Telefon: ${data.phone}`,
        data.viloyat ? `Viloyat: ${data.viloyat}` : "",
        data.comment ? `Izoh: ${data.comment}` : "",
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