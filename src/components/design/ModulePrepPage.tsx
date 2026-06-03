'use client';

import { Construction } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/design';

export function ModulePrepPage({
  title,
  description,
  plannedFeatures,
  settingsNote,
}: {
  title: string;
  description: string;
  plannedFeatures?: string[];
  settingsNote?: string;
}) {
  return (
    <div className="flex flex-col gap-6 max-w-[900px] mx-auto w-full">
      <PageHeader breadcrumbs={[{ label: title }]} title={title} description={description} />

      <EmptyState
        icon={Construction}
        title="Felület hamarosan"
        description="Az alap adatmodell és API már működik. A teljes kezelőfelület következő lépésben készül el."
      />

      {plannedFeatures && plannedFeatures.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Mit fog tartalmazni</h3>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            {plannedFeatures.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {settingsNote ? (
        <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-4">
          {settingsNote}
        </p>
      ) : null}
    </div>
  );
}
