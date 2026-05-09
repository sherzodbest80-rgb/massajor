import { Suspense } from "react";
import type { Metadata } from "next";
import InternalLeadForm from "@/components/InternalLeadForm";

export const metadata: Metadata = {
  title: "Bepul konsultatsiya | Massajor",
  description:
    "Telefoningizni qoldiring, biz siz bilan tez orada bog'lanamiz. Bepul yetkazib berish.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ZayavkaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F8FC] flex items-center justify-center text-slate-600">
          Yuklanmoqda...
        </div>
      }
    >
      <InternalLeadForm />
    </Suspense>
  );
}
