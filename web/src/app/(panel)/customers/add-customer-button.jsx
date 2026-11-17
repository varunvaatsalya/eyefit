"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerDialog } from "@/components/customers/customer-dialog";

export function AddCustomerButton() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(searchParams.get("new") === "1");

  const onOpenChange = (o) => {
    setOpen(o);
    if (!o && searchParams.get("new")) router.replace(pathname);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus /> Add customer
      </Button>
      <CustomerDialog open={open} onOpenChange={onOpenChange} />
    </>
  );
}
