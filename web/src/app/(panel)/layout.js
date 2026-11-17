import { Suspense } from "react";
import Link from "next/link";
import { Glasses } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TopNav, BottomNav } from "@/components/layout/nav";
import { GlobalSearch } from "@/components/layout/global-search";
import { StoreSwitcher } from "@/components/layout/store-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { getContext } from "@/lib/auth";

export default function PanelLayout({ children }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="no-print sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-13 max-w-[1600px] items-center gap-2 px-3 md:gap-4 md:px-4">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Glasses className="size-4" />
            </span>
            <span className="hidden sm:inline">EyeFit</span>
          </Link>
          <Suspense fallback={null}>
            <NavSession />
          </Suspense>
          <div className="flex flex-1 justify-end lg:justify-center">
            <Suspense fallback={null}>
              <GlobalSearch />
            </Suspense>
          </div>
          <Suspense fallback={<HeaderSkeleton />}>
            <HeaderSession />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 p-3 pb-24 md:p-4 md:pb-6">{children}</main>
      <Suspense fallback={null}>
        <NavSession mobile />
      </Suspense>
    </div>
  );
}

async function NavSession({ mobile }) {
  const ctx = await getContext();
  return mobile ? <BottomNav isOwner={ctx.isOwner} canManage={ctx.canManage} /> : <TopNav isOwner={ctx.isOwner} canManage={ctx.canManage} />;
}

async function HeaderSession() {
  const ctx = await getContext();
  return (
    <div className="flex shrink-0 items-center gap-2">
      <StoreSwitcher stores={ctx.stores} activeStoreId={ctx.activeStoreId} isOwner={ctx.isOwner} />
      <UserMenu user={ctx.user} isOwner={ctx.isOwner} />
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-28 rounded-full md:w-44" />
      <Skeleton className="size-8 rounded-full" />
    </div>
  );
}
