import { NextRequest, NextResponse } from "next/server";

/**
 * Meta webhook (Facebook Lead Ads)
 *
 * MUHIM: Lead Ads formasi to'ldirilganda Meta avtomatik Lead eventini hisoblaydi.
 * Biz bu yerda Meta'ga qayta event YUBORMAYMIZ (dublikat bo'lmasligi uchun).
 * Faqat AmoCRM'ga lid o'tkazamiz.
 *
 * Keyinchalik bu lead Sotildi bosqichiga o'tganda — amocrm-purchase webhook
 * Purchase eventini yuboradi va u Meta tomonidan asl Lead Ads click bilan
 * bog'lanadi (chunki external_id orqali).
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[META WEBHOOK] Verification successful");
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[META WEBHOOK] Received:", JSON.stringify(body, null, 2));

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === "leadgen") {
          await handleLeadgenEvent(change.value);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[META WEBHOOK ERROR]", err);
    return NextResponse.json({ received: true });
  }
}

async function handleLeadgenEvent(value: any) {
  const { leadgen_id, form_id, ad_id, adset_id, campaign_id } = value;
  console.log("[LEADGEN] New lead:", leadgen_id);

  try {
    const leadRes = await fetch(
      `https://graph.facebook.com/v19.0/${leadgen_id}?access_token=${process.env.META_ACCESS_TOKEN}`
    );
    const leadData = await leadRes.json();

    const fields: Record<string, string> = {};
    for (const field of leadData.field_data || []) {
      fields[field.name] = field.values?.[0] || "";
    }

    const fullName = fields["full_name"] || fields["first_name"] || "Facebook Lead";
    const phone = fields["phone_number"] || fields["phone"] || "";
    const city = fields["city"] || "";

    // AmoCRM ga to'g'ridan-to'g'ri yuborish (api/lead orqali EMAS)
    // Bu MUHIM — chunki api/lead Meta'ga Lead event yuboradi va dublikat bo'ladi.
    // Bu yerda biz alohida "Lead Ads" manbasidan kelgan lid yaratamiz.
    await createAmoLeadFromLeadAds({
      name: fullName,
      phone,
      city,
      leadgenId: leadgen_id,
      formId: form_id,
      adId: ad_id,
      campaignId: campaign_id,
    });

    console.log("[LEADGEN] AmoCRM ga forward qilindi");
  } catch (err) {
    console.error("[LEADGEN ERROR]", err);
  }
}

async function createAmoLeadFromLeadAds(data: {
  name: string;
  phone: string;
  city: string;
  leadgenId: string;
  formId: string;
  adId?: string;
  campaignId?: string;
}) {
  const DOMAIN = process.env.AMOCRM_DOMAIN;
  const ACCESS_TOKEN = process.env.AMOCRM_ACCESS_TOKEN;
  const PIPELINE_ID = process.env.AMOCRM_PIPELINE_ID
    ? parseInt(process.env.AMOCRM_PIPELINE_ID)
    : null;

  if (!DOMAIN || !ACCESS_TOKEN) return;

  const baseUrl = `https://${DOMAIN}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ACCESS_TOKEN}`,
  };

  const unsortedPayload = [{
    source_name: "Facebook Lead Ads",
    source_uid: `fb_leadgen_${data.leadgenId}`,
    ...(PIPELINE_ID ? { pipeline_id: PIPELINE_ID } : {}),
    metadata: {
      form_id: data.formId,
      form_name: `Facebook Lead Form ${data.formId}`,
      form_page: "facebook.com",
      ip: "0.0.0.0",
      form_sent_at: Math.floor(Date.now() / 1000),
      referer: "facebook.com",
    },
    _embedded: {
      leads: [{
        name: `${data.name} - ${data.phone} (FB)`,
        ...(PIPELINE_ID ? { pipeline_id: PIPELINE_ID } : {}),
      }],
      contacts: [{
        name: data.name,
        custom_fields_values: [{
          field_code: "PHONE",
          values: [{ value: data.phone, enum_code: "WORK" }],
        }],
      }],
    },
  }];

  const res = await fetch(`${baseUrl}/api/v4/leads/unsorted/forms`, {
    method: "POST",
    headers,
    body: JSON.stringify(unsortedPayload),
  });

  if (!res.ok) {
    const errData = await res.json();
    console.error("[AMOCRM LEAD ADS] Xatolik:", errData);
  }
}