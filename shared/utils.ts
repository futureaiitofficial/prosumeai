/**
 * Shared utility functions for handling type conversions and common operations
 */

/**
 * Safely converts a string to a number
 * Returns NaN if conversion is not possible
 */
export function toNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return NaN;
  if (typeof value === 'number') return value;
  return Number(value);
}

/**
 * Safely converts a value to a string
 * Returns empty string for undefined/null
 */
export function toString(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

/**
 * Type guard to check if a value is a proper number (not NaN)
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Safely parses an ID from any source to a number
 * Returns undefined if conversion is not possible
 */
export function parseId(id: string | number | undefined | null): number | undefined {
  if (id === undefined || id === null) return undefined;
  const num = typeof id === 'number' ? id : Number(id);
  return isNaN(num) ? undefined : num;
}

/**
 * Converts an array of objects with string IDs to number IDs
 * Useful for processing form data or API responses
 */
export function convertIdsToNumbers<T extends {id?: string | number}>(items: T[]): (Omit<T, 'id'> & {id?: number})[] {
  return items.map(item => ({
    ...item,
    id: item.id ? parseId(item.id) : undefined
  }));
}

/**
 * Formats a date string to a consistent format
 * @param date The date string or Date object to format
 * @param format The format to use (default: 'YYYY-MM-DD')
 */
export function formatDate(date: string | Date | undefined | null, format: string = 'YYYY-MM-DD'): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  // Simple date formatter
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  // Replace format tokens with actual values
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day);
} 