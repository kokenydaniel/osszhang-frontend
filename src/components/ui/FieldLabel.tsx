'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { FieldHint } from '@/components/ui/FieldHint';
import classNames from 'classnames';

interface FieldLabelProps extends React.ComponentProps<typeof Label> {
  info?: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
}

export function FieldLabel({ info, hint, children, className, required, ...props }: FieldLabelProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 min-h-[1.125rem]">
        <Label className={classNames('text-xs font-medium', className)} {...props}>
          {children}
          {required ? <span className="text-destructive ml-0.5" aria-hidden>*</span> : null}
        </Label>
        {info ? <InfoTooltip content={info} side="top" label={`${children} – további információ`} /> : null}
      </div>
      {hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}
