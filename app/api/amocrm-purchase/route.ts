import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * AmoCRM webhook endpoint
 * SOTILDI bosqichiga lid o'tganda Meta'ga Purchase event yuboradi
 *
 * EMQ ni oshirish uchun yangilangan versiya:
 * - external_id (AmoCRM contact ID) qo'shildi
 * - client_ip_address va client_user_agent kontaktdan olinmoqda
 * - event_id deduplikatsiya uchun qo'shildi
 * - Bo'sh fbp/fbc yuborilmaydi (Meta'da diagnostika uchun zarar)
 * - country: "uz" sukut bo'yicha qo'shildi
 * - Viloyat enum'dan ct (shahar) sifatida olinadi
 */

// Viloyat enum_id → city slug mapping (Meta uchun lowercase, no spaces)
const VILOYAT_TO_CITY: Record<string, string> = {
  "622167": "tashkent",
  "622169": "andijan",
  "622171": "fergana",
  "622173": "sirdaryo",
  "622175": "jizzakh",
  "622177": "samarkand",
  "622179": "qashqadaryo",
  "622181": "surxondaryo",
  "622183": "bukhara",
  "622185": "khorezm",
  "622187": "karakalpakstan",
  "165431": "namangan",
};

const VILOYAT_FIELD_ID = "316123";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    console.log("[AMO PURCHASE WEBHOOK] Received:", JSON.stringify(data, null, 2));

    const leadId = data["leads[status][0][id]"];
    const statusId = data["leads[status][0][status_id]"];
    const price = data["leads[status][0][price]"];

    if (!leadId) {
      console.warn("[AMO PURCHASE] Lid ID yo'q");
      return NextResponse.json({ ok: true });
    }

    const SOLD_STATUS_ID = process.env.AMOCRM_SOLD_STATUS_ID;
    if (SOLD_STATUS_ID && statusId !== SOLD_STATUS_ID) {
      console.log(`[AMO PURCHASE] Bosqich ${statusId} - SOTILDI emas`);
      return NextResponse.json({ ok: true });
    }

    const leadInfo = await fetchLeadDetails(leadId);
    if (!leadInfo) {
      console.error("[AMO PURCHASE] Lid topilmadi");
      return NextResponse.json({ ok: true });
    }

    const finalPrice = parseFloat(price) || leadInfo.price || 0;

    if (!finalPrice || finalPrice <= 0) {
      console.warn(`[AMO PURCHASE] ❌ Summa 0 (${finalPrice}) — yuborilmadi`);
      return NextResponse.json({ ok: true, skipped: true, reason: "Summa kiritilmagan" });
    }

    console.log(`[AMO PURCHASE] ✅ Summa: ${finalPrice} — yuborilyapti`);

    const result = await sendPurchaseToMeta({
      leadId: String(leadId),
      contactId: leadInfo.contactId,
      phone: leadInfo.phone,
      email: leadInfo.email,
      name: leadInfo.name,
      city: leadInfo.city,
      fbp: leadInfo.fbp,
      fbc: leadInfo.fbc,
      clientIp: leadInfo.clientIp,
      clientUserAgent: leadInfo.clientUserAgent,
      price: finalPrice,
    });

    return NextResponse.json({ ok: true, meta: result });
  } catch (err: any) {
    console.error("[AMO PURCHASE ERROR]", err);
    return NextResponse.json({ ok: true });
  }
}

