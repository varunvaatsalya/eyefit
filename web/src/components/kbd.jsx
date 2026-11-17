import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground select-none group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  );
}
