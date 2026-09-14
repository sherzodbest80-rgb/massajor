"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

// YORDAMCHI FUNKSIYA: Cookie'lardan fbp va fbc ni o'qish
function getFbCookies(): { fbp: string; fbc: string } {
  if (typeof document === "undefined") return { fbp: "", fbc: "" };

  const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
    const [key, value] = cookie.split("=");
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const fbp = cookies._fbp || "";

  // FBC: avval URL'dan fbclid ni qaraymiz, keyin cookie
  let fbc = "";
  const urlParams = new URLSearchParams(window.location.search);
  const fbclidFromUrl = urlParams.get("fbclid");

  if (fbclidFromUrl) {
    fbc = `fb.1.${Date.now()}.${fbclidFromUrl}`;
  } else if (cookies._fbc) {
    fbc = cookies._fbc;
  }

  return { fbp, fbc };
}

export default function InternalLeadForm() {
  const searchParams = useSearchParams();
  const productFromUrl = searchParams.get("product") || "";

  // Forma maydonlari
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime] = useState("");

  // Qadam holati
  const [step, setStep] = useState(1);

  // Submit holati
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // fbp/fbc ni oldindan ushlab qo'yish uchun ref
  const cachedFbpRef = useRef<string>("");
  const cachedFbcRef = useRef<string>("");

  // Sahifa ochilgach Pixel cookie qo'yishini kutamiz va ushlaymiz (4x try)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tryCapture = () => {
      const { fbp, fbc } = getFbCookies();
      if (fbp && !cachedFbpRef.current) cachedFbpRef.current = fbp;
      if (fbc && !cachedFbcRef.current) cachedFbcRef.current = fbc;
    };

    tryCapture();

    const timer1 = setTimeout(tryCapture, 500);
    const timer2 = setTimeout(tryCapture, 1500);
    const timer3 = setTimeout(tryCapture, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Forma butun ekranni egallaydi — body scroll'ni to'xtatamiz
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Telefon raqamini formatlash: +998 __ ___ __ __
  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    let formatted = "+998 ";
    if (digits.length > 3) formatted += digits.slice(3, 5);
    if (digits.length > 5) formatted += " " + digits.slice(5, 8);
    if (digits.length > 8) formatted += " " + digits.slice(8, 10);
    if (digits.length > 10) formatted += " " + digits.slice(10, 12);
    return formatted.trim();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const goBack = () => {
    setErrorMsg("");
    if (step > 1) setStep(step - 1);
  };

  const goNext = () => {
    setErrorMsg("");

    if (step === 1) {
      if (name.trim().length < 2) {
        setErrorMsg("Iltimos, ismingizni kiriting");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length < 12) {
        setErrorMsg("Iltimos, to'liq telefon raqamingizni kiriting");
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");

    if (time.trim().length < 2) {
      setErrorMsg("Iltimos, qulay vaqtni kiriting");
      return;
    }

    setStatus("loading");

    try {
      const phoneDigits = phone.replace(/\D/g, "");

      // Submit paytida yana cookie o'qiymiz
      const { fbp: fbpNow, fbc: fbcNow } = getFbCookies();
      const finalFbp = fbpNow || cachedFbpRef.current || "";
      const finalFbc = fbcNow || cachedFbcRef.current || "";

      const eventId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("fb_lead_event_id", eventId);
        // Ichki forma uchun platforma bo'sh (telefon orqali)
        window.localStorage.removeItem("lead_platform");
      }

      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: "+" + phoneDigits,
          bog_lanish_vaqti: time.trim(),
          product: productFromUrl,
          source: "zayavka",
          fbp: finalFbp,
          fbc: finalFbc,
          userAgent: navigator.userAgent,
          pageUrl: window.location.href,
          event_id: eventId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Server xatosi");
      }

      window.location.href = "/thanks";
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMsg(error.message || "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    }
  };

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in">
      {/* Header: back + progress */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        {step > 1 ? (
          <button
            onClick={goBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 text-slate-700 text-xl font-medium transition-colors"
            aria-label="Orqaga"
          >
            ←
          </button>
        ) : (
          <div className="w-10 h-10" aria-hidden="true" />
        )}

        {/* Progress bar */}
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* O'ng tomonni balanslash uchun bo'sh joy */}
        <div className="w-10 h-10" aria-hidden="true" />
      </div>

      {/* Body — qadamlar */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-md mx-auto">
          <div className="text-xs text-slate-500 mb-3 font-semibold tracking-wide">
            {step} / {totalSteps}
          </div>

          {/* QADAM 1: Ism */}
          {step === 1 && (
            <div className="animate-slide-in">
              <h2 className="text-2xl font-bold mb-2 text-slate-900">Ismingizni kiriting</h2>
              <p className="text-sm text-slate-600 mb-6">Sizga qanday murojaat qilishimiz mumkin?</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goNext()}
                placeholder="Masalan: Akmal"
                autoFocus
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          )}

          {/* QADAM 2: Telefon + IIB ogohlantirish */}
          {step === 2 && (
            <div className="animate-slide-in">
              <h2 className="text-2xl font-bold mb-2 text-slate-900">Telefon raqamingiz</h2>
              <p className="text-sm text-slate-600 mb-6">Biz siz bilan tez orada bog&apos;lanamiz</p>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={handlePhoneChange}
                onFocus={() => !phone && setPhone("+998 ")}
                onKeyDown={(e) => e.key === "Enter" && goNext()}
                placeholder="+998 __ ___ __ __"
                autoFocus
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />

              {/* IIB ogohlantirish */}
              <div className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <img
                  src="/iib-logo.jpg"
                  alt="O'zbekiston Respublikasi Ichki ishlar vazirligi"
                  className="w-10 h-10 flex-shrink-0 object-contain mt-0.5"
                />
                <p className="text-xs leading-snug text-amber-900 m-0">
                  <span className="font-semibold">Diqqat!</span> Boshqa shaxsning
                  telefon raqamini uning roziligisiz kiritish{" "}
                  <span className="font-semibold">MJtK 183-moddasiga</span> ko&apos;ra
                  javobgarlikka sabab bo&apos;ladi. Iltimos, faqat o&apos;z
                  raqamingizni yozing.
                </p>
              </div>
            </div>
          )}

          {/* QADAM 3: Vaqt */}
          {step === 3 && (
            <div className="animate-slide-in">
              <h2 className="text-2xl font-bold mb-2 text-slate-900">Qaysi vaqt qulay?</h2>
              <p className="text-sm text-slate-600 mb-6">Sizga qachon qo&apos;ng&apos;iroq qilaylik?</p>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Masalan: ertalab 9:00–11:00"
                autoFocus
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          )}

          {/* Xato xabari */}
          {errorMsg && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg mt-4 font-medium">
              {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* Footer: tugma */}
      <div className="px-5 py-4 border-t border-slate-100 bg-white">
        <div className="max-w-md mx-auto">
          {step < totalSteps ? (
            <button
              onClick={goNext}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3.5 rounded-xl text-base font-semibold transition-colors"
            >
              Keyingisi →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={status === "loading"}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3.5 rounded-xl text-base font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Yuborilmoqda..." : "So'rov yuborish →"}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out;
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
