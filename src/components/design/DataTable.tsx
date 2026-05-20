'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import React from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
  className?: string;
  headerClassName?: string;
  sticky?: 'left' | 'right';
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
  groupBy?: (row: T) => string;
  groupHeader?: (group: string, rows: T[]) => React.ReactNode;
  empty?: React.ReactNode;
  className?: string;
  minWidth?: string;
  rowClassName?: (row: T, index: number) => string;
  dense?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  groupBy,
  groupHeader,
  empty,
  className,
  minWidth = '700px',
  rowClassName,
  dense,
}: DataTableProps<T>) {
  const alignClass = (a?: 'left' | 'right' | 'center') =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  const stickyClass = (s?: 'left' | 'right') =>
    s === 'left' ? 'sticky left-0 bg-card z-[1]' : s === 'right' ? 'sticky right-0 bg-card z-[1]' : '';

  if (data.length === 0 && empty) {
    return <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>{empty}</div>;
  }

  const groups: { name: string | null; rows: { row: T; idx: number }[] }[] = (() => {
    if (!groupBy) return [{ name: null, rows: data.map((row, idx) => ({ row, idx })) }];
    const map: Record<string, { row: T; idx: number }[]> = {};
    const order: string[] = [];
    data.forEach((row, idx) => {
      const g = groupBy(row);
      if (!map[g]) {
        map[g] = [];
        order.push(g);
      }
      map[g].push({ row, idx });
    });
    return order.map((name) => ({ name, rows: map[name] }));
  })();

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card overflow-hidden shadow-soft',
        className,
      )}
    >
      <div className="overflow-x-auto custom-scrollbar">
        <table className="data-table" style={{ minWidth }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(alignClass(c.align), stickyClass(c.sticky), c.headerClassName)}
                  style={{ width: c.width }}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((grp, gi) => (
              <React.Fragment key={grp.name ?? `__nogrp-${gi}`}>
                {grp.name !== null && (
                  <tr className="bg-muted/60">
                    <td colSpan={columns.length} className="!py-2 !px-5 border-y border-border">
                      {groupHeader ? groupHeader(grp.name, grp.rows.map((r) => r.row)) : (
                        <span className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
                          <span className="h-1 w-1 rounded-full bg-primary" />
                          {grp.name}
                        </span>
                      )}
                    </td>
                  </tr>
                )}
                {grp.rows.map(({ row, idx }) => (
                  <motion.tr
                    key={rowKey(row, idx)}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(idx * 0.015, 0.2), ease: [0.22, 1, 0.36, 1] }}
                    onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
                    className={cn(
                      onRowClick && 'cursor-pointer',
                      dense && '[&>td]:!py-2',
                      rowClassName?.(row, idx),
                    )}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(alignClass(c.align), stickyClass(c.sticky), c.className)}
                        style={{ width: c.width }}
                      >
                        {c.cell(row, idx)}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
