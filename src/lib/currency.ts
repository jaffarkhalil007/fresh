// Currency formatting utility for Pakistani Rupees

export const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null || isNaN(price)) {
    return '₨ 0';
  }
  return `₨ ${Math.round(price).toLocaleString('en-PK')}`;
};

export const CURRENCY_SYMBOL = '₨';
export const CURRENCY_CODE = 'PKR';
