"use client";

import { useState, useEffect } from "react";

// ============================================================
//  MENEJER KONTAKTLARI — 2 menejer, navbatma-navbat chiqadi (50/50)
//  Har menejerning WhatsApp raqami va Telegram username'i juft turadi.
//  (Juftlik teskari bo'lsa, shu yerda o'rnini almashtiring)
// ============================================================
const MANAGERS = [
  {
    whatsapp: "+998 33 106 66 67", // 1-menejer WhatsApp raqami
    telegram: "damber_uz",         // 1-menejer Telegram (@ belgisisiz)
  },
  {
    whatsapp: "+998 94 129 66 67", // 2-menejer WhatsApp raqami
    telegram: "menejer_damber",    // 2-menejer Telegram (@ belgisisiz)
  },
];

// Instagram — bitta biznes sahifa (menejer bo'yicha bo'linmaydi)
const INSTAGRAM = "damber.uz"; // @ belgisisiz

// WhatsApp chatida avtomatik yoziladigan xabar
const WHATSAPP_TEXT = "Assalomu alaykum! Massajor haqida ma'lumot olmoqchiman.";
// ============================================================

// WhatsApp linki — faqat raqamlar (+, bo'shliqsiz)
function waHref(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(WHATSAPP_TEXT)}`;
}

function tgHref(username: string): string {
  return `https://t.me/${username}`;
}

function igHref(username: string): string {
  return `https://instagram.com/${username}`;
}

export default function BuyPage() {
  // Boshlanishida 1-menejer (server bilan mos bo'lishi uchun),
  // keyin sahifa ochilganda tasodifiy tanlanadi
  const [manager, setManager] = useState(MANAGERS[0]);

  useEffect(() => {
    const pick = MANAGERS[Math.floor(Math.random() * MANAGERS.length)];
    setManager(pick);
  }, []);

  const handleContact = () => {
    // ===== META TRACKING (kerak bo'lmasa shu blokni o'chiring) =====
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Lead");
    }
    // ===============================================================
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#F4F8FC] to-white px-5 py-6 flex flex-col justify-center">
      <div className="max-w-md mx-auto text-center w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full text-xs font-medium mb-4">
          <span>🛡️</span>
          O&apos;zbekiston bo&apos;ylab BEPUL yetkazib berish
        </div>

        {/* Mahsulot rasmi (kattaligini o'zgartirish: max-h-[30vh] dagi raqamni almashtiring) */}
        <div className="flex justify-center mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/massajor.jpg"
            alt="Oyoq massajori"
            className="max-h-[30vh] w-auto object-contain rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50"
          />
        </div>

        {/* Narx */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-2">
          Mahsulot narxi
          <br />
          <span className="text-blue-600">1 600 000 so&apos;mdan</span> boshlanadi
        </h1>

        <p className="text-base text-slate-600 mb-5">
          O&apos;zingizga qulay platforma orqali biz bilan bog&apos;laning:
        </p>

        {/* Aloqa tugmalari */}
        <div className="flex flex-col gap-3">
          {/* WhatsApp */}
          <a
            href={waHref(manager.whatsapp)}
            onClick={handleContact}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1FB855] active:bg-[#1AA34C] text-white py-3.5 rounded-2xl text-base font-bold transition-all shadow-lg shadow-green-500/30"
          >
            <span className="text-xl">💬</span>
            WhatsApp orqali yozish
          </a>

          {/* Telegram */}
          <a
            href={tgHref(manager.telegram)}
            onClick={handleContact}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#229ED9] hover:bg-[#1E8BC0] active:bg-[#1A7BAA] text-white py-3.5 rounded-2xl text-base font-bold transition-all shadow-lg shadow-sky-500/30"
          >
            <span className="text-xl">✈️</span>
            Telegram orqali yozish
          </a>

          {/* Instagram */}
          <a
            href={igHref(INSTAGRAM)}
            onClick={handleContact}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90 active:opacity-80 text-white py-3.5 rounded-2xl text-base font-bold transition-all shadow-lg shadow-pink-500/30"
          >
            <span className="text-xl">📸</span>
            Instagram orqali yozish
          </a>
        </div>

        {/* Ishonch belgilari */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          <div className="text-center">
            <div className="text-2xl mb-2">🚚</div>
            <div className="text-xs text-slate-600 font-medium leading-snug">
              BEPUL yetkazib berish
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">💳</div>
            <div className="text-xs text-slate-600 font-medium leading-snug">
              Qulay to&apos;lov tizimi
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-xs text-slate-600 font-medium leading-snug">
              Sifat kafolati
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
