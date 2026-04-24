import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { checks, gallerySlides } from '@/lib/data';
import { SliderFrame } from './slider-frame';

export function ProductShowcase() {
  return (
    <section className="section-space bg-white pt-0">
      <div className="container-shell grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <SliderFrame images={gallerySlides} alt="Massajor product gallery" />

        <div>
          <h2 className="text-3xl font-black leading-tight tracking-tight text-ink sm:text-4xl lg:text-[44px]">
            Premium sifatli <span className="text-brand">massajor</span>
          </h2>
          <p className="mt-6 max-w-[560px] text-[17px] leading-8 text-muted">
            Ushbu massajor aparati orqali yoshi katta yaqinlaringiz juda katta azobdan qutqarasiz. Kuniga atigi 20 daqiqa bilan oyoq og‘rig‘i, charchoq va stressni kamaytirishga yordam beradi.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {checks.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl bg-brand/5 px-4 py-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <span className="text-sm font-semibold leading-6 text-ink">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <a href="#order" className="pill-btn bg-brand text-white shadow-cta">
              Hoziroq buyurtma bering <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
