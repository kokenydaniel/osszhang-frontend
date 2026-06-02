'use client';

export function SettingsSectionHeading({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {badge}
      </div>
      {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
    </div>
  );
}
