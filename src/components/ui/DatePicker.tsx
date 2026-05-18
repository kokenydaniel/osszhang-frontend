'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';
import { hu } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder = 'Válassz dátumot', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? parseISO(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseISO(value) : null;

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 350) setOpenUp(true);
      else setOpenUp(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4 px-1">
      <button 
        type="button" 
        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="font-black text-sm capitalize text-white">
        {format(currentMonth, 'yyyy. MMMM', { locale: hu })}
      </div>
      <button 
        type="button" 
        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );

  const renderDays = () => {
    const days = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-[0.65rem] font-black text-slate-500 uppercase">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((d, i) => {
          const isSelected = selectedDate && isSameDay(d, selectedDate);
          const isCurrentMonth = isSameMonth(d, monthStart);
          const isToday = isSameDay(d, new Date());

          return (
            <div 
              key={i}
              onClick={() => {
                onChange(format(d, 'yyyy-MM-dd'));
                setIsOpen(false);
              }}
              className={`h-8 flex items-center justify-center text-xs rounded-lg cursor-pointer transition-colors
                ${isSelected ? 'bg-brand-primary text-white font-black' : 
                  isToday ? 'bg-blue-500/10 text-slate-200 font-bold border border-brand-primary/50' : 
                  'hover:bg-white/10 text-slate-400 font-medium'}
                ${!isCurrentMonth && !isSelected ? 'opacity-30' : ''}
              `}
            >
              {format(d, 'd')}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-white/20 transition-colors text-sm font-semibold"
      >
        <CalendarIcon size={16} className="text-slate-500" />
        <span className={value ? 'text-slate-200' : 'text-slate-500'}>
          {value ? format(parseISO(value), 'yyyy. MM. dd.', { locale: hu }) : placeholder}
        </span>
      </div>

      {isOpen && (
        <div className={`absolute ${openUp ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-in ${openUp ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'} duration-200`}>
          {renderHeader()}
          {renderDays()}
          {renderCells()}
          
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
            <button 
              type="button"
              className="px-4 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-xs font-bold"
              onClick={() => {
                onChange(format(new Date(), 'yyyy-MM-dd'));
                setIsOpen(false);
              }}
            >
              Ma
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
