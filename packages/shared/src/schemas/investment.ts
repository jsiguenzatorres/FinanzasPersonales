import { z } from 'zod';
import { currencyCodeSchema } from './common';

export const investmentTypeSchema = z.enum([
  'stock',
  'etf',
  'mutual_fund',
  'bond',
  'cete',
  'crypto',
  'real_estate',
  'business_equity',
  'other',
]);

export type InvestmentType = z.infer<typeof investmentTypeSchema>;

export const investmentCreateSchema = z.object({
  name: z.string().min(1, 'Ingresa un nombre').max(150),
  ticker: z.string().max(20).optional(),
  type: investmentTypeSchema,
  broker: z.string().max(100).optional(),
  currency: currencyCodeSchema,
  quantity: z.number().nonnegative('No puede ser negativo'),
  avg_cost: z.number().nonnegative('No puede ser negativo'),
  current_price: z.number().nonnegative('No puede ser negativo').optional(),
  coingecko_id: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export type InvestmentCreateInput = z.infer<typeof investmentCreateSchema>;

export const investmentUpdateSchema = investmentCreateSchema.extend({
  is_active: z.boolean().optional(),
});

export type InvestmentUpdateInput = z.infer<typeof investmentUpdateSchema>;

/** ~20 criptomonedas comunes preseleccionables (ticker → id de CoinGecko). */
export const COMMON_COINGECKO_IDS: Array<{ ticker: string; id: string; name: string }> = [
  { ticker: 'BTC', id: 'bitcoin', name: 'Bitcoin' },
  { ticker: 'ETH', id: 'ethereum', name: 'Ethereum' },
  { ticker: 'USDT', id: 'tether', name: 'Tether' },
  { ticker: 'USDC', id: 'usd-coin', name: 'USD Coin' },
  { ticker: 'BNB', id: 'binancecoin', name: 'BNB' },
  { ticker: 'SOL', id: 'solana', name: 'Solana' },
  { ticker: 'XRP', id: 'ripple', name: 'XRP' },
  { ticker: 'DOGE', id: 'dogecoin', name: 'Dogecoin' },
  { ticker: 'ADA', id: 'cardano', name: 'Cardano' },
  { ticker: 'TRX', id: 'tron', name: 'TRON' },
  { ticker: 'AVAX', id: 'avalanche-2', name: 'Avalanche' },
  { ticker: 'LINK', id: 'chainlink', name: 'Chainlink' },
  { ticker: 'DOT', id: 'polkadot', name: 'Polkadot' },
  { ticker: 'MATIC', id: 'matic-network', name: 'Polygon' },
  { ticker: 'LTC', id: 'litecoin', name: 'Litecoin' },
];
