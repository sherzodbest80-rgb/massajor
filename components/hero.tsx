import { heroFeatures, heroSlides } from '@/lib/data';
import { SliderFrame } from './slider-frame';

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-brand bg-hero-rings">
      <div className="absolute inset-y-0 left-0 hidden w-72 bg-[url('https://static.tildacdn.one/tild3839-6438-4564-a531-373238633766/Ellipse_1.png')] bg-contain bg-left bg-no-repeat opacity-30 lg:block" />
      <div className="container-shell grid min-h-[720px] items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div className="relative z-10 text-white">
          <div className="mb-4 text-sm font-extrabold uppercase tracking-[0.28em] text-white/90">OYOQ MASSAJORI</div>
          <h1 className="max-w-[640px] text-4xl font-black uppercase leading-[0.96] sm:text-5xl lg:text-[64px]">
            Sifatli va ishonchli <span className="text-[#202020]">massaj aparati</span>
          </h1>
          <div className="mt-6 inline-flex rounded-full bg-[#ffd45e] px-5 py-3 text-sm font-bold text-[#171717] shadow-soft sm:text-base">
            O‘zbekiston bo‘ylab bepul yetkazib beramiz
          </div>
          <p className="mt-6 max-w-[560px] text-base leading-7 text-white/95 sm:text-lg">
            Ushbu massajor apparati orqali yoshi katta yaqinlaringizni juda katta azobdan qutqarasiz.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {heroFeatures.map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-4 backdrop-blur-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold leading-5 text-white">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <a href="#order" className="pill-btn bg-white text-brand shadow-soft">
              Buyurtma berish
            </a>
          </div>
        </div>

        <div className="relative z-10">
          <SliderFrame images={heroSlides} alt="Massajor hero gallery" />
        </div>
      </div>
    </section>
  );
}
