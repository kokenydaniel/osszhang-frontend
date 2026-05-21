'use client';

import * as React from 'react';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FieldHint } from '@/components/ui/FieldHint';
import classNames from 'classnames';

interface FormFieldProps {
  label: React.ReactNode;
  info?: React.ReactNode;
  /** Magyarázat az input alatt — így párhuzamos mezők egy vonalban maradnak. */
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Címke + mező + opcionális hint (hint mindig a mező alatt). */
export function FormField({ label, info, hint, required, children, className }: FormFieldProps) {
  return (
    <div className={classNames('flex flex-col gap-1.5', className)}>
      <FieldLabel info={info} required={required}>
        {label}
      </FieldLabel>
      {children}
      {hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}
