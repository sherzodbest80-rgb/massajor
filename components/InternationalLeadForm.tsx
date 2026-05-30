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

export default function InternationalLeadForm() {
  const searchParams = useSearchParams();
  const productFromUrl = searchParams.get("product") || "";

  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Platform>("Telegram");
  const [contactValue, setContactValue] = useState("");
  const [country, setCountry] = useState("");
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [fbp, setFbp] = useState<string>("");
  const [fbc, setFbc] = useState<string>("");

  // Video uchun
  const videoRef = useRef<HTMLVideoElement>(null);
  const formRef = useRef<HTMLDivElement>(null); // YANGI: formaga scroll uchun
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.play();
    setIsPlaying(true);
  };

  // YANGI: Video tugagach formaga avtomatik scroll
  const handleVideoEnded = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
        const [key, value] = cookie.split("=");
        if (key && value) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      setFbp(cookies._fbp || "");
      setFbc(cookies._fbc || "");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    if (name.trim().length < 2) {
      setStatus("error");
      setErrorMsg("Iltimos, ismingizni kiriting");
      return;
    }

    if (contactValue.trim().length < 3) {
      setStatus("error");
      setErrorMsg("Iltimos, username yoki telefon raqamingizni kiriting");
      return;
    }

    if (country.trim().length < 2) {
      setStatus("error");
      setErrorMsg("Iltimos, qaysi davlatdan ekanligingizni yozing");
      return;
    }

    if (time.trim().length < 2) {
      setStatus("error");
      setErrorMsg("Iltimos, qulay vaqtni kiriting");
      return;
    }

    try {
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
          fbp,
          fbc,
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

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#042C53] to-[#021A33] text-white relative overflow-hidden py-6 px-5">
      {/* Decorative blurs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 opacity-15 blur-3xl rounded-full -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-500 opacity-10 blur-3xl rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="relative max-w-md mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-blue-500/15 text-blue-300 px-3 py-1 rounded-full text-xs font-medium mb-3 border border-blue-500/30">
          <span>❤️</span>
          Ota-onangiz uchun sovg&apos;a
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-semibold leading-tight mb-4">
          Masofadan turib
          <br />
          <span className="text-blue-400">OTA-ONANGIZNI</span>
          <br />
          xursand qiling
        </h1>

        {/* DUMALOQ VIDEO (Telegram uslubi) */}
        <div className="flex justify-center mb-3">
          <div
            className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden shadow-2xl ring-4 ring-blue-500/30 cursor-pointer animate-pulse-ring"
            onClick={!isPlaying ? handlePlayVideo : undefined}
          >
            <video
              ref={videoRef}
              src="/konversiya.mp4"
              poster="/poster.jpg"
              className="w-full h-full object-cover"
              playsInline
              preload="auto"
              controls={isPlaying}
              muted={!isPlaying}
              loop={!isPlaying}
              autoPlay={false}
              onEnded={handleVideoEnded}
            />

            {/* Play tugmasi (faqat boshlanmaganda ko'rinadi) */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                <div className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-xl animate-pulse-btn">
                  <svg className="w-10 h-10 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video ostida kichik matn */}
        <p className="text-sm text-blue-200/80 mb-4">
          Narx va yetkazib berish haqida 1 daqiqalik video
        </p>

        {/* Form Card */}
        <div ref={formRef} className="bg-white rounded-2xl p-5 sm:p-6 text-left shadow-2xl">
          <form onSubmit={handleSubmit}>
            {/* Info box */}
            <div className="bg-gradient-to-r from-blue-50 to-slate-50 border-l-2 border-blue-500 rounded-md p-3 mb-4 flex gap-2 items-start">
              <span className="text-blue-500 text-base flex-shrink-0">ℹ️</span>
              <p className="text-xs text-slate-800 leading-snug m-0">
                Ushbu formani diqqat bilan to&apos;ldiring va menejerlarimiz siz bilan bog&apos;lanib ma&apos;lumot berishadi
              </p>
            </div>

            {/* Name */}
            <div className="mb-3">
              <label className="block text-sm font-bold text-slate-900 mb-1.5">
                Ismingiz
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Akmal"
                disabled={status === "loading"}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />
            </div>

            {/* Platform */}
            <div className="mb-3">
              <label className="block text-sm font-bold text-slate-900 mb-1.5">
                Siz bilan qaysi platformada bog&apos;lansak bo&apos;ladi?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {platforms.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPlatform(p.value)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                      platform === p.value
                        ? "bg-blue-500 text-white"
                        : "bg-slate-50 text-slate-800 border border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <span className="text-sm">{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact value */}
            <div className="mb-3">
              <label className="block text-sm font-bold text-slate-900 mb-1.5">
                {platformLabels[platform]}
              </label>
              <input
                type="text"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={platformPlaceholders[platform]}
                disabled={status === "loading"}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />
            </div>

            {/* Country */}
            <div className="mb-3">
              <label className="block text-sm font-bold text-slate-900 mb-1.5">
                Qaysi davlatdan murojaat qilyapsiz?
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Masalan: AQSh, Turkiya, Janubiy Koreya"
                disabled={status === "loading"}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />
            </div>

            {/* Time */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-900 mb-1.5">
                Siz bilan qaysi vaqtda bog&apos;lansak bo&apos;ladi?
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Masalan: ertalab 9:00–11:00"
                disabled={status === "loading"}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />
            </div>

            {/* Error */}
            {status === "error" && errorMsg && (
              <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md mb-3">
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Yuborilmoqda..." : "So'rov yuborish →"}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-ring {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(59, 130, 246, 0);
          }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s ease-in-out infinite;
        }
        @keyframes pulse-btn {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-pulse-btn {
          animation: pulse-btn 1.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