async function fetchLeadDetails(leadId: string) {
  const DOMAIN = process.env.AMOCRM_DOMAIN;
  const ACCESS_TOKEN = process.env.AMOCRM_ACCESS_TOKEN;
  const FIELD_FBP = process.env.AMOCRM_FIELD_FBP;
  const FIELD_FBC = process.env.AMOCRM_FIELD_FBC;
  const FIELD_IP = process.env.AMOCRM_FIELD_IP;
  const FIELD_USER_AGENT = process.env.AMOCRM_FIELD_USER_AGENT;

  if (!DOMAIN || !ACCESS_TOKEN) return null;

  const headers = { Authorization: `Bearer ${ACCESS_TOKEN}` };

  try {
    // Lid + kontakt + lid'ning custom fieldlari (FBP/FBC lid'da saqlanadi)
    const leadRes = await fetch(
      `https://${DOMAIN}/api/v4/leads/${leadId}?with=contacts`,
      { headers }
    );

    if (!leadRes.ok) return null;
    const lead = await leadRes.json();
    const contactId = lead?._embedded?.contacts?.[0]?.id;

    if (!contactId) return null;

    // Lid custom fieldlaridan FBP, FBC, IP, UA, viloyat olish
    let fbp = "";
    let fbc = "";
    let clientIp = "";
    let clientUserAgent = "";
    let city = "";

    for (const field of lead.custom_fields_values || []) {
      const fid = String(field.field_id);

      if (FIELD_FBP && fid === FIELD_FBP) {
        fbp = field.values?.[0]?.value || "";
      }
      if (FIELD_FBC && fid === FIELD_FBC) {
        fbc = field.values?.[0]?.value || "";
      }
      if (FIELD_IP && fid === FIELD_IP) {
        clientIp = field.values?.[0]?.value || "";
      }
      if (FIELD_USER_AGENT && fid === FIELD_USER_AGENT) {
        clientUserAgent = field.values?.[0]?.value || "";
      }
      // Viloyat enum
      if (fid === VILOYAT_FIELD_ID) {
        const enumId = String(field.values?.[0]?.enum_id || "");
        city = VILOYAT_TO_CITY[enumId] || "";
      }
    }

    // Kontakt ma'lumotlari
    const contactRes = await fetch(
      `https://${DOMAIN}/api/v4/contacts/${contactId}`,
      { headers }
    );

    if (!contactRes.ok) return null;
    const contact = await contactRes.json();

    let phone = "";
    let email = "";

    for (const field of contact.custom_fields_values || []) {
      if (field.field_code === "PHONE") {
        phone = field.values?.[0]?.value || "";
      }
      if (field.field_code === "EMAIL") {
        email = field.values?.[0]?.value || "";
      }
    }

    return {
      contactId: String(contactId),
      name: contact.name || "",
      phone,
      email,
      city,
      fbp,
      fbc,
      clientIp,
      clientUserAgent,
      price: lead.price || 0,
    };
  } catch (err) {
    console.error("[AMO FETCH LEAD]", err);
    return null;
  }
}

async function sendPurchaseToMeta(data: {
  leadId: string;
  contactId: string;
  phone: string;
  email: string;
  name: string;
  city: string;
  fbp: string;
  fbc: string;
  clientIp: string;
  clientUserAgent: string;
  price: number;
}) {
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn("[META PURCHASE] Credentials yo'q");
    return { skipped: true };
  }

  const hash = (value: string) =>
    crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");

  // Telefonni E.164 ga normalize qilish (faqat raqamlar)
  const normalizedPhone = data.phone.replace(/[\s\-\(\)\+]/g, "");

  // Ism/familiyani ajratish
  const nameParts = (data.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // user_data ni dinamik qurish — bo'sh qiymatlarni QO'SHMAYMIZ
  const userData: Record<string, any> = {};

  if (normalizedPhone) userData.ph = [hash(normalizedPhone)];
  if (data.email) userData.em = [hash(data.email)];
  if (firstName) userData.fn = [hash(firstName)];
  if (lastName) userData.ln = [hash(lastName)];
  if (data.city) userData.ct = [hash(data.city)];

  // external_id — eng kuchli signal
  if (data.contactId) {
    userData.external_id = [hash(data.contactId)];
  }

  // Country sukut bo'yicha UZ
  userData.country = [hash("uz")];

  // fbp/fbc — faqat bor bo'lsa
  if (data.fbp) userData.fbp = data.fbp;
  if (data.fbc) userData.fbc = data.fbc;

  // IP va UA — faqat bor bo'lsa
  if (data.clientIp) userData.client_ip_address = data.clientIp;
  if (data.clientUserAgent) userData.client_user_agent = data.clientUserAgent;

  const payload = {
    data: [{
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: `purchase_${data.leadId}`, // deduplikatsiya
      event_source_url: process.env.NEXT_PUBLIC_SITE_URL || "https://massajor.uz",
      action_source: "website",
      user_data: userData,
      custom_data: {
        currency: "UZS",
        value: data.price,
      },
    }],
    ...(process.env.META_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_TEST_EVENT_CODE }
      : {}),
  };

  console.log("[META PURCHASE] Payload user_data keys:", Object.keys(userData));

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
    console.error("[META PURCHASE ERROR]", result);
    return { error: result };
  }

  console.log(`[META PURCHASE] ✅ Yuborildi! Summa: ${data.price} UZS`);
  return result;
}