'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import classNames from 'classnames';
import { dayjs, d, today, DATE_FORMAT, DISPLAY_FORMAT_LONG } from '@/lib/dates';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

const CALENDAR_HEIGHT = 340;

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Válassz dátumot',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 288 });
  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => (value ? d(value) : dayjs()));
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDate = value ? d(value) : null;

  useEffect(() => setMounted(true), []);

  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.min(288, window.innerWidth - 16);
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < CALENDAR_HEIGHT && rect.top > CALENDAR_HEIGHT;
    setOpenUp(placeAbove);
    let left = rect.left;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    if (left < 8) left = 8;
    setCoords({
      left,
      width,
      top: placeAbove ? rect.top - 8 : rect.bottom + 8,
    });
  };

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      const portal = document.getElementById('datepicker-portal-root');
      if (portal?.contains(target)) return;
      setIsOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const calendarDays = (() => {
    const monthStart = currentMonth.startOf('month');
    const monthEnd = currentMonth.endOf('month');
    const startDate = monthStart.startOf('isoWeek');
    const endDate = monthEnd.endOf('isoWeek');
    const days = [];
    let cursor = startDate;
    while (cursor.isBefore(endDate) || cursor.isSame(endDate, 'day')) {
      days.push(cursor);
      cursor = cursor.add(1, 'day');
    }
    return days;
  })();

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-3 px-1">
      <button
        type="button"
        onClick={() => setCurrentMonth((m) => m.subtract(1, 'month'))}
        className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={15} />
      </button>
      <div className="text-sm font-medium capitalize text-foreground">
        {currentMonth.format('YYYY. MMMM')}
      </div>
      <button
        type="button"
        onClick={() => setCurrentMonth((m) => m.add(1, 'month'))}
        className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );

  const renderDays = () => {
    const days = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
    return (
      <div className="grid grid-cols-7 mb-1">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = currentMonth.startOf('month');
    const todayDate = dayjs();

    return (
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((cellDate) => {
          const isSelected = selectedDate?.isSame(cellDate, 'day') ?? false;
          const isCurrentMonth = cellDate.isSame(monthStart, 'month');
          const isToday = cellDate.isSame(todayDate, 'day');

          return (
            <button
              key={cellDate.format(DATE_FORMAT)}
              type="button"
              onClick={() => {
                onChange(cellDate.format(DATE_FORMAT));
                setIsOpen(false);
              }}
              className={classNames(
                'h-9 flex items-center justify-center text-xs rounded-md transition-colors touch-manipulation',
                isSelected && 'bg-primary text-primary-foreground font-semibold',
                !isSelected && isToday && 'border border-primary/50 text-primary font-semibold',
                !isSelected && !isToday && 'hover:bg-muted text-foreground active:bg-muted',
                !isCurrentMonth && !isSelected && 'opacity-35',
              )}
            >
              {cellDate.format('D')}
            </button>
          );
        })}
      </div>
    );
  };

  const calendarPanel = isOpen && mounted && (
    <div
      id="datepicker-portal-root"
      role="dialog"
      aria-label="Naptár"
      className="fixed z-[500] rounded-lg border border-border bg-popover p-3 shadow-lg animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: coords.left,
        width: coords.width,
        ...(openUp ? { bottom: window.innerHeight - coords.top } : { top: coords.top }),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      <div className="mt-3 pt-3 border-t border-border flex justify-between gap-2">
        <button
          type="button"
          className="px-3 py-1.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors touch-manipulation"
          onClick={() => {
            onChange('');
            setIsOpen(false);
          }}
        >
          Törlés
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors touch-manipulation"
          onClick={() => {
            onChange(today());
            setIsOpen(false);
          }}
        >
          Ma
        </button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={classNames('relative w-full', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={classNames(
          'flex w-full items-center gap-2.5 h-9 px-3 bg-input border border-border rounded-md',
          'cursor-pointer hover:border-foreground/20 transition-colors text-sm text-left touch-manipulation',
          isOpen && 'border-primary/50 ring-2 ring-primary/20',
        )}
      >
        <CalendarIcon size={15} className="text-muted-foreground shrink-0" />
        <span className={classNames('flex-1 truncate', value ? 'text-foreground' : 'text-muted-foreground')}>
          {value ? d(value).format(DISPLAY_FORMAT_LONG) : placeholder}
        </span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            className="ml-auto text-muted-foreground hover:text-destructive transition-colors p-0.5 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onChange('');
              }
            }}
          >
            <X size={14} />
          </span>
        )}
      </button>

      {typeof document !== 'undefined' && createPortal(calendarPanel, document.body)}
    </div>
  );
};
