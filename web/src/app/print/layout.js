import { Suspense } from "react";
import { PrintToolbar } from "./print-toolbar";

export default function PrintLayout({ children }) {
  return (
    <div className="min-h-svh bg-muted/40 print:bg-white">
      <Suspense fallback={null}>
        <PrintToolbar />
      </Suspense>
      <div className="mx-auto my-6 max-w-[800px] bg-white p-8 text-[13px] text-black shadow-sm print:my-0 print:max-w-none print:p-0 print:shadow-none">
        {children}
      </div>
    </div>
  );
}
