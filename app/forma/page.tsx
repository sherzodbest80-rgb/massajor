import { Suspense } from "react";
import type { Metadata } from "next";
import InternationalLeadForm from "@/components/InternationalLeadForm";

export const metadata: Metadata = {
  title: "Ota-onangizni xursand qiling | Massajor",
  description:
    "Masofadan turib ota-onangizni xursand qiling. O'zbekiston bo'ylab bepul yetkazib berish.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FormaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#042C53] flex items-center justify-center text-white">
          Yuklanmoqda...
        </div>
      }
    >
      <InternationalLeadForm />
    </Suspense>
  );
}
