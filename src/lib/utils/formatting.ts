/**
 * Shared formatting utilities for the daycare finder application.
 */

/**
 * Converts a numeric rating to a star display string.
 * @param rating - The rating value (0-5), or null
 * @returns A string of filled (★) and empty (☆) stars, or '—' if null
 */
export function formatRating(rating: number | null): string {
	if (rating === null) return '—';
	const roundedRating = Math.round(rating);
	return '★'.repeat(roundedRating) + '☆'.repeat(5 - roundedRating);
}

/**
 * Truncates text to a maximum length, adding ellipsis if truncated.
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation (default: 80)
 * @returns The truncated text with ellipsis, or original if shorter than maxLength
 */
export function truncateText(text: string, maxLength: number = 80): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength).trim() + '...';
}

/**
 * Formats an ISO date string for display.
 * @param dateStr - The ISO date string to format
 * @param locale - The locale to use ('en' or 'fr'), defaults to 'en'
 * @returns A formatted date string (e.g., "Jan 15, 2:30 PM")
 */
export function formatDate(dateStr: string, locale: 'en' | 'fr' = 'en'): string {
	const localeCode = locale === 'fr' ? 'fr-CA' : 'en-US';
	return new Date(dateStr).toLocaleDateString(localeCode, {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
}
