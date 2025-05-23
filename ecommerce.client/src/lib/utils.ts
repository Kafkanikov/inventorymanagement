import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to format currency (can be moved to a shared utils file)
export const formatCurrency = (amount: number | null | undefined, currencySymbol: string = '$'): string => {
  if (amount === null || amount === undefined) {
    return '-';
  }
  // Handle negative numbers by placing the sign before the currency symbol
  const sign = amount < 0 ? '-' : '';
  const absoluteAmount = Math.abs(amount);
  return `${sign}${currencySymbol}${absoluteAmount.toFixed(2)}`; // Assuming 2 decimal places
};

// Helper to format dates (can be moved to a shared utils file)
export const formatDateForDisplay = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    // Assuming dateString is like "2025-05-23T00:00:00"
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};