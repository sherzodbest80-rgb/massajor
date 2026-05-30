"use client";

import { useEffect, useState } from "react";

const INSTAGRAM_URL = "https://www.instagram.com/damber.uz";
const COUNTDOWN_SECONDS = 30;

type Manager = {
  whatsapp: string;
  telegram: string;
  name: string;
};

export default function ThanksPage() {
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const [manager, setManager] = useState<Manager | null>(null);
  const [platform, setPlatform] = useState<string>("");

  // 1) Pixel Lead event (dedup uchun event_id bilan) + menejer olish
  useEffect(() => {
    if (typeof window === "undefined") return;

    const eventId = window.localStorage.getItem("fb_lead_event_id");
    const savedPlatform = window.localStorage.getItem("lead_platform") || "";
    setPlatform(savedPlatform);

    // Pixel Lead event
    const fireLeadEvent = () => {
      const fbq = (window as any).fbq;
      if (typeof fbq !== "function") return false;
      if (eventId) {
        fbq("track", "Lead", { currency: "UZS", value: 185000 }, { eventID: eventId });
        console.log("[Pixel] Lead event yuborildi, eventID:", eventId);
      } else {
        console.warn("[Pixel] event_id yo'q, Lead event yuborilmadi");
      }
      window.localStorage.removeItem("fb_lead_event_id");
      return true;
    };

    if (!fireLeadEvent()) {
      const intervalId = setInterval(() => {
        if (fireLeadEvent()) clearInterval(intervalId);
      }, 200);
      setTimeout(() => clearInterval(intervalId), 5000);
    }

    // Navbatdagi menejerni olamiz (Redis navbat orqali)
    fetch("/api/get-manager")
      .then((res) => res.json())
      .then((data) => {
        setManager(data);
        window.localStorage.removeItem("lead_platform");
      })
      .catch((err) => console.error("[Menejer olishda xato]", err));
  }, []);

  // 2) Countdown
  useEffect(() => {
    window.scrollTo(0, 0);
    if (seconds <= 0) {
      window.location.href = INSTAGRAM_URL;
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  // Tugma uchun havola va matn tayyorlash
  const isWhatsApp = platform === "WhatsApp";
  const isTelegram = platform === "Telegram";

  const waMessage = encodeURIComponent(
    "Assalomu alaykum! Men massajor apparati haqida ma'lumot olmoqchiman."
  );
  const waLink = manager ? `https://wa.me/${manager.whatsapp}?text=${waMessage}` : "#";
  const tgLink = manager ? `https://t.me/${manager.telegram}` : "#";

  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="card-surface bg-white p-8 sm:p-12 lg:p-16 text-center">
          {/* Yashil tick */}
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 animate-bounce-slow">
            <svg className="h-14 w-14 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink mb-4">
            Rahmat! 🎉
          </h1>

          <p className="text-lg sm:text-xl text-ink/70 mb-2">
            Arizangiz muvaffaqiyatli qabul qilindi
          </p>

          <p className="text-base text-ink/60 mb-8 leading-7">
            Tezroq javob olish uchun menejer bilan ixtiyoriy bog&apos;laning.
          </p>

          {/* MENEJER BILAN BOG'LANISH TUGMALARI */}
          <div className="mb-8 space-y-3">
            {/* WhatsApp tugmasi */}
            {(isWhatsApp || (!isWhatsApp && !isTelegram)) && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 font-bold text-white shadow-lg hover:scale-105 transition-transform animate-pulse-btn"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Menejer bilan bog&apos;lanish
              </a>
            )}

            {/* Telegram tugmasi */}
            {(isTelegram || (!isWhatsApp && !isTelegram)) && (
              <a
                href={tgLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 rounded-2xl bg-[#229ED9] px-6 py-4 font-bold text-white shadow-lg hover:scale-105 transition-transform animate-pulse-btn"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Menejer bilan bog&apos;lanish
              </a>
            )}

            {!manager && (
              <p className="text-sm text-ink/50">Operator ma&apos;lumoti yuklanmoqda...</p>
            )}
          </div>

          {/* Countdown matni */}
          <p className="text-sm text-ink/50 mb-4">
            {seconds} soniyadan keyin Instagram sahifamizga o&apos;tasiz
          </p>

          {/* Pastki linklar */}
          <div className="mt-6 pt-6 border-t border-black/5">
            <a href="/" className="text-sm text-ink/50 hover:text-brand transition-colors">
              Bosh sahifaga qaytish
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        @keyframes pulse-btn {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        .animate-pulse-btn {
          animation: pulse-btn 1.5s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
