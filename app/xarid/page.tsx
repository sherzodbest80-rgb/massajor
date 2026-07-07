"use client";

import { useState, useEffect } from "react";

// ============================================================
//  TELEFON RAQAMLAR — BU YERGA HAQIQIY 2 TA RAQAMNI YOZING
//  Xohlagan formatda yozsangiz bo'ladi, masalan: "+998 90 123 45 67"
// ============================================================
const PHONE_1 = "+998 33 106 66 67"; // 1-menejer raqami
const PHONE_2 = "+998 94 129 66 67"; // 2-menejer raqami
// ============================================================

const PHONES = [PHONE_1, PHONE_2];

// tel: link uchun faqat raqam va + belgisini qoldiradi
function telHref(phone: string): string {
  const clean = phone.replace(/[^\d+]/g, "");
  return `tel:${clean}`;
}

export default function XaridPage() {
  // Boshlanishida PHONE_1 (server bilan mos bo'lishi uchun),
  // keyin sahifa ochilganda tasodifiy tanlanadi
  const [phone, setPhone] = useState(PHONE_1);

  useEffect(() => {
    // Har ochilganda 2 raqamdan bittasi tasodifiy chiqadi (taxminan 50/50)
    const pick = PHONES[Math.floor(Math.random() * PHONES.length)];
    setPhone(pick);
  }, []);

  const handleCall = () => {
    // ===== META TRACKING (kerak bo'lmasa shu blokni o'chiring) =====
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Lead");
    }
    // ===============================================================
    // tel: havolaning o'zi telefon dasturini ochadi
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#F4F8FC] to-white px-5 py-6 flex flex-col justify-center">
      <div className="max-w-md mx-auto text-center w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full text-xs font-medium mb-4">
          <span>🛡️</span>
          O&apos;zbekiston bo&apos;ylab BEPUL yetkazib berish
        </div>

        {/* Mahsulot rasmi — kichraytirilib markazga joylandi.
            Kattaroq/kichikroq qilish uchun max-h qiymatini o'zgartiring
            (masalan max-h-[35vh] → max-h-[28vh]) */}
        <div className="flex justify-center mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/massajor.jpg"
            alt="Oyoq massajori"
            className="max-h-[34vh] w-auto object-contain rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50"
          />
        </div>

        {/* Narx */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-2">
          Mahsulot narxi
          <br />
          <span className="text-blue-600">1 600 000 so&apos;mdan</span> boshlanadi
        </h1>

        <p className="text-base text-slate-600 mb-5">
          Xarid qilmoqchi bo&apos;lsangiz, quyidagi raqamga qo&apos;ng&apos;iroq qiling:
        </p>

        {/* Telefon raqam — bosilsa qo'ng'iroq ochiladi */}
        <a
          href={telHref(phone)}
          onClick={handleCall}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-4 rounded-2xl text-lg font-bold transition-all shadow-lg shadow-blue-600/30"
        >
          <span className="text-xl">📞</span>
          {phone}
        </a>

        <p className="text-xs text-slate-500 mt-3">
          Ish vaqti: har kuni 9:00 – 21:00
        </p>

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
              Qo&apos;lga olib to&apos;lash
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
