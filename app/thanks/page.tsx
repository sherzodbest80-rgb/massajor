"use client";

import { useEffect, useState } from "react";

const INSTAGRAM_URL = "https://www.instagram.com/damber.uz";
const COUNTDOWN_SECONDS = 30;

export default function ThanksPage() {
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);

  // 1) Pixel Lead event (dedup uchun event_id bilan)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const eventId = window.localStorage.getItem("fb_lead_event_id");

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

    // VK pixel "lead" maqsadi — faqat haqiqiy forma yuborilganda (eventId bor)
    if (eventId) {
      const w = window as any;
      w._tmr = w._tmr || [];
      w._tmr.push({ type: "reachGoal", id: 3808059, goal: "lead" });
    }

    if (!fireLeadEvent()) {
      const intervalId = setInterval(() => {
        if (fireLeadEvent()) clearInterval(intervalId);
      }, 200);
      setTimeout(() => clearInterval(intervalId), 5000);
    }

    // 20.11.2026 (Sherzod): "Menejer bilan bog'lanish" tugmalari olib tashlandi — menejer o'zi bog'lanadi.
    window.localStorage.removeItem("lead_platform");
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
            Menejerimiz tez orada o&apos;zi siz bilan bog&apos;lanadi.
          </p>

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
      `}</style>
    </main>
  );
}
