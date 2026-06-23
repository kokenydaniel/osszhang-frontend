import classNames from 'classnames';

export const metricLabelClass = 'text-xs font-medium leading-snug text-foreground/70';

export function metricLabelClassName(...extra: classNames.Argument[]): string {
  return classNames(metricLabelClass, ...extra);
}
