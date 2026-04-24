import { HeartPulse, ShieldCheck, Thermometer, Zap, MapPin, Phone, CheckCircle2 } from 'lucide-react';

export const contact = {
  location: "O'zbekiston, Toshkent",
  phone: '+998 33 106 66 67',
  footerPhone: '+998 33 002 66 67'
};

export const heroSlides = [
  'https://static.tildacdn.one/tild3332-6331-4265-b236-643033353036/im1.jpg',
  'https://static.tildacdn.one/tild3935-6663-4461-b962-383132653630/im2.jpg',
  'https://static.tildacdn.one/tild3339-6537-4138-b064-366235356233/im3.jpg',
  'https://static.tildacdn.one/tild3832-3766-4431-a562-646638653661/im4.jpg'
];

export const gallerySlides = [
  'https://static.tildacdn.one/tild3839-3961-4238-b364-343230333536/im5.jpg',
  'https://static.tildacdn.one/tild3864-6535-4639-b630-633532356164/im5.jpg',
  'https://static.tildacdn.one/tild6364-3165-4263-a565-336363636363/im4.jpg',
  'https://static.tildacdn.one/tild3964-6464-4263-a635-623765336134/im6.jpg'
];

export const benefits = [
  {
    title: '6 xil massaj rejimi',
    description: 'Har xil massaj turlarini sinab ko‘ring',
    icon: Zap,
    tint: 'bg-orange-50 text-brand'
  },
  {
    title: 'Isitish funksiyasi',
    description: 'Oyoqlaringizni iliq saqlaydi',
    icon: Thermometer,
    tint: 'bg-red-50 text-red-500'
  },
  {
    title: 'Sog‘liqqa foyda',
    description: 'Qon aylanishini yaxshilaydi',
    icon: HeartPulse,
    tint: 'bg-emerald-50 text-emerald-500'
  },
  {
    title: '1 yil kafolat',
    description: 'Sifat kafolatlanadi',
    icon: ShieldCheck,
    tint: 'bg-sky-50 text-sky-500'
  }
];

export const heroFeatures = [
  { label: 'Ishonchli va qulay', icon: CheckCircle2 },
  { label: '6 xil rejim', icon: Zap },
  { label: 'Qulay to‘lov', icon: CheckCircle2 }
];

export const checks = [
  'Oyoq og‘rig‘ini bartaraf etadi',
  'Qon aylanishini yaxshilaydi',
  'Stress va charchoqni kamaytiradi',
  'Uy sharoitida professional massaj'
];

export const footerItems = [
  { label: contact.location, icon: MapPin },
  { label: contact.phone, icon: Phone }
];
