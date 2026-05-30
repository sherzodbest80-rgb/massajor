import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// ============================================
// MENEJERLAR RO'YXATI
// Yangi menejer qo'shish: shu ro'yxatga yana bitta obyekt qo'shing.
// Tartib muhim emas — navbat avtomatik teng bo'linadi.
// ============================================
const MANAGERS = [
  {
    name: "1-menejer",
    whatsapp: "998941296667",
    telegram: "sales_damber",
  },
  {
    name: "2-menejer",
    whatsapp: "998331066667",
    telegram: "damber_uz",
  },
  // 3-menejer tayyor bo'lganda, shu yerga qo'shing:
  // {
  //   name: "3-menejer",
  //   whatsapp: "998XXXXXXXXX",
  //   telegram: "username",
  // },
];

// Redis ulanishi (Vercel env'lardan avtomatik oladi)
const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
});

export async function GET() {
  try {
    // Redis'da hisoblagichni +1 oshiramiz (atomik — bir vaqtda kelgan lidlar aralashmaydi)
    // "lead_counter" — Massajor va Damber UMUMIY navbati uchun bitta kalit
    const counter = await redis.incr("lead_counter");

    // Navbatdagi menejerni tanlaymiz (teng bo'linish)
    const index = (counter - 1) % MANAGERS.length;
    const manager = MANAGERS[index];

    return NextResponse.json({
      whatsapp: manager.whatsapp,
      telegram: manager.telegram,
      name: manager.name,
    });
  } catch (err: any) {
    // Redis ishlamasa ham mijoz tugmasiz qolmasin — 1-menejerni qaytaramiz (zaxira)
    console.error("[GET-MANAGER XATO]", err.message);
    return NextResponse.json({
      whatsapp: MANAGERS[0].whatsapp,
      telegram: MANAGERS[0].telegram,
      name: MANAGERS[0].name,
      fallback: true,
    });
  }
}
