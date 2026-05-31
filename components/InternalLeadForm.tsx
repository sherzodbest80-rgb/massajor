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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // YANGI: fbp/fbc ni oldindan ushlab qo'yish uchun ref
  const cachedFbpRef = useRef<string>("");
  const cachedFbcRef = useRef<string>("");

  // YANGI: Sahifa ochilgach Pixel cookie qo'yishini kutamiz va ushlaymiz
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tryCapture = () => {
      const { fbp, fbc } = getFbCookies();
      if (fbp && !cachedFbpRef.current) cachedFbpRef.current = fbp;
      if (fbc && !cachedFbcRef.current) cachedFbcRef.current = fbc;
    };

    tryCapture(); // 1-urinish: darrov

    // 2, 3, 4 urinishlar — Pixel kech ulgursa ham olamiz
    const timer1 = setTimeout(tryCapture, 500);
    const timer2 = setTimeout(tryCapture, 1500);
    const timer3 = setTimeout(tryCapture, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
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
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const phoneDigits = phone.replace(/\D/g, "");

    if (name.trim().length < 2) {
      setStatus("error");
      setErrorMsg("Iltimos, ismingizni kiriting");
      return;
    }

    if (phoneDigits.length < 12) {
      setStatus("error");
      setErrorMsg("Iltimos, to'liq telefon raqamingizni kiriting");
      return;
    }

    if (time.trim().length < 2) {
      setStatus("error");
      setErrorMsg("Iltimos, qulay vaqtni kiriting");
      return;
    }

    try {
      // YANGI MANTIQ: Submit paytida yana cookie o'qiymiz
      const { fbp: fbpNow, fbc: fbcNow } = getFbCookies();

      // Eng yaxshisini tanlaymiz: hozir bormi yoki oldin ushlangan
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

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#F4F8FC] to-white py-12 px-5">
      <div className="max-w-md mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full text-xs font-medium mb-4">
          <span>🛡️</span>
          Bepul yetkazib berish
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-tight mb-3">
          Bepul konsultatsiya
          <br />
          oling
        </h1>

        <p className="text-sm text-slate-600 mb-6">
          Telefoningizni qoldiring, biz siz bilan tez orada bog&apos;lanamiz
        </p>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 text-left border border-slate-100 shadow-lg shadow-slate-200/50">
          <form onSubmit={handleSubmit}>
            {/* Info box */}
            <div className="bg-slate-50 border-l-2 border-blue-500 rounded-md p-3 mb-5 flex gap-2 items-start">
              <span className="text-blue-500 text-base flex-shrink-0">ℹ️</span>
              <p className="text-xs text-slate-800 leading-snug m-0">
                Ushbu formani diqqat bilan to&apos;ldiring va menejerlarimiz siz bilan bog&apos;lanib ma&apos;lumot berishadi
              </p>
            </div>

            {/* 1. Ism */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-900 mb-2">
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

            {/* 2. Telefon */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Telefon raqamingiz
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                onFocus={() => !phone && setPhone("+998 ")}
                placeholder="+998 __ ___ __ __"
                disabled={status === "loading"}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />
            </div>

            {/* 3. Vaqt */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Qaysi vaqtda qo&apos;ng&apos;iroq qilaylik?
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
    </section>
  );
}
