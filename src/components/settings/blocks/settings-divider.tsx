'use client';

export function SettingsDivider({ label }: { label?: string }) {
  if (label) {
    return (
      <div className="flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
          {label}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }
  return <div className="h-px bg-border my-2" />;
}
