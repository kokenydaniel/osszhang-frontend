'use client';

import React, { useState, useRef, useEffect } from 'react';
import { aiFinanceClient } from '@/api';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { 
  Sparkles, 
  X, 
  Send, 
  Trash2, 
  MessageSquare, 
  Loader2, 
  Bot,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Zap
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotificationStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Szia! Én vagyok a PénzPilot AI Copilotod. 🤖 Személyre szabott elemzést tudok adni a háztartási büdzsétek, rezsióráitok, megtakarításaitok és a Little Loom vállalkozásotok adatai alapján. \n\nMiben segíthetek ma?',
          timestamp: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputValue.trim();
    if (!messageText || isLoading) return;

    if (!textToSend) {
      setInputValue('');
    }

    const timestamp = new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
    const userMessage: Message = { role: 'user', content: messageText, timestamp };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await aiFinanceClient.query(messageText, true);
      const assistantMessage: Message = {
        role: 'assistant',
        content: res.data.answer || 'Sajnálom, nem tudtam feldolgozni a kérést.',
        timestamp: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      addNotification('Hiba történt az AI kapcsolat során.', 'error');
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sajnálom, de hálózati hiba történt a válasz generálása során. Kérlek, próbáld újra később!',
        timestamp: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Üdv újra! Tisztítottam a beszélgetést. Milyen pénzügyi vagy üzleti kérdésben segíthetek?',
        timestamp: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    addNotification('Beszélgetés törölve.', 'info');
  };

  const quickPrompts = [
    { label: 'Heti összefoglaló', text: 'Kérlek adj egy átfogó heti pénzügyi és üzleti összefoglalót a háztartásunk aktuális adatairól!', icon: <Zap size={12} className="text-amber-400" /> },
    { label: 'Hol folyik el a pénz?', text: 'Kérlek elemezd a kiadásainkat és keresd meg, hol vannak a legnagyobb elfolyások vagy megtakarítási lehetőségek!', icon: <AlertCircle size={12} className="text-red-400" /> },
    { label: 'Little Loom tanácsok', text: 'Nézd meg a Little Loom webshop rendelési statisztikáit, és adj javaslatokat az árbevétel növelésére vagy a készletoptimalizálásra!', icon: <TrendingUp size={12} className="text-cyan-400" /> },
    { label: 'Megtakarítási tippek', text: 'A jelenlegi megtakarításaink és széf céljaink alapján adj javaslatot egy hatékony havi allokációs tervre!', icon: <Sparkles size={12} className="text-emerald-400" /> }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="w-[360px] md:w-[400px] h-[550px] bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-brand-primary/20 via-brand-secondary/10 to-transparent border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/20 animate-pulse">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                  AI Copilot <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                </h4>
                <p className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider">PénzPilot Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleClearChat}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all"
                title="Beszélgetés törlése"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-brand-primary" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-md
                    ${msg.role === 'user' 
                      ? 'bg-brand-primary text-white rounded-tr-none' 
                      : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none'}
                  `}>
                    {msg.content}
                  </div>
                  <span className={`text-[0.65rem] text-slate-500 font-bold px-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-brand-primary animate-bounce" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="px-4 py-3 bg-white/5 border border-white/5 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-brand-primary" />
                    <span className="text-[0.65rem] text-slate-400 font-bold">Gondolkodom...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Panel */}
          {messages.length === 1 && !isLoading && (
            <div className="px-6 py-2 border-t border-white/5 bg-slate-950/20">
              <p className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-wider mb-2">Gyors indítás:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(qp.text)}
                    className="p-2 bg-white/5 hover:bg-brand-primary/10 border border-white/5 hover:border-brand-primary/20 rounded-xl text-[0.65rem] font-bold text-left text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    {qp.icon} {qp.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="p-4 bg-slate-950 border-t border-white/5 flex gap-2 items-center"
          >
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Kérdezz bármit a pénzügyekről..."
              disabled={isLoading}
              className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary/50 transition-all disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 bg-brand-primary hover:bg-brand-light disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-lg shadow-brand-primary/20"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* FLOATING TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-14 h-14 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all duration-300 group relative
          ${isOpen ? 'rotate-90 bg-slate-800' : ''}
        `}
      >
        {isOpen ? (
          <X size={20} className="text-white" />
        ) : (
          <>
            <Sparkles size={20} className="text-white group-hover:animate-pulse" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-slate-950 text-[0.5rem] font-black text-slate-950 flex items-center justify-center animate-bounce">
              AI
            </span>
          </>
        )}
      </button>
    </div>
  );
}
