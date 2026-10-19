import type { Metadata } from "next";

import { ServiceForm } from "@/components/services/service-form";

export const metadata: Metadata = { title: "Offer a service" };

export default function NewServicePage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <ServiceForm
        initialFields={{
          title: "",
          description: "",
          price: "",
          priceUnit: "hour",
        }}
        mode="create"
      />
    </main>
  );
}
