export function OrderSection() {
  return (
    <section id="order" className="section-space bg-canvas">
      <div className="container-shell">
        <div className="card-surface overflow-hidden lg:grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[#1e1e1e] p-8 text-white sm:p-10 lg:p-12">
            <div className="text-sm font-extrabold uppercase tracking-[0.28em] text-brand">Buyurtma formasi</div>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">Bir daqiqada ariza qoldiring</h2>
            <p className="mt-5 max-w-[460px] text-base leading-7 text-white/75">
              Dizayn referensiga yaqin qolish uchun bu blok popup o‘rniga sahifa ichidagi forma ko‘rinishida berildi. Telefon, ism va izoh bilan buyurtma qoldirish mumkin.
            </p>
            <div className="mt-8 space-y-3 text-sm text-white/85">
              <div>• Responsive App Router structure</div>
              <div>• Tailwind utility-based styling</div>
              <div>• CTA anchors and reusable components</div>
            </div>
          </div>

          <div className="p-8 sm:p-10 lg:p-12">
            <form className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-ink">Ismingiz</span>
                <input className="h-14 rounded-2xl border border-black/10 px-4 outline-none ring-0 transition focus:border-brand" placeholder="Ismingizni kiriting" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-ink">Telefon raqami</span>
                <input className="h-14 rounded-2xl border border-black/10 px-4 outline-none ring-0 transition focus:border-brand" placeholder="+998 90 123 45 67" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-ink">Izoh</span>
                <textarea className="min-h-[140px] rounded-2xl border border-black/10 px-4 py-4 outline-none transition focus:border-brand" placeholder="Yetkazib berish yoki mahsulot bo‘yicha izoh" />
              </label>

              <button type="submit" className="pill-btn mt-2 bg-brand text-white shadow-cta">
                Buyurtma yuborish
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
