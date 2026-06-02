'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import classNames from 'classnames';
import { OnboardingLivePreview } from '@/components/onboarding/OnboardingLivePreview';
import { PERSONALIZATION_QUESTION_ICONS } from '@/config/onboarding-icons';
import {
  buildCategoriesFromAnswers,
  categoriesForQuestion,
  countAnsweredQuestions,
  isQuestionAnswered,
  mergeCategoryList,
  ONBOARDING_BASE_CATEGORIES,
  ONBOARDING_PERSONALIZATION_QUESTIONS,
  reactionForAnswer,
  recommendedModuleIds,
  type PersonalizationAnswer,
  type PersonalizationAnswers,
  type PersonalizationQuestion,
  type PersonalizationQuestionId,
} from '@/config/onboarding-personalization';

type Props = {
  householdName: string;
  answers: PersonalizationAnswers;
  onChange: (id: PersonalizationQuestionId, answer: PersonalizationAnswer) => void;
  minAnswered?: number;
};

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -48 : 48, opacity: 0 }),
};

export function OnboardingPersonalizationStep({
  householdName,
  answers,
  onChange,
  minAnswered = 3,
}: Props) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [reaction, setReaction] = useState<string | null>(null);

  const questions = ONBOARDING_PERSONALIZATION_QUESTIONS;
  const question = questions[questionIndex];
  const answer = answers[question.id];
  const QuestionIcon = PERSONALIZATION_QUESTION_ICONS[question.id];
  const answeredCount = countAnsweredQuestions(answers);
  const personalizedCategories = buildCategoriesFromAnswers(answers);
  const previewCategories = mergeCategoryList(ONBOARDING_BASE_CATEGORIES, personalizedCategories);
  const suggestedModules = recommendedModuleIds(answers);
  const isLastQuestion = questionIndex === questions.length - 1;

  useEffect(() => {
    setReaction(reactionForAnswer(question, answer));
  }, [question, answer]);

  const goToQuestion = (nextIndex: number) => {
    setDirection(nextIndex > questionIndex ? 1 : -1);
    setQuestionIndex(Math.max(0, Math.min(questions.length - 1, nextIndex)));
    setReaction(null);
  };

  const advance = () => {
    if (!isLastQuestion) goToQuestion(questionIndex + 1);
  };

  const handleYesNo = (yes: boolean) => {
    const next: PersonalizationAnswer = yes
      ? { yes: true, detail: answer.detail, selected: answer.selected }
      : { yes: false, detail: '', selected: [] };
    onChange(question.id, next);
    setReaction(reactionForAnswer(question, next));

    if (question.interaction === 'yesno' && !question.followUp) {
      window.setTimeout(advance, yes ? 550 : 350);
    }
    if (question.interaction === 'yesno_providers' && !yes) {
      window.setTimeout(advance, 350);
    }
  };

  const handleSkip = () => {
    onChange(question.id, { yes: null, detail: '', selected: [] });
    advance();
  };

  const toggleProvider = (provider: string) => {
    const current = answer.selected ?? [];
    const nextSelected = current.includes(provider)
      ? current.filter((name) => name !== provider)
      : [...current, provider];
    const next: PersonalizationAnswer = {
      yes: true,
      detail: answer.detail,
      selected: nextSelected,
    };
    onChange(question.id, next);
  };

  const canContinueCurrent = () => {
    if (question.interaction === 'yesno_text') {
      return answer.yes === false || answer.yes === true;
    }
    if (question.interaction === 'yesno_providers') {
      return isQuestionAnswered(question, answer);
    }
    return isQuestionAnswered(question, answer);
  };

  const latestAddedCategories = categoriesForQuestion(question, answer);

  return (
    <div className="flex flex-col gap-4">
      <OnboardingLivePreview
        householdName={householdName}
        categories={previewCategories}
        personalizedCategories={personalizedCategories}
        suggestedModules={suggestedModules}
        answeredCount={answeredCount}
        totalQuestions={questions.length}
      />

      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="text-xs text-muted-foreground">
          Kérdés <strong className="text-foreground">{questionIndex + 1}</strong> / {questions.length}
        </p>
        <div className="flex gap-1">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              aria-label={`${i + 1}. kérdés`}
              onClick={() => goToQuestion(i)}
              className={classNames(
                'h-1.5 rounded-full transition-all',
                i === questionIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted hover:bg-muted-foreground/30',
                isQuestionAnswered(q, answers[q.id]) && i !== questionIndex && 'bg-primary/40',
              )}
            />
          ))}
        </div>
      </div>

      <div className="relative min-h-[280px] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={question.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border bg-muted/15 p-5 sm:p-6 shadow-sm"
          >
            <div className="text-center space-y-2 mb-5">
              <motion.div
                className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary"
                initial={{ scale: 0.6, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              >
                <QuestionIcon size={28} strokeWidth={1.75} />
              </motion.div>
              <h3 className="text-lg font-semibold text-foreground tracking-tight">{question.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">{question.subtitle}</p>
              {question.infoNote && (
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto rounded-lg border border-border bg-muted/30 px-3 py-2 text-left">
                  {question.infoNote}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center max-w-md mx-auto">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => handleYesNo(true)}
                className={classNames(
                  'flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors',
                  answer.yes === true
                    ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-primary/5',
                )}
              >
                {question.yesLabel ?? 'Igen'}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => handleYesNo(false)}
                className={classNames(
                  'flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors',
                  answer.yes === false
                    ? 'border-foreground/20 bg-muted text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/60',
                )}
              >
                {question.noLabel ?? 'Nem'}
              </motion.button>
            </div>

            {question.interaction === 'yesno_text' && answer.yes === true && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 max-w-sm mx-auto space-y-2"
              >
                <label className="text-xs font-semibold text-foreground">{question.followUp?.label}</label>
                <Input
                  value={answer.detail ?? ''}
                  onChange={(e) =>
                    onChange(question.id, { ...answer, yes: true, detail: e.target.value })
                  }
                  placeholder={question.followUp?.placeholder}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') advance();
                  }}
                />
              </motion.div>
            )}

            {question.interaction === 'yesno_providers' && answer.yes === true && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 max-w-lg mx-auto space-y-4"
              >
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Melyik szolgáltató? (több is lehet)</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {question.providerOptions?.map((provider) => {
                      const active = (answer.selected ?? []).includes(provider);
                      return (
                        <motion.button
                          key={provider}
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => toggleProvider(provider)}
                          className={classNames(
                            'inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-semibold transition-colors',
                            active
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-card text-muted-foreground hover:border-primary/20',
                          )}
                        >
                          {provider}
                          {active && <Check size={11} />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
                {question.followUp && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">{question.followUp.label}</label>
                    <Input
                      value={answer.detail ?? ''}
                      onChange={(e) =>
                        onChange(question.id, { ...answer, yes: true, detail: e.target.value })
                      }
                      placeholder={question.followUp.placeholder}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && canContinueCurrent()) advance();
                      }}
                    />
                  </div>
                )}
              </motion.div>
            )}

            <AnimatePresence>
              {reaction && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-center text-xs font-medium text-primary"
                >
                  {reaction}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {latestAddedCategories.length > 0 && answer.yes !== false && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex flex-wrap justify-center gap-1.5"
                >
                  {latestAddedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[0.65rem] font-semibold text-primary"
                    >
                      <Check size={10} /> + {cat}
                    </span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-muted-foreground"
        >
          <SkipForward size={13} />
          Kihagyom
        </Button>

        <div className="flex items-center gap-2">
          {!isLastQuestion && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={questionIndex === 0}
              onClick={() => goToQuestion(questionIndex - 1)}
            >
              Előző
            </Button>
          )}
          {!isLastQuestion ? (
            <Button type="button" size="sm" disabled={!canContinueCurrent()} onClick={advance}>
              Következő
              <ArrowRight size={13} />
            </Button>
          ) : null}
        </div>
      </div>

      {answeredCount < minAnswered && (
        <p className="text-xs text-center text-muted-foreground">
          Még <strong className="text-foreground">{minAnswered - answeredCount}</strong> válasz kell a továbblépéshez
          ({answeredCount}/{minAnswered})
        </p>
      )}
    </div>
  );
}
