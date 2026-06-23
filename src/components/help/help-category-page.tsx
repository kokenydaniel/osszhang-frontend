'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronLeft, Search } from 'lucide-react';
import { PageHeader } from '@/components/design';
import { useAuthStore } from '@/stores/useAuthStore';
import { HELP_GUIDE_TOPICS, type HelpGuideTopic } from '@/config/help-guide';
import { getHelpSectionBySlug } from '@/config/help-sections';
import { isHelpTopicVisible, searchHelpTopics } from '@/helpers/help-assistant';
import { getTopicFaqs } from '@/helpers/help-page-faqs';
import { HelpTopicPanel } from '@/components/help/help-topic-panel';

export function HelpCategoryPage({ categorySlug }: { categorySlug: string }) {
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const section = getHelpSectionBySlug(categorySlug);

  const topics = useMemo(() => {
    if (!section) return [];
    return section.topicIds
      .map((id) => HELP_GUIDE_TOPICS.find((topic) => topic.id === id))
      .filter((topic): topic is HelpGuideTopic => Boolean(topic))
      .filter((topic) => isHelpTopicVisible(topic, user));
  }, [section, user]);

  const searchResults = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed || !section) return null;
    return searchHelpTopics(trimmed, 50, user).filter((result) =>
      section.topicIds.includes(result.topic.id),
    );
  }, [query, user, section]);

  if (!section) {
    return null;
  }

  const visibleTopics = useMemo(() => {
    if (!searchResults) return topics;
    const ids = new Set(searchResults.map((result) => result.topic.id));
    return topics.filter((topic) => ids.has(topic.id));
  }, [topics, searchResults]);

  const defaultOpenIds = useMemo(() => {
    if (searchResults?.length) {
      return new Set(searchResults.slice(0, 3).map((result) => result.topic.id));
    }
    if (visibleTopics.length === 1) return new Set([visibleTopics[0].id]);
    return new Set<string>();
  }, [searchResults, visibleTopics]);

  const totalFaqs = useMemo(
    () => visibleTopics.reduce((sum, topic) => sum + getTopicFaqs(topic).length, 0),
    [visibleTopics],
  );

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto pb-10">
      <PageHeader
        breadcrumbs={[
          { label: 'Súgó', href: '/help' },
          { label: section.title },
        ]}
        title={section.title}
        description={section.description}
        meta={
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            {visibleTopics.length} modul · {totalFaqs} részletes válasz
          </span>
        }
        actions={
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Vissza a témakörökhöz
          </Link>
        }
      />

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Keresés a „${section.title}” témakörben…`}
          className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {searchResults && (
        <p className="text-sm text-muted-foreground -mt-2">
          {visibleTopics.length > 0
            ? `${visibleTopics.length} egyező modul`
            : 'Nincs találat ebben a témakörben — próbálj más kulcsszót.'}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {visibleTopics.map((topic) => (
          <HelpTopicPanel
            key={topic.id}
            topic={topic}
            user={user}
            defaultOpen={defaultOpenIds.has(topic.id)}
          />
        ))}
      </div>

      {visibleTopics.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {searchResults
              ? 'Nincs találat — töröld a keresőt vagy próbálj általánosabb kifejezést.'
              : 'Ehhez a témakörhöz jelenleg nincs elérhető súgó tartalom.'}
          </p>
        </div>
      )}
    </div>
  );
}
