export function PageHeader({ title, description, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight md:text-xl">{title}</h1>
        {description && <p className="hidden text-xs text-muted-foreground sm:block">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
