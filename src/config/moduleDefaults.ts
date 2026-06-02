/** Default household module settings (static). Resolution logic stays in `lib/*Settings.ts`. */

export const moduleDefaults = {
  business: {
    channels: [] as string[],
    payment_methods: [] as string[],
    providers: [] as string[],
    destinations: [] as string[],
    default_vat_percent: 27,
    price_input_mode: 'gross' as 'net' | 'gross',
    order_statuses: ['Függőben', 'Feldolgozás alatt', 'Szállítva', 'Teljesítve', 'Visszautaltva'],
    shopify_sync_schedule: 'off' as 'off' | 'hourly' | 'every_6_hours' | 'daily',
    shopify_last_synced_at: null as string | null,
  },
  budget: {
    category_groups: [] as Array<{ name: string; color: string; categories: string[] }>,
    category_colors: {} as Record<string, string>,
    clone_mode: 'all' as 'all' | 'budget_only' | 'fixed_recurring',
    missed_income_enabled: true,
    missed_income_grace_days: 0,
  },
  debts: {
    default_strategy: 'avalanche' as const,
    default_extra_monthly: 0,
    pay_add_to_budget_default: true,
    payment_category_pattern: 'hitel|tartoz|törleszt',
    reminder_days_before: 3,
    default_interest_rate_annual: 0,
    debt_type_templates: [
      { label: 'Lakáshitel', default_interest_rate_annual: 5 },
      { label: 'Autóhitel', default_interest_rate_annual: 8 },
      { label: 'Hitelkártya', default_interest_rate_annual: 18 },
      { label: 'Személyi kölcsön', default_interest_rate_annual: 12 },
    ],
  },
  utilities: {
    clone_from_previous_month: true,
    settlement_auto_suggest: true,
    default_payer_user_id: null as number | null,
  },
  dashboard: {
    widget_order: [
      'alerts',
      'ai_cfo',
      'primary_metrics',
      'secondary_metrics',
      'main_grid',
      'business_chart',
      'ai_briefing',
    ] as const,
  },
  savings: {
    owners: [] as string[],
    default_owner: '',
    separate_owner: '',
    currencies: ['HUF', 'EUR', 'USD'] as string[],
    default_count_in_savings: true,
  },
  meters: {
    default_location: 'Otthon',
    units: ['kWh', 'm³', 'GJ'] as string[],
    templates: [
      { name: 'Villany', unit: 'kWh', location: 'Otthon' },
      { name: 'Víz', unit: 'm³', location: 'Otthon' },
      { name: 'Gáz', unit: 'm³', location: 'Otthon' },
    ],
    reading_reminder_day: 5,
    consumption_alert_percent: 25,
    show_annual_summary_on_dashboard: true,
    location_groups: [{ name: 'Otthon', locations: ['Otthon'] }],
  },
} as const;
