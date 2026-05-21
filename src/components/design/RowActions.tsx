'use client';

import { Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RowActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  editTitle?: string;
  disabled?: boolean;
}

export function RowActions({ onEdit, onDelete, editTitle = 'Szerkesztés', disabled }: RowActionsProps) {
  if (disabled) return null;

  return (
    <div className="flex items-center justify-end gap-0.5">
      {onEdit ? (
        <Button
          variant="ghost"
          size="icon-sm"
          title={editTitle}
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground"
        >
          <Edit3 size={13} />
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={13} />
        </Button>
      ) : null}
    </div>
  );
}
