import { json, error } from '@sveltejs/kit';
import { STAGE_IDS, type Stage } from '$lib/types';

// =============================================================================
// Standard Success Responses
// =============================================================================

/**
 * Returns a JSON response with 201 Created status.
 * Use for successful POST requests that create a new resource.
 */
export function created<T>(data: T) {
	return json(data, { status: 201 });
}

/**
 * Returns a JSON response with 200 OK status.
 * Use for successful GET/PUT requests.
 */
export function success<T>(data: T) {
	return json(data);
}

/**
 * Returns a JSON response indicating successful deletion.
 * Use for successful DELETE requests.
 */
export function deleted() {
	return json({ success: true });
}

// =============================================================================
// Standard Error Throwers
// =============================================================================

/**
 * Throws a 404 Not Found error.
 * @param resource - The name of the resource that wasn't found (e.g., "Daycare", "Note")
 */
export function notFound(resource: string): never {
	throw error(404, `${resource} not found`);
}

/**
 * Throws a 401 Unauthorized error.
 * @param message - Optional custom message (defaults to "Login required")
 */
export function unauthorized(message = 'Login required'): never {
	throw error(401, message);
}

/**
 * Throws a 400 Bad Request error.
 * @param message - The error message describing the validation failure
 */
export function badRequest(message: string): never {
	throw error(400, message);
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validates that a stage value is a valid Stage type.
 * @param stage - The stage value to validate
 * @returns The validated Stage value
 * @throws 400 error if the stage is invalid
 */
export function validateStage(stage: unknown): Stage {
	if (typeof stage !== 'string' || !STAGE_IDS.includes(stage as Stage)) {
		badRequest('Invalid stage value');
	}
	return stage as Stage;
}
