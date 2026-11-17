import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { TableSkeleton } from "@/components/page-skeleton";
import { ClickableRow } from "@/components/clickable-row";
import { Pagination } from "@/components/pagination";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddCustomerButton } from "./add-customer-button";
import { getContext } from "@/lib/auth";
import { escapeRegex } from "@/lib/utils";
import { formatDate, initials, timeAgo, formatNumber } from "@/lib/format";
import { Customer } from "@/models";

export const metadata = { title: "Customers" };

const PAGE_SIZE = 25;

export default function CustomersPage({ searchParams }) {
  return (
    <div className="mx-auto max-w-7xl space-y-3">
      <PageHeader title="Customers" description="Shared across all stores. Search by name, mobile or customer number.">
        <Suspense fallback={null}>
          <AddCustomerButton />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<div className="h-9" />}>
        <SearchInput placeholder="Search name, mobile, customer no…  ( / )" />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <CustomerTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CustomerTable({ searchParams }) {
  const ctx = await getContext();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const filter = {};
  if (q) {
    const digits = q.replace(/\D/g, "");
    filter.$or = [{ name: new RegExp(escapeRegex(q), "i") }];
    if (digits.length >= 3) filter.$or.push({ mobile: new RegExp(digits) });
    if (/^\d{1,6}$/.test(q)) filter.$or.push({ customerNo: Number(q) });
  }

  const [rows, total] = await Promise.all([
    Customer.find(filter).sort({ lastVisitAt: -1, createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    Customer.countDocuments(filter),
  ]);
  const storeName = Object.fromEntries(ctx.stores.map((s) => [s.id, s.code]));

  return (
    <Card className="gap-0 py-1">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Customer</TableHead>
            <TableHead className="hidden sm:table-cell">Mobile</TableHead>
            <TableHead className="hidden md:table-cell">Gender / Age</TableHead>
            <TableHead className="hidden lg:table-cell">Referred by</TableHead>
            <TableHead className="hidden sm:table-cell">Last visit</TableHead>
            <TableHead className="hidden pr-4 text-right md:table-cell">Added at</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                {q ? `No customer found for “${q}”` : "No customers yet"}
              </TableCell>
            </TableRow>
          )}
          {rows.map((c) => (
            <ClickableRow key={String(c._id)} href={`/customers/${c._id}`}>
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(c.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/customers/${c._id}`} className="font-medium hover:underline">{c.name}</Link>
                    <div className="text-xs text-muted-foreground"><span className="font-mono sm:hidden">{c.mobile} · </span>#{c.customerNo}{c.category === "VIP" && <Badge variant="secondary" className="ml-2 h-4">VIP</Badge>}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden font-mono text-sm sm:table-cell">{c.mobile}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{[c.gender && c.gender[0].toUpperCase() + c.gender.slice(1), c.age && `${c.age} yrs`].filter(Boolean).join(" · ") || "—"}</TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">{c.referDoctor || "—"}</TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="text-sm">{formatDate(c.lastVisitAt)}</div>
                <div className="text-xs text-muted-foreground">{timeAgo(c.lastVisitAt)}</div>
              </TableCell>
              <TableCell className="hidden pr-4 text-right md:table-cell">
                <Badge variant="outline">{storeName[String(c.createdAtStoreId)] ?? "—"}</Badge>
              </TableCell>
            </ClickableRow>
          ))}
        </TableBody>
      </Table>
      <div className="border-t pt-2 pb-1">
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} searchParams={{ q }} basePath="/customers" />
      </div>
      <p className="sr-only">{formatNumber(total)} customers</p>
    </Card>
  );
}
