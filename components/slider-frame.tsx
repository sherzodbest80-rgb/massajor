'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function SliderFrame({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const prev = () => setIndex((value) => (value - 1 + images.length) % images.length);
  const next = () => setIndex((value) => (value + 1) % images.length);

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="card-surface relative overflow-hidden rounded-[32px] bg-white p-5 sm:p-8">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-white">
          <Image src={images[index]} alt={alt} fill className="object-contain" priority />
        </div>
      </div>

      <button
        aria-label="Previous slide"
        onClick={prev}
        className="absolute left-0 top-1/2 inline-flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-soft transition hover:scale-105"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Next slide"
        onClick={next}
        className="absolute right-0 top-1/2 inline-flex h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-soft transition hover:scale-105"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
