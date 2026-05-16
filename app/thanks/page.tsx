"use client";

import { useEffect, useState } from "react";

const INSTAGRAM_URL = "https://www.instagram.com/damber.uz";
const COUNTDOWN_SECONDS = 10;

export default function ThanksPage() {
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);

  // YANGI: Sahifa ochilganda Pixel Lead event yuboramiz (dedup uchun event_id bilan)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // localStorage'dan event_id ni olamiz (forma yuborilganda saqlangan)
    const eventId = window.localStorage.getItem("fb_lead_event_id");

    // Pixel (fbq) yuklangani kutamiz va Lead event yuboramiz
    const fireLeadEvent = () => {
      const fbq = (window as any).fbq;
      if (typeof fbq !== "function") return false;

      // Pixel Lead event — Server CAPI bilan bir xil event_id (dedup)
      if (eventId) {
        fbq(
          "track",
          "Lead",
          { currency: "UZS", value: 0 },
          { eventID: eventId }
        );
        console.log("[Pixel] Lead event yuborildi, eventID:", eventId);
      } else {
        // Agar event_id yo'q bo'lsa (masalan, foydalanuvchi /thanks ga to'g'ridan-to'g'ri kirgan)
        // Lead event YUBORMAYMIZ — dedup ishlamaydi, Facebook xato beradi
        console.warn("[Pixel] event_id yo'q, Lead event yuborilmadi");
      }

      // Bir martagina yuborilsin
      window.localStorage.removeItem("fb_lead_event_id");
      return true;
    };

    // fbq darhol mavjud bo'lmasligi mumkin (Pixel asinxron yuklanadi)
    if (!fireLeadEvent()) {
      const intervalId = setInterval(() => {
        if (fireLeadEvent()) clearInterval(intervalId);
      }, 200);
      // Eng ko'p 5 sekund kutamiz
      setTimeout(() => clearInterval(intervalId), 5000);
    }
  }, []); // [] — faqat 1 marta ishga tushadi

  useEffect(() => {
    window.scrollTo(0, 0);

    if (seconds <= 0) {
      window.location.href = INSTAGRAM_URL;
      return;
    }

    const timer = setTimeout(() => {
      setSeconds((s) => s - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds]);

  // Progress aylana hisoblash
  const progress = ((COUNTDOWN_SECONDS - seconds) / COUNTDOWN_SECONDS) * 100;
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="card-surface bg-white p-8 sm:p-12 lg:p-16 text-center">
          {/* Yashil "tick" belgisi */}
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 animate-bounce-slow">
            <svg
              className="h-14 w-14 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Sarlavha */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink mb-4">
            Rahmat! 🎉
          </h1>

          <p className="text-lg sm:text-xl text-ink/70 mb-2">
            Arizangiz muvaffaqiyatli qabul qilindi
          </p>

          <p className="text-base text-ink/60 mb-8 leading-7">
            Operatorlarimiz tez orada siz bilan bog'lanishadi.
          </p>

          {/* Countdown aylanasi */}
          <div className="relative mx-auto mb-6 h-44 w-44">
            {/* Orqa fon aylana */}
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              {/* Animatsion progress aylana */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: "stroke-dashoffset 1s linear",
                }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#833ab4" />
                  <stop offset="50%" stopColor="#fd1d1d" />
                  <stop offset="100%" stopColor="#fcb045" />
                </linearGradient>
              </defs>
            </svg>

            {/* Markazda raqam */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                key={seconds}
                className="text-6xl font-black text-ink animate-pulse-once"
              >
                {seconds}
              </span>
              <span className="text-xs uppercase tracking-wider text-ink/50 mt-1">
                soniya
              </span>
            </div>
          </div>

          {/* Yo'naltirish matni */}
          <p className="text-sm text-ink/60 mb-6">
            Instagram sahifamizga o'tkazilmoqdasiz...
          </p>

          {/* Instagram tugmasi */}
          <a
            href={INSTAGRAM_URL}
            className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] px-8 py-4 font-bold text-white shadow-lg hover:scale-105 transition-transform"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            Instagram'ga o'tish
          </a>

          {/* Pastki linklar */}
          <div className="mt-8 pt-6 border-t border-black/5">
            <a
              href="/"
              className="text-sm text-ink/50 hover:text-brand transition-colors"
            >
              ← Bosh sahifaga qaytish
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes pulse-once {
          0% {
            transform: scale(1.3);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-pulse-once {
          animation: pulse-once 0.4s ease-out;
        }
      `}</style>
    </main>
  );
}
