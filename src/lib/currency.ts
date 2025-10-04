/**
 * Currency utility functions for Indian Rupee (INR) formatting
 * Implements proper Indian numbering system (lakhs and crores)
 */

/**
 * Format a number as Indian Rupees with proper Indian numbering system
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "₹1,23,456.00")
 */
export const formatCurrency = (
  amount: number,
  options: {
    showDecimals?: boolean;
    compact?: boolean;
  } = {}
): string => {
  const { showDecimals = false, compact = false } = options;

  if (compact && amount >= 100000) {
    // For large amounts, show in lakhs/crores
    if (amount >= 10000000) {
      // Crores (1 crore = 1,00,00,000)
      const crores = amount / 10000000;
      return `₹${crores.toFixed(1)} Cr`;
    } else {
      // Lakhs (1 lakh = 1,00,000)
      const lakhs = amount / 100000;
      return `₹${lakhs.toFixed(1)} L`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
};

/**
 * Format currency for display in cards and lists
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatCurrencyDisplay = (amount: number): string => {
  return formatCurrency(amount, { showDecimals: false });
};

/**
 * Format currency for detailed views with decimals
 * @param amount - The amount to format
 * @returns Formatted currency string with decimals
 */
export const formatCurrencyDetailed = (amount: number): string => {
  return formatCurrency(amount, { showDecimals: true });
};

/**
 * Format currency for compact display (lakhs/crores)
 * @param amount - The amount to format
 * @returns Formatted currency string in compact format
 */
export const formatCurrencyCompact = (amount: number): string => {
  return formatCurrency(amount, { compact: true });
};

/**
 * Convert USD to INR using current exchange rate
 * @param usdAmount - Amount in USD
 * @param exchangeRate - USD to INR exchange rate (default: 88.7)
 * @returns Amount in INR
 */
export const convertUSDToINR = (usdAmount: number, exchangeRate: number = 88.7): number => {
  return Math.round(usdAmount * exchangeRate);
};

/**
 * Extract numeric value from currency string and convert to INR if needed
 * @param value - String or number value
 * @param exchangeRate - USD to INR exchange rate (default: 88.7)
 * @returns Numeric value in INR
 */
export const parseCurrencyValue = (value: any, exchangeRate: number = 88.7): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return undefined;
  
  // Remove currency symbols and extract numbers
  const cleanValue = value.replace(/[₹$€£,]/g, '');
  const match = cleanValue.match(/\d+/);
  if (!match) return undefined;
  
  const numericValue = parseInt(match[0], 10);
  
  // Convert from USD to INR if the original value contained $
  if (value.includes('$')) {
    return convertUSDToINR(numericValue, exchangeRate);
  }
  
  return numericValue;
};

/**
 * Format budget range for display
 * @param min - Minimum amount
 * @param max - Maximum amount
 * @returns Formatted budget range string
 */
export const formatBudgetRange = (min: number, max: number): string => {
  return `${formatCurrencyDisplay(min)} - ${formatCurrencyDisplay(max)}`;
};

/**
 * Format per-day cost
 * @param amount - Amount per day
 * @param days - Number of days
 * @returns Formatted per-day cost string
 */
export const formatPerDayCost = (amount: number, days: number): string => {
  const perDay = amount / days;
  return `${formatCurrencyDisplay(perDay)} per day`;
};

/**
 * Validate currency input
 * @param input - Input string
 * @returns True if valid currency format
 */
export const isValidCurrencyInput = (input: string): boolean => {
  const cleanInput = input.replace(/[₹$€£,\s]/g, '');
  return /^\d+$/.test(cleanInput) && parseInt(cleanInput) > 0;
};

/**
 * Currency symbols and their names
 */
export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
} as const;

/**
 * Get currency symbol by code
 * @param currencyCode - Currency code (INR, USD, etc.)
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCY_SYMBOLS[currencyCode as keyof typeof CURRENCY_SYMBOLS] || '₹';
};
