'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import classNames from 'classnames';
import { dayjs, toDayjs, today, DATE_FORMAT, DISPLAY_FORMAT, parseDateInput } from '@/utils/dates';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

const INPUT_PLACEHOLDER = 'éééé.hh.nn.';

function formatInputValue(dateStr: string): string {
  if (!dateStr) return '';
  const parsed = toDayjs(dateStr);
  return parsed.isValid() ? parsed.format(DISPLAY_FORMAT) : '';
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Válassz dátumot',
  className = '',
  disabled = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => (value ? toDayjs(value) : dayjs()));
  const [inputText, setInputText] = useState(() => formatInputValue(value));
  const [isFocused, setIsFocused] = useState(false);
  const [inputInvalid, setInputInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedDate = value ? toDayjs(value) : null;

  useEffect(() => {
    if (!isFocused) {
      setInputText(formatInputValue(value));
      setInputInvalid(false);
    }
  }, [value, isFocused]);

  useEffect(() => {
    if (value) setCurrentMonth(toDayjs(value));
  }, [value]);

  const commitInput = (): boolean => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      onChange('');
      setInputText('');
      setInputInvalid(false);
      return true;
    }

    const parsed = parseDateInput(trimmed);
    if (parsed === null) {
      setInputInvalid(true);
      setInputText(formatInputValue(value));
      return false;
    }

    onChange(parsed);
    setInputText(formatInputValue(parsed));
    setInputInvalid(false);
    setCurrentMonth(toDayjs(parsed));
    return true;
  };

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
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setCurrentMonth((m) => m.subtract(1, 'month'))}
        className="text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft size={15} />
      </Button>
      <div className="text-sm font-medium capitalize text-foreground">
        {currentMonth.format('YYYY. MMMM')}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setCurrentMonth((m) => m.add(1, 'month'))}
        className="text-muted-foreground hover:text-foreground"
      >
        <ChevronRight size={15} />
      </Button>
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
                setInputText(cellDate.format(DISPLAY_FORMAT));
                setInputInvalid(false);
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
              aria-label="Naptár megnyitása"
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
            required={required}
            aria-invalid={inputInvalid}
            placeholder={placeholder === 'Válassz dátumot' ? INPUT_PLACEHOLDER : placeholder}
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
                setInputText(formatInputValue(value));
                setInputInvalid(false);
                setIsOpen(false);
                inputRef.current?.blur();
              }
              if (e.key === 'ArrowDown' && !isOpen) {
                e.preventDefault();
                setIsOpen(true);
              }
            }}
            className="flex-1 min-w-0 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          {value && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Dátum törlése"
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
          )}
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
        {renderHeader()}
        {renderDays()}
        {renderCells()}
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
              const todayValue = today();
              onChange(todayValue);
              setInputText(formatInputValue(todayValue));
              setInputInvalid(false);
              setIsOpen(false);
            }}
          >
            Ma
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
