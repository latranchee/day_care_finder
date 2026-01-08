import { env } from '$env/dynamic/private';

// Environment variable exports
export const GOOGLE_PLACES_API_KEY = env.GOOGLE_PLACES_API_KEY;
export const SERPAPI = env.SERPAPI;

/**
 * Validates that all required environment variables are set.
 * Call this at startup to fail fast if configuration is missing.
 */
export function validateEnv(): void {
	const missing: string[] = [];

	if (!env.SERPAPI) {
		missing.push('SERPAPI');
	}

	if (!env.GOOGLE_PLACES_API_KEY) {
		missing.push('GOOGLE_PLACES_API_KEY');
	}

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(', ')}. ` +
				`See .env.example for required configuration.`
		);
	}
}

/**
 * Returns the Google Places API key, throwing an error if not configured.
 */
export function requireGooglePlacesKey(): string {
	if (!GOOGLE_PLACES_API_KEY) {
		throw new Error(
			'GOOGLE_PLACES_API_KEY environment variable is not set. See .env.example for configuration.'
		);
	}
	return GOOGLE_PLACES_API_KEY;
}

/**
 * Returns the SerpAPI key, throwing an error if not configured.
 */
export function requireSerpApiKey(): string {
	if (!SERPAPI) {
		throw new Error(
			'SERPAPI environment variable is not set. See .env.example for configuration.'
		);
	}
	return SERPAPI;
}
