import { footerItems, contact } from '@/lib/data';

export function SiteFooter() {
  return (
    <footer className="bg-[#1d1d1d] py-12 text-center text-white">
      <div className="container-shell">
        <div className="text-3xl font-black tracking-[0.24em] text-white">
          MASSA<span className="text-brand">JOR</span>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 text-sm text-white/70 sm:flex-row sm:gap-8">
          {footerItems.map(({ label, icon: Icon }) => (
            <div key={label} className="inline-flex items-center gap-2">
              <Icon className="h-4 w-4 text-brand" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <a href={`tel:${contact.footerPhone.replace(/\s+/g, '')}`} className="mt-6 block text-2xl font-extrabold text-brand sm:text-3xl">
          {contact.footerPhone}
        </a>
        <p className="mt-4 text-sm text-white/45">© 2026 MASSAJOR. Barcha huquqlar himoyalangan.</p>
      </div>
    </footer>
  );
}
