// Reklama manbasini (UTM + Facebook ad_id) ushlab qolish.
// Facebook reklama havolasiga url_tags orqali qo'shiladi:
//   utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}
//   &utm_content={{ad.name}}&ad_id={{ad.id}}
// Mijoz saytga kirganda parametrlar localStorage'ga yoziladi (oxirgi reklama tashrifi yutadi),
// forma yuborilganda /api/lead ga birga jo'natiladi va amoCRM lidiga yoziladi.

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  ad_id?: string;
  landing?: string;
  ts?: number;
};

const KEY = "dmb_attr";
const MAX_AGE_MS = 30 * 24 * 3600 * 1000;
const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ad_id"] as const;

function fromUrl(): Attribution | null {
  if (typeof window === "undefined") return null;
  const sp = new URLSearchParams(window.location.search);
  const a: Attribution = {};
  let found = false;
  for (const p of PARAMS) {
    const v = sp.get(p);
    if (v && !v.includes("{{")) {
      a[p] = v.slice(0, 250);
      found = true;
    }
  }
  if (!found) return null;
  a.landing = window.location.pathname;
  a.ts = Date.now();
  return a;
}

export function captureAttribution() {
  try {
    const a = fromUrl();
    if (a) window.localStorage.setItem(KEY, JSON.stringify(a));
  } catch {}
}

export function getAttribution(): Attribution {
  try {
    const now = fromUrl();
    if (now) return now;
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const a: Attribution = JSON.parse(raw);
    if (!a.ts || Date.now() - a.ts > MAX_AGE_MS) return {};
    return a;
  } catch {
    return {};
  }
}
