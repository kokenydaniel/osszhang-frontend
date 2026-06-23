

export type TaxRegime = 'aam' | 'vat' | 'kata';

export type IncomeTaxMethod = 'cost_ratio' | 'actual' | 'kata_flat';

export type RevenueBasis = 'documented_only' | 'all_orders';

export const TAX_REGIME_LABELS: Record<TaxRegime, string> = {
  aam: 'Alanyi adómentes (AAM)',
  vat: 'Áfa-köteles',
  kata: 'KATA (megszűnt új belépőknél)',
};

export const TAX_REGIME_HINTS: Record<TaxRegime, string> = {
  aam: 'Nem számolsz fel ÁFÁ-t. A bevétel kimutatás nettó összegekre épül; SZJA/KIVA szempontból költséghányad vagy tételes költség is választható.',
  vat: 'ÁFA felszámítása és befizetése. A kimutatás az alapértelmezett ÁFA kulcsot használja.',
  kata: 'Fix havi adó — csak ha jogilag még KATA-s vagy. A rendszer tájékoztató jelleggel kezeli.',
};

export const INCOME_TAX_METHOD_LABELS: Record<IncomeTaxMethod, string> = {
  cost_ratio: 'Költséghányad (EV)',
  actual: 'Tételes (valós) költség',
  kata_flat: 'KATA fix adó',
};

export const REVENUE_BASIS_LABELS: Record<RevenueBasis, string> = {
  documented_only: 'Csak bizonylatos bevétel (jelölés vagy számlasorszám)',
  all_orders: 'Minden rögzített rendelés',
};

export const COST_RATIO_PRESETS = [40, 80, 90] as const;

export const DEFAULT_TAX_SETTINGS = {
  tax_regime: 'aam' as TaxRegime,
  income_tax_method: 'cost_ratio' as IncomeTaxMethod,
  cost_ratio_percent: 40,
  revenue_basis: 'documented_only' as RevenueBasis,
};
