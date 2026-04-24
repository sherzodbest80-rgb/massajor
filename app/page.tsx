import { Benefits } from '@/components/benefits';
import { CtaBand } from '@/components/cta-band';
import { Hero } from '@/components/hero';
import { OrderSection } from '@/components/order-section';
import { ProductShowcase } from '@/components/product-showcase';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <Hero />
      <Benefits />
      <ProductShowcase />
      <CtaBand />
      <OrderSection />
      <SiteFooter />
    </main>
  );
}
