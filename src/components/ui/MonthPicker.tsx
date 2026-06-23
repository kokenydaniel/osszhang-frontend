'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import classNames from 'classnames';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { dayjs, formatYearMonth, parseYearMonthInput } from '@/utils/dates';

export type MonthPickerProps = {
  value: string;
  onChange: (yearMonth: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

const INPUT_PLACEHOLDER = 'éééé. hónap';

function parseYearMonth(value: string): { year: number; month: number } | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const [year, month] = value.split('-').map(Number);
  if (!year || month < 1 || month > 12) return null;
  return { year, month };
}

export function MonthPicker({
  value,
  onChange,
  placeholder = 'Válassz hónapot',
  className,
  disabled,
}: MonthPickerProps) {
  const parsed = parseYearMonth(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => parsed?.year ?? dayjs().year());
  const [inputText, setInputText] = useState(() => formatYearMonth(value));
  const [isFocused, setIsFocused] = useState(false);
  const [inputInvalid, setInputInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setInputText(formatYearMonth(value));
      setInputInvalid(false);
    }
  }, [value, isFocused]);

  useEffect(() => {
    if (parsed) setViewYear(parsed.year);
  }, [value, parsed?.year]);

  const commitInput = (): boolean => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      onChange('');
      setInputText('');
      setInputInvalid(false);
      return true;
    }

    const parsedMonth = parseYearMonthInput(trimmed);
    if (parsedMonth === null) {
      setInputInvalid(true);
      setInputText(formatYearMonth(value));
      return false;
    }

    onChange(parsedMonth);
    setInputText(formatYearMonth(parsedMonth));
    setInputInvalid(false);
    setViewYear(Number(parsedMonth.slice(0, 4)));
    return true;
  };

  const monthLabels = Array.from({ length: 12 }, (_, index) =>
    dayjs().month(index).format('MMMM'),
  );

  const selectMonth = (month: number) => {
    const yearMonth = `${viewYear}-${String(month).padStart(2, '0')}`;
    onChange(yearMonth);
    setInputText(formatYearMonth(yearMonth));
    setInputInvalid(false);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className={classNames('relative w-full', className)}>
        <div
          className={classNames(
            'flex w-full items-center gap-2 h-9 px-3 bg-input border border-border rounded-md',
            'hover:border-foreground/20 transition-colors text-sm touch-manipulation',
            (isOpen || isFocused) && !disabled && 'border-primary/50 ring-2 ring-primary/20',
            inputInvalid && 'border-destructive ring-2 ring-destructive/20',
            disabled && 'opacity-50 pointer-events-none cursor-not-allowed',
          )}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Hónapválasztó megnyitása"
              onClick={(e) => {
                if (isOpen) {
                  e.preventDefault();
                  setIsOpen(false);
                }
              }}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 -ml-0.5"
            >
              <CalendarIcon size={15} />
            </button>
          </PopoverTrigger>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            aria-invalid={inputInvalid}
            placeholder={placeholder === 'Válassz hónapot' ? INPUT_PLACEHOLDER : placeholder}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setInputInvalid(false);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              commitInput();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (commitInput()) setIsOpen(false);
              }
              if (e.key === 'Escape') {
                setInputText(formatYearMonth(value));
                setInputInvalid(false);
                setIsOpen(false);
                inputRef.current?.blur();
              }
              if (e.key === 'ArrowDown' && !isOpen) {
                e.preventDefault();
                setIsOpen(true);
              }
            }}
            className="flex-1 min-w-0 bg-transparent outline-none text-foreground placeholder:text-muted-foreground capitalize"
          />
          {value ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Hónap törlése"
              className="text-muted-foreground hover:text-destructive transition-colors p-0.5 shrink-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange('');
                setInputText('');
                setInputInvalid(false);
                setIsOpen(false);
              }}
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      <PopoverContent
        elevated
        align="start"
        className="w-[288px] p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (inputRef.current?.contains(e.target as Node)) {
            e.preventDefault();
          }
        }}
      >
        <div className="flex justify-between items-center mb-3 px-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setViewYear((year) => year - 1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={15} />
          </Button>
          <div className="text-sm font-medium text-foreground">{viewYear}</div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setViewYear((year) => year + 1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronRight size={15} />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {monthLabels.map((label, index) => {
            const month = index + 1;
            const isSelected = parsed?.year === viewYear && parsed?.month === month;
            const isCurrent = dayjs().year() === viewYear && dayjs().month() + 1 === month;

            return (
              <button
                key={month}
                type="button"
                onClick={() => selectMonth(month)}
                className={classNames(
                  'h-9 rounded-md text-xs font-medium capitalize transition-colors touch-manipulation',
                  isSelected && 'bg-primary text-primary-foreground',
                  !isSelected && isCurrent && 'border border-primary/50 text-primary',
                  !isSelected && !isCurrent && 'hover:bg-muted text-foreground active:bg-muted',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-border flex justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              onChange('');
              setInputText('');
              setInputInvalid(false);
              setIsOpen(false);
            }}
          >
            Törlés
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => {
              const now = dayjs();
              const yearMonth = now.format('YYYY-MM');
              onChange(yearMonth);
              setInputText(formatYearMonth(yearMonth));
              setViewYear(now.year());
              setInputInvalid(false);
              setIsOpen(false);
            }}
          >
            Aktuális hónap
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
