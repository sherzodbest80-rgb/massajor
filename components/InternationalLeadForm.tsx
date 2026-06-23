"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

type Platform = "Telegram" | "WhatsApp" | "KakaoTalk" | "IMO" | "Boshqa";

const platforms: { value: Platform; label: string; icon: string }[] = [
  { value: "Telegram", label: "Telegram", icon: "✈️" },
  { value: "WhatsApp", label: "WhatsApp", icon: "💬" },
  { value: "KakaoTalk", label: "KakaoTalk", icon: "💛" },
  { value: "IMO", label: "Imo", icon: "📱" },
  { value: "Boshqa", label: "Boshqa", icon: "•••" },
];

const platformPlaceholders: Record<Platform, string> = {
  Telegram: "@username yoki +1 234 567 8900",
  WhatsApp: "+1 234 567 8900",
  KakaoTalk: "Telefon raqam yoki ID",
  IMO: "+998 90 123 45 67",
  Boshqa: "Username yoki raqam",
};

const platformLabels: Record<Platform, string> = {
  Telegram: "Telefon raqam yoki username",
  WhatsApp: "WhatsApp raqamingiz",
  KakaoTalk: "Telefon raqam yoki ID",
  IMO: "IMO raqamingiz",
  Boshqa: "Username yoki raqamingiz",
};

// YORDAMCHI FUNKSIYA: Cookie'lardan fbp va fbc ni o'qish
function getFbCookies(): { fbp: string; fbc: string } {
  if (typeof document === "undefined") return { fbp: "", fbc: "" };
  const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
    const [key, value] = cookie.split("=");
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  const fbp = cookies._fbp || "";
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

export default function InternationalLeadForm() {
  const searchParams = useSearchParams();
  const productFromUrl = searchParams.get("product") || "";

  // Forma maydonlari
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Platform>("Telegram");
  const [contactValue, setContactValue] = useState("");
  const [country, setCountry] = useState("");
  const [time, setTime] = useState("");

  // Qadam holati (forma darrov ochiq — lending ekrani yo'q)
  const [step, setStep] = useState(1);

  // Submit holati
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // fbp/fbc cache (qayta render qilmasligi uchun useRef)
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

  const goBack = () => {
    setErrorMsg("");
    if (step > 1) {
      setStep(step - 1);
    }
    // 1-qadamda orqaga qaytadigan joy yo'q
  };

  const goNext = () => {
    setErrorMsg("");

    if (step === 1) {
      if (name.trim().length < 2) {
        setErrorMsg("Iltimos, ismingizni kiriting");
        return;
      }
      setStep(2);
    } else if (step === 3) {
      if (contactValue.trim().length < 3) {
        setErrorMsg("Iltimos, username yoki telefon raqamingizni kiriting");
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (country.trim().length < 2) {
        setErrorMsg("Iltimos, qaysi davlatdan ekanligingizni yozing");
        return;
      }
      setStep(5);
    }
  };

  // Platforma tanlanganda avtomatik keyingi qadamga o'tadi
  const selectPlatform = (p: Platform) => {
    setPlatform(p);
    setContactValue(""); // yangi platforma — yangi format
    setStep(3);
  };

  const handleSubmit = async () => {
    setErrorMsg("");

    if (time.trim().length < 2) {
      setErrorMsg("Iltimos, qulay vaqtni kiriting");
      return;
    }

    setStatus("loading");

    try {
      const { fbp: fbpNow, fbc: fbcNow } = getFbCookies();
      const finalFbp = fbpNow || cachedFbpRef.current || "";
      const finalFbc = fbcNow || cachedFbcRef.current || "";
      const eventId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      if (typeof window !== "undefined") {
        window.localStorage.setItem("fb_lead_event_id", eventId);
        window.localStorage.setItem("lead_platform", platform);
      }

      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: contactValue.trim(),
          platforma: platform,
          davlat: country.trim(),
          bog_lanish_vaqti: time.trim(),
          contact_value: contactValue.trim(),
          product: productFromUrl,
          source: "forma",
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

  const totalSteps = 5;
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

          {/* QADAM 2: Platforma (auto-advance) */}
          {step === 2 && (
            <div className="animate-slide-in">
              <h2 className="text-2xl font-bold mb-2 text-slate-900">Qaysi platformada bog&apos;lansak?</h2>
              <p className="text-sm text-slate-600 mb-6">Sizga qulay bo&apos;lgan platformani tanlang</p>
              <div className="flex flex-col gap-2.5">
                {platforms.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => selectPlatform(p.value)}
                    className="flex items-center gap-3 bg-slate-50 hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-left transition-all"
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <span className="text-base font-medium text-slate-900">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QADAM 3: Contact value */}
          {step === 3 && (
            <div className="animate-slide-in">
              <h2 className="text-2xl font-bold mb-2 text-slate-900">{platformLabels[platform]}</h2>
              <p className="text-sm text-slate-600 mb-6">
                Tanlangan platforma: <span className="font-semibold text-blue-600">{platform}</span>
              </p>
              <input
                type="text"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goNext()}
                placeholder={platformPlaceholders[platform]}
                autoFocus
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          )}

          {/* QADAM 4: Davlat */}
          {step === 4 && (
            <div className="animate-slide-in">
              <h2 className="text-2xl font-bold mb-2 text-slate-900">Qaysi davlatdan?</h2>
              <p className="text-sm text-slate-600 mb-6">Siz hozir qaysi davlatda yashayapsiz?</p>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goNext()}
                placeholder="Masalan: AQSh, Turkiya, Janubiy Koreya"
                autoFocus
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          )}

          {/* QADAM 5: Vaqt */}
          {step === 5 && (
            <div className="animate-slide-in">
              <h2 className="text-2xl font-bold mb-2 text-slate-900">Qaysi vaqt qulay?</h2>
              <p className="text-sm text-slate-600 mb-6">Sizga qachon qo&apos;ng&apos;iroq qilaylik? (sizning vaqt mintaqangiz bo&apos;yicha)</p>
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

      {/* Footer: tugma (2-qadamdan tashqari hammasida) */}
      {step !== 2 && (
        <div className="px-5 py-4 border-t border-slate-100 bg-white">
          <div className="max-w-md mx-auto">
            {step < 5 ? (
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
      )}

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
