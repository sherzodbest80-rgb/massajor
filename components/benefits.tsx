import { benefits } from '@/lib/data';

export function Benefits() {
  return (
    <section className="section-space bg-white">
      <div className="container-shell">
        <h2 className="section-title max-w-[920px] mx-auto">
          Nima uchun ushbu <span className="accent">massajorni</span> xarid qilishingiz kerak?
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map(({ title, description, icon: Icon, tint }) => (
            <article key={title} className="card-surface h-full p-6">
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${tint}`}>
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-ink">{title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-muted">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
