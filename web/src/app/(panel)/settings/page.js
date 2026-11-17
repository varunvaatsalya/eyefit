import { Suspense } from "react";
import { Store as StoreIcon, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/page-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getContext } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/constants";
import { Store, User } from "@/models";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <PageHeader title="Settings" description="Stores, staff logins and permissions." />
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <SettingsBody />
      </Suspense>
    </div>
  );
}

async function SettingsBody() {
  const ctx = await getContext();
  if (!ctx.isOwner) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-6 text-muted-foreground">
          <ShieldCheck className="size-5" /> Only the owner can change settings.
        </CardContent>
      </Card>
    );
  }
  const [stores, users] = await Promise.all([Store.find().sort({ code: 1 }).lean(), User.find().sort({ role: 1, name: 1 }).lean()]);
  const code = Object.fromEntries(stores.map((s) => [String(s._id), s.code]));

  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        {stores.map((s) => (
          <Card key={String(s._id)} size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><StoreIcon className="size-4 text-primary" /> {s.name}</CardTitle>
              <CardDescription>{s.address}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Phone:</span> {s.phone}</p>
              <p><span className="text-muted-foreground">GSTIN:</span> {s.gstin || "—"}</p>
              <p><span className="text-muted-foreground">Bill prefix:</span> <span className="font-mono">{s.invoicePrefix}-00001</span></p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="gap-2">
        <CardHeader>
          <CardTitle>Staff logins</CardTitle>
          <CardDescription>Owner sees all stores. Managers and staff are locked to their store; staff cannot cancel bills or edit products.</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="pr-4">Stores</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={String(u._id)}>
                <TableCell className="pl-4 font-medium">{u.name}</TableCell>
                <TableCell className="font-mono text-sm">{u.username}</TableCell>
                <TableCell><Badge variant={u.role === "owner" ? "default" : "secondary"}>{ROLE_LABEL[u.role]}</Badge></TableCell>
                <TableCell className="pr-4">
                  <div className="flex gap-1">{u.storeIds.map((id) => <Badge key={String(id)} variant="outline">{code[String(id)]}</Badge>)}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="text-xs text-muted-foreground">Adding/editing stores and staff from this screen is planned for the next phase.</p>
    </>
  );
}
