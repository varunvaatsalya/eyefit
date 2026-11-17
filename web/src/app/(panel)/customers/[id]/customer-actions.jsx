"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil, ShoppingBag } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CustomerDialog } from "@/components/customers/customer-dialog";
import { RxDialog } from "@/components/rx/rx-dialog";

export function CustomerActions({ customer, lastRx }) {
  const [edit, setEdit] = useState(false);
  const [rx, setRx] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setEdit(true)}>
        <Pencil /> Edit
      </Button>
      <Button variant="outline" onClick={() => setRx(true)}>
        <Eye /> New eye test
      </Button>
      <Link href={`/sales/new?customer=${customer._id}`} className={buttonVariants()}>
        <ShoppingBag /> New sale
      </Link>
      <CustomerDialog open={edit} onOpenChange={setEdit} customer={customer} />
      <RxDialog open={rx} onOpenChange={setRx} customerId={customer._id} lastRx={lastRx} />
    </>
  );
}
