import config from '@/config/config';
import { dayjs } from '@/utils/dates';

export function pocketMoneyInterestReminderDaysAtMonthEnd(): number {
  const days = config.moduleDefaults.pocket_money.interest_reminder_days_at_month_end;
  return Math.max(1, Math.min(7, Number(days) || 3));
}

export function isPocketMoneyInterestReminderWindow(
  selectedYear: number,
  selectedMonth: number,
): boolean {
  const reminderDays = pocketMoneyInterestReminderDaysAtMonthEnd();
  const now = dayjs();
  if (now.year() !== selectedYear || now.month() + 1 !== selectedMonth) {
    return false;
  }
  const daysInMonth = now.daysInMonth();
  const firstReminderDay = Math.max(1, daysInMonth - reminderDays + 1);
  return now.date() >= firstReminderDay;
}

export function pocketMoneyInterestReminderPeriodLabel(
  selectedYear: number,
  selectedMonth: number,
): string {
  const reminderDays = pocketMoneyInterestReminderDaysAtMonthEnd();
  const end = dayjs()
    .year(selectedYear)
    .month(selectedMonth - 1)
    .endOf('month');
  const lastDay = end.date();
  const startDay = Math.max(1, lastDay - reminderDays + 1);
  const monthStr = String(selectedMonth).padStart(2, '0');
  if (startDay === lastDay) {
    return `${selectedYear}. ${monthStr}. ${startDay}.`;
  }
  return `${selectedYear}. ${monthStr}. ${startDay}. – ${lastDay}.`;
}
