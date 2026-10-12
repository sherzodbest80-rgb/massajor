import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maxfiylik siyosati — DAMBER",
  description: "DAMBER (massajor.uz) maxfiylik siyosati",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-gray-800 leading-relaxed">
      <h1 className="text-2xl font-bold mb-6">Maxfiylik siyosati</h1>
      <p className="mb-4 text-sm text-gray-500">Oxirgi yangilanish: 12.10.2026</p>

      <p className="mb-4">
        Ushbu siyosat DAMBER brendi (massajor.uz sayti va @damber.uz Instagram sahifasi) mijozlarning
        shaxsiy ma&apos;lumotlarini qanday yig&apos;ishi va ishlatishini tushuntiradi.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Qanday ma&apos;lumot yig&apos;amiz</h2>
      <p className="mb-4">
        Ism, telefon raqami, yashash hududi yoki yetkazish manzili hamda sayt formasi yoki Instagram
        Direct orqali bizga yozgan xabarlaringiz.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Nima uchun ishlatamiz</h2>
      <p className="mb-4">
        Savollaringizga javob berish, buyurtmani rasmiylashtirish, yetkazib berish va siz bilan
        bog&apos;lanish uchun. Instagram xabarlariga avtomatik yordamchi javob berishi mumkin, kerak
        bo&apos;lsa suhbatni menejerimiz davom ettiradi.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Kimga beriladi</h2>
      <p className="mb-4">
        Ma&apos;lumotlaringiz sotilmaydi. Ular faqat buyurtmani bajarish uchun zarur xizmatlarga
        beriladi: mijozlar bazasi (CRM), yetkazib berish xizmati va Meta (Instagram) platformasi.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Saqlash va o&apos;chirish</h2>
      <p className="mb-4">
        Ma&apos;lumotlar buyurtma va mijozga xizmat ko&apos;rsatish uchun zarur muddat davomida
        saqlanadi. Ma&apos;lumotlaringizni o&apos;chirishni xohlasangiz, Instagram Direct&apos;da
        @damber.uz sahifasiga yozing. So&apos;rovingiz 30 kun ichida bajariladi.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Aloqa</h2>
      <p className="mb-4">
        Savollar bo&apos;yicha: Instagram @damber.uz yoki massajor.uz saytidagi forma orqali.
      </p>
    </main>
  );
}
