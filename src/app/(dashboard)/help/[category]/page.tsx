import { notFound } from 'next/navigation';
import { HelpCategoryPage } from '@/components/help/help-category-page';
import { HELP_SECTIONS, getHelpSectionBySlug } from '@/config/help-sections';

type PageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return HELP_SECTIONS.map((section) => ({ category: section.slug }));
}

export default async function Page({ params }: PageProps) {
  const { category } = await params;

  if (!getHelpSectionBySlug(category)) {
    notFound();
  }

  return <HelpCategoryPage categorySlug={category} />;
}
