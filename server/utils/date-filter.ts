/**
 * Date filtering utilities for time-based fleet analytics
 */

export type TimePeriod = 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'bi-annually' | 'yearly';

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Calculate date range for a given time period
 */
export function calculateDateRange(period: TimePeriod, endDate: Date = new Date()): DateRange {
  const start = new Date(endDate);
  
  switch (period) {
    case 'weekly':
      start.setDate(endDate.getDate() - 7);
      break;
    case 'bi-weekly':
      start.setDate(endDate.getDate() - 14);
      break;
    case 'monthly':
      start.setMonth(endDate.getMonth() - 1);
      break;
    case 'quarterly':
      start.setMonth(endDate.getMonth() - 3);
      break;
    case 'bi-annually':
      start.setMonth(endDate.getMonth() - 6);
      break;
    case 'yearly':
      start.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      start.setDate(endDate.getDate() - 7); // Default to weekly
  }
  
  return { start, end: endDate };
}

/**
 * Check if a date falls within the specified range
 */
export function isDateInRange(date: Date | string, range: DateRange): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  return checkDate >= range.start && checkDate <= range.end;
}

/**
 * Filter array of items by date field within range
 */
export function filterByDateRange<T>(
  items: T[], 
  dateField: keyof T, 
  range: DateRange
): T[] {
  return items.filter(item => {
    const dateValue = item[dateField];
    if (!dateValue) return false;
    return isDateInRange(dateValue as Date | string, range);
  });
}

/**
 * Parse date filter parameters from query string
 */
export function parseDateFilterParams(query: any): { period?: TimePeriod; range?: DateRange } {
  const { period, startDate, endDate } = query;
  
  if (period && ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'bi-annually', 'yearly'].includes(period)) {
    let range: DateRange;
    
    if (startDate && endDate) {
      const parsedStart = new Date(startDate);
      const parsedEnd = new Date(endDate);
      
      // Validate parsed dates
      if (!isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
        range = { start: parsedStart, end: parsedEnd };
      } else {
        range = calculateDateRange(period as TimePeriod);
      }
    } else {
      range = calculateDateRange(period as TimePeriod);
    }
    
    return {
      period: period as TimePeriod,
      range
    };
  }
  
  // If no period is provided, return empty (all-time data)
  return {};
}

/**
 * Format date range for display
 */
export function formatDateRange(range: DateRange, period: TimePeriod): string {
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
    year: period === 'yearly' || period === 'bi-annually' ? 'numeric' : undefined
  };
  
  return `${range.start.toLocaleDateString('en-US', options)} - ${range.end.toLocaleDateString('en-US', options)}`;
}