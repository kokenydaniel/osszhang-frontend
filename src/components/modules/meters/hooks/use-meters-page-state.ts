import { useEffect, useMemo } from 'react';
import { useMetersStore } from '@/stores/useMetersStore';
import { useMetersPageUiStore } from '@/stores/useMetersPageUiStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { resolveMetersSettings } from '@/lib/metersSettings';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { Meter } from '@/types';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';

export function useMetersPageState() {
  const { user } = useAuthStore();
  const metersSettings = useMemo(() => resolveMetersSettings(user?.household), [user?.household]);
  const isReader = user?.role === 'reader';
  const { meters, deleteMeter, deleteMeterReading } = useMetersStore();
  const ui = useMetersPageUiStore();
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const { aiUtilityAnomalies, fetchAiUtilityAnomalies } = useUtilitiesStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  useEffect(() => {
    fetchAiUtilityAnomalies(selectedYear, selectedMonth);
  }, [fetchAiUtilityAnomalies, selectedMonth, selectedYear]);

  useEffect(() => {
    useMetersPageUiStore.getState().setAiYear(selectedYear);
    useMetersPageUiStore.getState().setAiMonth(selectedMonth);
  }, [selectedMonth, selectedYear]);

  const getPreviousYearValue = (mId: number, month: number, year: number): number | null => {
    const meter = meters.find((m) => m.id === mId);
    if (!meter) return null;
    const py = meter.readings.find((r) => r.month === month && r.year === year - 1);
    return py ? py.consumption : null;
  };

  const handleDeleteMeter = (id: number) => {
    const m = meters.find((x) => x.id === id);
    requestDelete({
      title: 'Mérőóra törlése',
      message: `Biztosan törlöd a „${m?.name ?? 'mérőóra'}" mérőórát az összes állással együtt? Ez a művelet nem vonható vissza.`,
      onConfirm: () => deleteMeter(id),
    });
  };

  const handleDeleteReading = (mId: number, rId: number) => {
    requestDelete({
      title: 'Leolvasás törlése',
      message: 'Biztosan törlöd ezt az óraállást? A fogyasztási adatok újraszámolásra kerülnek.',
      onConfirm: () => deleteMeterReading(mId, rId),
    });
  };

  const locationGroups = meters.reduce((acc, m) => {
    if (!acc[m.location]) acc[m.location] = [];
    acc[m.location].push(m);
    return acc;
  }, {} as Record<string, Meter[]>);

  return {
    isReader,
    metersSettings,
    meters,
    selectedYear,
    selectedMonth,
    aiUtilityAnomalies,
    fetchAiUtilityAnomalies,
    isModalOpen: ui.isModalOpen,
    setIsModalOpen: ui.setIsModalOpen,
    editingReading: ui.editingReading,
    meterId: ui.meterId,
    setMeterId: ui.setMeterId,
    date: ui.date,
    setDate: ui.setDate,
    value: ui.value,
    setValue: ui.setValue,
    isReset: ui.isReset,
    setIsReset: ui.setIsReset,
    isOfficial: ui.isOfficial,
    setIsOfficial: ui.setIsOfficial,
    isAiModalOpen: ui.isAiModalOpen,
    setIsAiModalOpen: ui.setIsAiModalOpen,
    isAiLoading: ui.isAiLoading,
    aiYear: ui.aiYear,
    setAiYear: ui.setAiYear,
    aiMonth: ui.aiMonth,
    setAiMonth: ui.setAiMonth,
    isNewMeterModalOpen: ui.isNewMeterModalOpen,
    setIsNewMeterModalOpen: ui.setIsNewMeterModalOpen,
    newMeterName: ui.newMeterName,
    setNewMeterName: ui.setNewMeterName,
    newMeterUnit: ui.newMeterUnit,
    setNewMeterUnit: ui.setNewMeterUnit,
    newMeterLoc: ui.newMeterLoc,
    setNewMeterLoc: ui.setNewMeterLoc,
    openNewMeterModal: () => ui.openNewMeterModal(metersSettings),
    applyMeterTemplate: (template: (typeof metersSettings.templates)[number]) =>
      ui.applyMeterTemplate(template, metersSettings),
    handleMeterSubmit: ui.handleMeterSubmit,
    handleSubmit: ui.handleSubmit,
    openEdit: ui.openEdit,
    getPreviousYearValue,
    handleAiSubmit: (e: React.FormEvent) => ui.handleAiSubmit(e, getPreviousYearValue),
    handleFillAllGaps: () => ui.handleFillAllGaps(getPreviousYearValue),
    handleAiClick: ui.handleAiClick,
    handleAddReading: ui.handleAddReading,
    handleDeleteMeter,
    handleDeleteReading,
    locationGroups,
    ConfirmDeleteModal,
  };
}

export type MetersPageState = ReturnType<typeof useMetersPageState>;
