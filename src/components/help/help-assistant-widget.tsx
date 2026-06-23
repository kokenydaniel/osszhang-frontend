'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import classNames from 'classnames';
import { BookOpen, MessageCircleQuestion, Send, X } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { needsHouseholdOnboarding } from '@/helpers/household-onboarding';
import {
  SUGGESTED_HELP_QUESTIONS,
  askHelpAssistant,
  type HelpAssistantMessage,
} from '@/helpers/help-assistant';
import { HelpMessageBubble } from '@/components/help/help-message-bubble';
import { Button } from '@/components/ui/button';

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const WELCOME_MESSAGE: HelpAssistantMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Szia! Az alkalmazás használatában segítek — modulok, beállítások, csomagok, adatfelvitel. A válaszok a te csomagodhoz és jogosultságaidhoz igazodnak.',
};

export function HelpAssistantWidget() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<HelpAssistantMessage[]>([WELCOME_MESSAGE]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hidden = !user || needsHouseholdOnboarding(user);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [open, messages, scrollToBottom]);

  const submitQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isThinking) return;

      const userMessage: HelpAssistantMessage = {
        id: createId('user'),
        role: 'user',
        text: trimmed,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsThinking(true);

      try {
        const history = [...messages, userMessage]
          .filter((message) => message.id !== 'welcome')
          .slice(-12)
          .map((message) => ({
            role: message.role,
            content: message.text,
          }));

        const reply = await askHelpAssistant(trimmed, history);
        setMessages((prev) => [...prev, reply]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: createId('assistant-error'),
            role: 'assistant',
            text: 'Váratlan hiba történt. Próbáld újra, vagy nézd meg a részletes Súgó oldalt.',
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [isThinking, messages],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void submitQuestion(input);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submitQuestion(input);
    }
  };

  if (hidden || !mounted) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 pointer-events-none md:bottom-6 md:right-6">
      {open && (
        <div
          className={classNames(
            'pointer-events-auto w-[min(100vw-2rem,380px)] rounded-2xl border border-border/80 bg-card shadow-xl',
            'flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200',
          )}
          role="dialog"
          aria-label="Súgó asszisztens"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 bg-muted/30">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Súgó asszisztens</p>
              <p className="text-xs text-muted-foreground truncate">AI · személyre szabott útmutató</p>
            </div>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Részletes súgó">
                <Link href="/help">
                  <BookOpen className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
                aria-label="Bezárás"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 max-h-[min(52vh,420px)] overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((message) => (
              <HelpMessageBubble
                key={message.id}
                role={message.role}
                text={message.text}
                access={message.access}
                pricingHref={message.pricingHref}
                links={message.links}
                rejected={message.rejected}
                compact
              />
            ))}
            {isThinking && (
              <div className="text-xs text-muted-foreground px-2 py-1">Válasz generálása…</div>
            )}
          </div>

          {messages.length <= 2 && !isThinking && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTED_HELP_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void submitQuestion(question)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-border/60 p-3 flex gap-2 items-end bg-background">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Pl. Hogyan rögzítek rezsi számlát?"
              className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-[40px] max-h-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isThinking}
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={!input.trim() || isThinking}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={classNames(
            'pointer-events-auto h-12 w-12 rounded-full shadow-lg border border-border/60',
            'bg-card text-foreground hover:bg-muted/80 transition-colors',
            'flex items-center justify-center',
          )}
          aria-label="Súgó megnyitása"
        >
          <MessageCircleQuestion className="h-5 w-5 text-primary" />
        </button>
      )}
    </div>,
    document.body,
  );
}
