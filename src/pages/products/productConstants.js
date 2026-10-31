export const BILLING_LABELS = {
  daily: { label: 'Daily', short: 'day' },
  weekly: { label: 'Weekly', short: 'wk' },
  monthly: { label: 'Monthly', short: 'mo' },
  yearly: { label: 'Yearly', short: 'yr' }
};

export const EMPTY_PLAN_FORM = {
  name: '',
  price: '',
  billingInterval: 'monthly',
  minimumQuantity: 1,
  availableFrom: new Date().toISOString().split('T')[0],
  availableUntil: '2027-12-31',
  autoClose: true,
  allowEarlyClose: true,
  allowPause: true,
  allowRenew: true,
  description: ''
};
