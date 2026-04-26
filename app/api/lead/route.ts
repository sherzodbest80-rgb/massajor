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

const VILOYAT_FIELD_ID = 316123; // "Viloyat" custom field ID (lead'da)

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

    const metaResult = await sendToMetaCAPI({
      name, phone, fbp, fbc,
      clientIp,
      userAgent: userAgent || "",
      pageUrl: pageUrl || process.env.NEXT_PUBLIC_SITE_URL || "",
    });

    const amoResult = await createAmoCRMLead({
      name,
      phone,
      address: address || viloyat || "",
      viloyat: viloyat || "",
      comment: comment || "",
      fbp,
      fbc,
    });

    return NextResponse.json({ success: true, meta: metaResult, amo: amoResult });
  } catch (err: any) {
    console.error("[LEAD API ERROR]", err);
    return NextResponse.json({ error: err.message || "Server xatoligi" }, { status: 500 });
  }
}

async function sendToMetaCAPI(data: {
  name: string;
  phone: string;
  fbp?: string;
  fbc?: string;
  clientIp: string;
  userAgent: string;
  pageUrl: string;
}) {
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn("[META CAPI] .env da META_PIXEL_ID yoki META_ACCESS_TOKEN yo'q, o'tkazib yuborildi");
    return { skipped: true };
  }

  const hash = (value: string) =>
    crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");

  const normalizedPhone = data.phone.replace(/[\s\-\(\)]/g, "");

  const payload = {
    data: [{
      event_name: "Lead",
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: data.pageUrl,
      action_source: "website",
      user_data: {
        fn: [hash(data.name.split(" ")[0] || data.name)],
        ln: [hash(data.name.split(" ")[1] || "")],
        ph: [hash(normalizedPhone)],
        client_ip_address: data.clientIp,
        client_user_agent: data.userAgent,
        fbp: data.fbp || "",
        fbc: data.fbc || "",
      },
    }],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
  );

  const result = await res.json();
  if (!res.ok) {
    console.error("[META CAPI ERROR]", result);
    return { error: result };
  }
  console.log("[META CAPI] Event yuborildi");
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
}) {
  const DOMAIN = process.env.AMOCRM_DOMAIN;
  const ACCESS_TOKEN = process.env.AMOCRM_ACCESS_TOKEN;
  const FIELD_FBP = process.env.AMOCRM_FIELD_FBP;
  const FIELD_FBC = process.env.AMOCRM_FIELD_FBC;
  const PIPELINE_ID = process.env.AMOCRM_PIPELINE_ID
    ? parseInt(process.env.AMOCRM_PIPELINE_ID)
    : null;

  if (!DOMAIN || !ACCESS_TOKEN) {
    console.warn("[AMOCRM] .env da AMOCRM_DOMAIN yoki AMOCRM_ACCESS_TOKEN yo'q, o'tkazib yuborildi");
    return { skipped: true };
  }

  const baseUrl = `https://${DOMAIN}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ACCESS_TOKEN}`,
  };

  // Kontakt custom fields — FAQAT TELEFON
  const contactCustomFields: any[] = [
    {
      field_code: "PHONE",
      values: [{ value: data.phone, enum_code: "WORK" }],
    },
  ];

  // Lid custom fields — Viloyat + FBP + FBC
  const leadCustomFields: any[] = [];

  // Viloyat
  if (data.viloyat && VILOYAT_ENUM_IDS[data.viloyat]) {
    leadCustomFields.push({
      field_id: VILOYAT_FIELD_ID,
      values: [{ enum_id: VILOYAT_ENUM_IDS[data.viloyat] }],
    });
  }

  // FBP
  if (FIELD_FBP && data.fbp) {
    leadCustomFields.push({
      field_id: parseInt(FIELD_FBP),
      values: [{ value: data.fbp }],
    });
  }

  // FBC
  if (FIELD_FBC && data.fbc) {
    leadCustomFields.push({
      field_id: parseInt(FIELD_FBC),
      values: [{ value: data.fbc }],
    });
  }

  // "Неразобранное" ga lid tushirish
  const unsortedPayload = [{
    source_name: "Website",
    source_uid: `web_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...(PIPELINE_ID ? { pipeline_id: PIPELINE_ID } : {}),
    metadata: {
      form_id: "website_form",
      form_name: "Website Lead Form",
      form_page: process.env.NEXT_PUBLIC_SITE_URL || "https://massajor.uz",
      ip: "127.0.0.1",
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

  // Izoh: viloyat + telefon + comment
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
