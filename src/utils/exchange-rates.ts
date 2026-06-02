import config from '@/config/config';

const FALLBACK_RATES = config.exchangeRates.fallback;

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
