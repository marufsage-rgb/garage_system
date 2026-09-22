export function formatCurrency(amount: number, currencyCode: string = 'OMR'): string {
  // Try to use Intl.NumberFormat, fallback to basic if not supported
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}
