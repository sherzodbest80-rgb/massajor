import { MapPin, Phone } from 'lucide-react';
import { contact } from '@/lib/data';

export function SiteHeader() {
  return (
    <header className="bg-[#1d1d1d] text-white">
      <div className="container-shell flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <a href="#top" className="text-2xl font-black tracking-[0.24em] text-white">
          MASSA<span className="text-brand">JOR</span>
        </a>

        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:gap-6">
          <div className="inline-flex items-center gap-2 text-white/75">
            <MapPin className="h-4 w-4 text-brand" />
            <span>{contact.location}</span>
          </div>
          <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 font-semibold text-brand">
            <Phone className="h-4 w-4" />
            <span>{contact.phone}</span>
          </a>
        </div>
      </div>
    </header>
  );
}
