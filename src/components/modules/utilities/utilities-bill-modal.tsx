'use client';

import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FieldHint } from '@/components/ui/FieldHint';
import { FormChoiceCard } from '@/components/ui/FormChoiceCard';
import { HELP } from '@/lib/helpTexts';
import type { UtilitiesPageState } from '@/components/modules/utilities/hooks/use-utilities-page-state';

type UtilitiesBillModalProps = Pick<
  UtilitiesPageState,
  | 'isModalOpen'
  | 'setIsModalOpen'
  | 'editingBill'
  | 'utilitySplitEnabled'
  | 'type'
  | 'setType'
  | 'total'
  | 'setTotal'
  | 'dueDate'
  | 'setDueDate'
  | 'splitRule'
  | 'setSplitRule'
  | 'settlementOptions'
  | 'householdSideLabel'
  | 'partnerSideLabel'
  | 'handleSubmit'
>;

export function UtilitiesBillModal({
  isModalOpen,
  setIsModalOpen,
  editingBill,
  utilitySplitEnabled,
  type,
  setType,
  total,
  setTotal,
  dueDate,
  setDueDate,
  splitRule,
  setSplitRule,
  settlementOptions,
  householdSideLabel,
  partnerSideLabel,
  handleSubmit,
}: UtilitiesBillModalProps) {
  return (
    <Modal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title={editingBill ? 'Rezsi szerkesztése' : 'Új rezsi rögzítése'}
      description={utilitySplitEnabled ? HELP.utilities.settlementIntro : undefined}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.utilities.billType}>Típus</FieldLabel>
          <Input value={type} onChange={(e) => setType(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.utilities.billAmount}>Végösszeg</FieldLabel>
          <Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.utilities.billDue}>Határidő</FieldLabel>
          <DatePicker value={dueDate} onChange={setDueDate} />
        </div>
        {utilitySplitEnabled && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Ki fizeti ezt a számlát?</p>
            <FieldHint className="-mt-1">
              A választás alapján számolódik a havi rezsi-mérleg ({householdSideLabel} ↔ {partnerSideLabel}).
            </FieldHint>
            <div className="grid gap-2" role="radiogroup" aria-label="Elszámolás módja">
              {settlementOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <FormChoiceCard
                    key={opt.id}
                    selected={splitRule === opt.id}
                    onSelect={() => setSplitRule(opt.id)}
                    title={opt.title}
                    description={opt.description}
                    example={opt.example}
                    icon={Icon}
                  />
                );
              })}
            </div>
          </div>
        )}
        <Button type="submit" className="mt-1 w-full">
          Mentés
        </Button>
      </form>
    </Modal>
  );
}
