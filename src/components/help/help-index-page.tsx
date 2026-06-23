'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import { ArrowRight, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/design';
import { useAuthStore } from '@/stores/useAuthStore';
import { HELP_GUIDE_TOPICS } from '@/config/help-guide';
import { HELP_SECTIONS, helpSectionPath } from '@/config/help-sections';
import { isHelpTopicVisible } from '@/helpers/help-assistant';
import { getTopicFaqs } from '@/helpers/help-page-faqs';

export function HelpIndexPage() {
  const { user } = useAuthStore();

  const sections = useMemo(() => {
    const visibleTopicIds = new Set(
      HELP_GUIDE_TOPICS.filter((topic) => isHelpTopicVisible(topic, user)).map((topic) => topic.id),
    );

    return HELP_SECTIONS.map((section) => {
      const topics = section.topicIds.filter((id) => visibleTopicIds.has(id));
      const faqCount = topics.reduce((sum, topicId) => {
        const topic = HELP_GUIDE_TOPICS.find((item) => item.id === topicId);
        return sum + (topic ? getTopicFaqs(topic).length : 0);
      }, 0);

      return { ...section, topicCount: topics.length, faqCount };
    }).filter((section) => section.topicCount > 0);
  }, [user]);

  const totalTopics = sections.reduce((sum, section) => sum + section.topicCount, 0);

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto pb-10">
      <PageHeader
        title="Súgó és útmutatók"
        description="Válassz egy témakört — minden modulhoz részletes leírást, lépéseket és mezőmagyarázatokat találsz."
        meta={
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            {sections.length} témakör · {totalTopics} modul
          </span>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Link
              key={section.id}
              href={helpSectionPath(section.slug)}
              className={classNames(
                'group relative overflow-hidden rounded-xl border border-border bg-card p-5',
                'flex flex-col gap-4 transition-all shadow-sm hover:shadow-md hover:border-foreground/15',
              )}
            >
              <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100 from-primary via-violet-500 to-primary" />

              <div className="flex items-start justify-between gap-3">
                <div
                  className={classNames(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm',
                    section.gradient,
                  )}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                  {section.cardTeaser}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[0.7rem] text-muted-foreground pt-1 border-t border-border/60">
                <span>{section.topicCount} modul</span>
                <span className="text-border">·</span>
                <span>{section.faqCount} részletes válasz</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
