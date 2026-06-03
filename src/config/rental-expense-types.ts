export const RENTAL_EXPENSE_TYPE_LABELS: Record<string, string> = {
  maintenance: 'Karbantartás, javítás',
  renovation: 'Felújítás',
  common_cost: 'Közös költség (társasház)',
  utilities: 'Közmű / rezsi (tulajdonos fizeti)',
  insurance: 'Biztosítás',
  tax: 'Adó, közteher',
  other: 'Egyéb tulajdonosi költség',
};

export const RENTAL_EXPENSE_TYPE_IDS = Object.keys(RENTAL_EXPENSE_TYPE_LABELS);
