'use client';

export function MemberCard({
  initials,
  name,
  username,
  badges,
  actions,
  permissions,
}: {
  initials: string;
  name: string;
  username: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  permissions: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden hover:border-primary/15 transition-colors">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 bg-gradient-to-r from-primary/[0.04] to-transparent border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-primary to-violet-600 text-primary-foreground text-sm font-bold flex items-center justify-center shadow-md">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground flex flex-wrap items-center gap-2">{name}</p>
            <p className="text-sm text-muted-foreground truncate mt-0.5">@{username}</p>
            {badges && <div className="flex flex-wrap gap-1.5 mt-2">{badges}</div>}
          </div>
        </div>
        {actions && (
          <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:max-w-[min(100%,280px)] sm:shrink-0 [&_button]:shrink-0 [&_select]:min-w-0 [&_select]:max-w-full [&_select]:flex-1 sm:[&_select]:w-auto sm:[&_select]:flex-none">
            {actions}
          </div>
        )}
      </div>
      <div className="px-4 sm:px-5 py-4 bg-muted/10">
        <p className="text-xs font-medium text-muted-foreground mb-2.5">Hozzáférés modulokhoz</p>
        <div className="flex flex-wrap gap-1.5">{permissions}</div>
      </div>
    </div>
  );
}
