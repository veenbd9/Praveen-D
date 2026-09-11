export type PaidPlanType = '1-month' | '3-month' | '6-month' | 'renewal';
export type PaymentCurrency = 'INR' | 'USD';

const planPrices: Record<PaidPlanType, Record<PaymentCurrency, number>> = {
  '1-month': { INR: 399, USD: 4.99 },
  '3-month': { INR: 799, USD: 8.99 },
  '6-month': { INR: 1499, USD: 12.99 },
  renewal: { INR: 399, USD: 4.99 },
};

const planQuotas: Record<PaidPlanType, number> = {
  '1-month': 99,
  '3-month': 300,
  '6-month': 600,
  renewal: 99,
};

const planDurations: Record<PaidPlanType, number> = {
  '1-month': 30,
  '3-month': 90,
  '6-month': 180,
  renewal: 30,
};

export const getPlanPrice = (planType: string, currency: string): number | null => {
  if (!(planType in planPrices) || !(currency in planPrices[planType as PaidPlanType])) return null;
  return planPrices[planType as PaidPlanType][currency as PaymentCurrency];
};

export const getPlanQuota = (planType: string): number | null =>
  planType in planQuotas ? planQuotas[planType as PaidPlanType] : null;

export const getPlanDurationDays = (planType: string): number | null =>
  planType in planDurations ? planDurations[planType as PaidPlanType] : null;