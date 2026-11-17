import Link from "next/link";
import { Glasses, Store, Receipt, Boxes, ArrowLeft } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-white/15">
            <Glasses className="size-5" />
          </div>
          EyeFit
        </div>
        <div className="relative z-10 max-w-md space-y-6">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Run all your optical stores from one place.
          </h1>
          <ul className="space-y-3 text-primary-foreground/80">
            <li className="flex items-center gap-3"><Store className="size-5" /> 3 stores, one dashboard</li>
            <li className="flex items-center gap-3"><Receipt className="size-5" /> Eye test to bill in under a minute</li>
            <li className="flex items-center gap-3"><Boxes className="size-5" /> Live stock for every branch</li>
          </ul>
        </div>
        <p className="text-sm text-primary-foreground/60">© EyeFit Opticals</p>
        <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -right-10 top-24 size-40 rounded-full bg-white/5" />
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to website
          </Link>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-lg font-semibold lg:hidden">
              <Glasses className="size-5 text-primary" /> EyeFit
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to continue to your store panel.</p>
          </div>
          <LoginForm />
          <div className="rounded-3xl border border-dashed p-4 text-xs text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">Demo logins</p>
            <p><span className="font-mono">owner / owner123</span>: all stores</p>
            <p><span className="font-mono">ef1 / staff123</span>: Main Market (manager)</p>
            <p><span className="font-mono">ef2 / staff123</span>: Station Road (staff)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
