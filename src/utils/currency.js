export function formatINR(value, options = {}) {
  const amount = Number(value);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(Number.isFinite(amount) ? amount : 0);
}
