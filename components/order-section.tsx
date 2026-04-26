"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const VILOYATLAR = [
  "Toshkent",
  "Andijon",
  "Farg'ona",
  "Namangan",
  "Sirdaryo",
  "Jizzax",
  "Samarqand",
  "Qashqadaryo",
  "Surxondaryo",
  "Buxoro",
  "Xorazm",
  "Navoiy",
  "Qoraqalpog'iston",
];

export function OrderSection() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    viloyat: "",
    comment: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.viloyat,
          viloyat: form.viloyat,
          comment: form.comment,
          fbp: getCookie("_fbp"),
          fbc: getCookie("_fbc"),
          userAgent: navigator.userAgent,
          pageUrl: window.location.href,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Xatolik yuz berdi");
      }
      setStatus("success");

      // Submit muvaffaqiyatli — /thanks sahifasiga o'tish
      router.push("/thanks");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <section id="order" className="section-space bg-canvas">
      <div className="container-shell">
        <div className="card-surface overflow-hidden lg:grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[#1e1e1e] p-8 text-white sm:p-10 lg:p-12">
            <div className="text-sm font-extrabold uppercase tracking-[0.28em] text-brand">Buyurtma formasi</div>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">Bir daqiqada ariza qoldiring</h2>
            <p className="mt-5 max-w-[460px] text-base leading-7 text-white/75">
              Dizayn referensiga yaqin qolish uchun bu blok popup o'rniga sahifa ichidagi forma ko'rinishida berildi. Telefon, ism va izoh bilan buyurtma qoldirish mumkin.
            </p>
            <div className="mt-8 space-y-3 text-sm text-white/85">
              <div>• Responsive App Router structure</div>
              <div>• Tailwind utility-based styling</div>
              <div>• CTA anchors and reusable components</div>
            </div>
          </div>
          <div className="p-8 sm:p-10 lg:p-12">
            <form onSubmit={handleSubmit} className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-ink">Ismingiz</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="h-14 rounded-2xl border border-black/10 px-4 outline-none ring-0 transition focus:border-brand"
                  placeholder="Ismingizni kiriting"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-ink">Telefon raqami</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="h-14 rounded-2xl border border-black/10 px-4 outline-none ring-0 transition focus:border-brand"
                  placeholder="+998 90 123 45 67"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-ink">Viloyat</span>
                <select
                  name="viloyat"
                  value={form.viloyat}
                  onChange={handleChange}
                  className="h-14 rounded-2xl border border-black/10 bg-white px-4 outline-none ring-0 transition focus:border-brand"
                  required
                >
                  <option value="" disabled>
                    Viloyatni tanlang
                  </option>
                  {VILOYATLAR.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
             

              {status === "error" && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                  {errorMsg}
                </div>
              )}
              <button
                type="submit"
                className="pill-btn mt-2 bg-brand text-white shadow-cta"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Yuborilmoqda..." : "Buyurtma yuborish"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp("(^| )" + name + "=([^;]+)")
  );
  return match ? match[2] : "";
}
