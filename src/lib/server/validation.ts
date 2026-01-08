import { error } from '@sveltejs/kit';
import { getDaycareById } from './db';
import type { Daycare } from '$lib/types';

/**
 * Parses and validates an ID parameter from route params.
 * @param params - Object containing the id string parameter
 * @returns The parsed numeric ID
 * @throws 400 error if ID is not a valid number
 */
export function parseIdParam(params: { id: string }): number {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		throw error(400, 'Invalid ID');
	}
	return id;
}

/**
 * Gets a daycare by ID, throwing a 404 error if not found.
 * @param id - The daycare ID
 * @returns The daycare object
 * @throws 404 error if daycare not found
 */
export function requireDaycare(id: number): Daycare {
	const daycare = getDaycareById(id);
	if (!daycare) {
		throw error(404, 'Daycare not found');
	}
	return daycare;
}

/**
 * Validates that a string value is non-empty after trimming.
 * @param value - The string value to validate
 * @param fieldName - The field name for the error message
 * @returns The trimmed string value
 * @throws 400 error if value is undefined, null, or empty after trimming
 */
export function requireNonEmptyString(value: string | undefined | null, fieldName: string): string {
	if (!value || value.trim() === '') {
		throw error(400, `${fieldName} is required`);
	}
	return value.trim();
}
