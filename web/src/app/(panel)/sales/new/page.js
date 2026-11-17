import { Suspense } from "react";
import mongoose from "mongoose";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { SaleForm } from "./sale-form";
import { PickStore } from "./pick-store";
import { getContext } from "@/lib/auth";
import { getCustomerForSale } from "@/actions/customers";

export const metadata = { title: "New Sale" };

export default function NewSalePage({ searchParams }) {
  return (
    <div className="space-y-3">
      <PageHeader title="New Sale" description="Customer → eye test → items → payment. Everything on one screen." />
      <Suspense fallback={<SaleSkeleton />}>
        <NewSale searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewSale({ searchParams }) {
  const ctx = await getContext();
  const sp = await searchParams;
  if (!ctx.activeStore) return <PickStore stores={ctx.stores} />;

  let initialCustomer = null;
  if (sp.customer && mongoose.isValidObjectId(sp.customer)) {
    initialCustomer = await getCustomerForSale(sp.customer);
  }
  return <SaleForm key={sp.customer ?? "blank"} storeName={ctx.activeStore.name} initialCustomer={initialCustomer} />;
}

function SaleSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[1fr_300px] xl:grid-cols-[5fr_6fr_310px]">
      <div className="space-y-3">
        <Skeleton className="h-36 rounded-4xl" />
        <Skeleton className="h-24 rounded-4xl" />
        <Skeleton className="h-64 rounded-4xl" />
      </div>
      <Skeleton className="h-[480px] rounded-2xl" />
    </div>
  );
}
