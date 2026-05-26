const FALLBACK_RATES: Record<string, number> = {
  USD: 365,
  EUR: 395,
  BTC: 24000000,
  ETH: 1200000,
  HUF: 1,
};

export async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    const [fiatRes, btcRes, ethRes] = await Promise.all([
      fetch('https://open.er-api.com/v6/latest/USD').then((r) => r.json()),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT').then((r) => r.json()),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT').then((r) => r.json()),
    ]);

    const usdToHuf = fiatRes.rates?.HUF || FALLBACK_RATES.USD;
    const eurToHuf =
      fiatRes.rates?.HUF && fiatRes.rates?.EUR
        ? fiatRes.rates.HUF / fiatRes.rates.EUR
        : FALLBACK_RATES.EUR;

    const btcPriceUsd = Number(btcRes?.price) || 66000;
    const ethPriceUsd = Number(ethRes?.price) || 3000;

    return {
      USD: usdToHuf,
      EUR: eurToHuf,
      BTC: btcPriceUsd * usdToHuf,
      ETH: ethPriceUsd * usdToHuf,
      HUF: 1,
    };
  } catch (error) {
    console.error('[fetchExchangeRates] failed', error);
    return { ...FALLBACK_RATES };
  }
}
