"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

type Platform = "Telegram" | "WhatsApp" | "Instagram" | "KakaoTalk" | "IMO" | "Boshqa";
type Country = "AQSh" | "Turkiya" | "Janubiy Koreya" | "Boshqa davlat";

const platforms: { value: Platform; label: string; icon: string }[] = [
  { value: "Telegram", label: "Telegram", icon: "✈️" },
  { value: "WhatsApp", label: "WhatsApp", icon: "💬" },
  { value: "Instagram", label: "Instagram", icon: "📷" },
  { value: "KakaoTalk", label: "KakaoTalk", icon: "💛" },
  { value: "IMO", label: "Imo", icon: "📱" },
  { value: "Boshqa", label: "Boshqa", icon: "•••" },
];

const countries: { value: Country; label: string; flag: string }[] = [
  { value: "AQSh", label: "AQSh", flag: "🇺🇸" },
  { value: "Turkiya", label: "Turkiya", flag: "🇹🇷" },
  { value: "Janubiy Koreya", label: "Janubiy Koreya", flag: "🇰🇷" },
  { value: "Boshqa davlat", label: "Boshqa davlat", flag: "🌍" },
];

const platformPlaceholders: Record<Platform, string> = {
  Telegram: "@username",
  WhatsApp: "+1 234 567 8900",
  Instagram: "@username",
  KakaoTalk: "KakaoTalk ID",
  IMO: "+998 90 123 45 67",
  Boshqa: "Username yoki raqam",
};

const platformLabels: Record<Platform, string> = {
  Telegram: "Telegram username",
  WhatsApp: "WhatsApp raqamingiz",
  Instagram: "Instagram username",
  KakaoTalk: "KakaoTalk ID",
  IMO: "IMO raqamingiz",
  Boshqa: "Username yoki raqamingiz",
};

export default function InternationalLeadForm() {
  const searchParams = useSearchParams();
  const productFromUrl = searchParams.get("product") || "";

  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Platform>("Telegram");
  const [contactValue, setContactValue] = useState("");
  const [country, setCountry] = useState<Country>("AQSh");
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // FB cookies o'qish (EMQ uchun)
  const [fbp, setFbp] = useState<string>("");
  const [fbc, setFbc] = useState<string>("");

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

    // Validatsiya
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

    if (time.trim().length < 2) {
      setStatus("error");
      setErrorMsg("Iltimos, qulay vaqtni kiriting");
      return;
    }

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: contactValue.trim(),
          platforma: platform,
          davlat: country,
          bog_lanish_vaqti: time.trim(),
          contact_value: contactValue.trim(),
          product: productFromUrl,
          source: "forma",
          fbp,
          fbc,
          userAgent: navigator.userAgent,
          pageUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Server xatosi");
      }

      // Muvaffaqiyatli — thanks sahifasiga o'tkazamiz
      window.location.href = "/thanks";
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMsg(error.message || "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#042C53] to-[#021A33] text-white relative overflow-hidden py-12 px-5">
      {/* Decorative blurs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 opacity-15 blur-3xl rounded-full -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-500 opacity-10 blur-3xl rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="relative max-w-md mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-blue-500/15 text-blue-300 px-3 py-1.5 rounded-full text-xs font-medium mb-4 border border-blue-500/30">
          <span>❤️</span>
          Ota-onangiz uchun sovg'a
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-semibold leading-tight mb-3">
          Masofadan turib
          <br />
          <span className="text-blue-400">OTA-ONANGIZNI</span>
          <br />
          xursand qiling
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-blue-100 leading-relaxed mb-5 px-2">
          O&apos;zbekiston bo&apos;ylab <strong className="text-white">bepul yetkazamiz</strong>.
          Siz tashqarida bo&apos;lsangiz ham, biz ota-onangizning eshigigacha yetkazib beramiz.
        </p>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 text-left shadow-2xl">
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
              <label className="block text-xs font-medium text-slate-800 mb-1.5">
                Ismingiz
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Akmal"
                disabled={status === "loading"}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />
            </div>

            {/* Platform */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-800 mb-1.5">
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

            {/* Contact value (dynamic label) */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-800 mb-1.5">
                {platformLabels[platform]}
              </label>
              <input
                type="text"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={platformPlaceholders[platform]}
                disabled={status === "loading"}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />
            </div>

            {/* Country */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-800 mb-1.5">
                Qaysi davlatdan murojaat qilyapsiz?
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {countries.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCountry(c.value)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                      country === c.value
                        ? "bg-blue-500 text-white"
                        : "bg-slate-50 text-slate-800 border border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <span>{c.flag}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-800 mb-1.5">
                Siz bilan qaysi vaqtda bog&apos;lansak bo&apos;ladi?
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Masalan: ertalab 9:00–11:00"
                disabled={status === "loading"}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Shuni o&apos;zingiz turgan mamlakat vaqti bilan yozing
              </p>
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

            {/* Privacy */}
            <div className="flex items-center justify-center gap-1 mt-2.5 text-[10px] text-slate-500">
              🔒 Ma&apos;lumotlaringiz xavfsiz
            </div>
          </form>
        </div>

        {/* Trust below */}
        <div className="flex justify-center gap-3 mt-5 flex-wrap text-blue-100 text-xs">
          <span className="flex items-center gap-1">🚚 Bepul yetkazib berish</span>
          <span className="flex items-center gap-1">🛡️ Kafolat</span>
          <span className="flex items-center gap-1">🎧 24/7 yordam</span>
        </div>
      </div>
    </section>
  );
}
