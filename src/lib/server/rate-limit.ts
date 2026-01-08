import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * In-memory sliding window rate limiter.
 *
 * NOTE: This implementation uses in-memory storage and is suitable for
 * single-instance deployments only. For multi-instance deployments (e.g.,
 * load-balanced servers), use Redis or another distributed store to share
 * rate limit state across instances.
 */

// Store: Map of identifier -> array of timestamps (in milliseconds)
const requestTimestamps: Map<string, number[]> = new Map();

// Cleanup interval: remove old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Start periodic cleanup
setInterval(() => {
	const now = Date.now();
	const oneHourAgo = now - 60 * 60 * 1000;

	requestTimestamps.forEach((timestamps, key) => {
		// Remove timestamps older than 1 hour (the longest window we use)
		const filtered = timestamps.filter(ts => ts > oneHourAgo);
		if (filtered.length === 0) {
			requestTimestamps.delete(key);
		} else {
			requestTimestamps.set(key, filtered);
		}
	});
}, CLEANUP_INTERVAL);

export interface RateLimitConfig {
	/** Maximum number of requests allowed in the window */
	maxRequests: number;
	/** Time window in milliseconds */
	windowMs: number;
	/** Identifier prefix for this limiter (e.g., 'login', 'signup') */
	prefix: string;
}

export interface RateLimitResult {
	/** Whether the request is allowed */
	allowed: boolean;
	/** Number of remaining requests in the current window */
	remaining: number;
	/** Unix timestamp (seconds) when the rate limit resets */
	resetTime: number;
	/** Seconds until the rate limit resets (for Retry-After header) */
	retryAfter: number;
}

/**
 * Extracts the client IP address from a request event.
 * Checks X-Forwarded-For header first (for proxied requests), then falls back to getClientAddress().
 */
function getClientIP(event: RequestEvent): string {
	// Check for X-Forwarded-For header (common with reverse proxies/load balancers)
	const forwardedFor = event.request.headers.get('x-forwarded-for');
	if (forwardedFor) {
		// Take the first IP in the list (the original client)
		return forwardedFor.split(',')[0].trim();
	}

	// Fall back to SvelteKit's getClientAddress()
	try {
		return event.getClientAddress();
	} catch {
		// If getClientAddress() fails (e.g., in some test environments), use a fallback
		return 'unknown';
	}
}

/**
 * Check and update rate limit for a given request.
 * Uses sliding window algorithm: counts requests within the window from now.
 */
export function checkRateLimit(event: RequestEvent, config: RateLimitConfig): RateLimitResult {
	const ip = getClientIP(event);
	const key = `${config.prefix}:${ip}`;
	const now = Date.now();
	const windowStart = now - config.windowMs;

	// Get existing timestamps and filter to current window
	const timestamps = requestTimestamps.get(key) || [];
	const validTimestamps = timestamps.filter(ts => ts > windowStart);

	// Calculate when the oldest request in window will expire
	const oldestInWindow = validTimestamps.length > 0 ? Math.min(...validTimestamps) : now;
	const resetTime = Math.ceil((oldestInWindow + config.windowMs) / 1000);
	const retryAfter = Math.max(0, Math.ceil((oldestInWindow + config.windowMs - now) / 1000));

	// Check if limit exceeded
	if (validTimestamps.length >= config.maxRequests) {
		return {
			allowed: false,
			remaining: 0,
			resetTime,
			retryAfter
		};
	}

	// Add current request timestamp
	validTimestamps.push(now);
	requestTimestamps.set(key, validTimestamps);

	return {
		allowed: true,
		remaining: config.maxRequests - validTimestamps.length,
		resetTime,
		retryAfter: 0
	};
}

/**
 * Rate limit middleware that throws a 429 error if limit exceeded.
 * Use at the start of route handlers.
 */
export function rateLimit(event: RequestEvent, config: RateLimitConfig): void {
	const result = checkRateLimit(event, config);

	if (!result.allowed) {
		throw error(429, {
			message: 'Too many requests. Please try again later.',
			// @ts-expect-error - SvelteKit allows custom error properties
			retryAfter: result.retryAfter
		});
	}
}

/**
 * Creates rate limit headers to include in responses.
 * Useful for informing clients about their rate limit status.
 */
export function getRateLimitHeaders(result: RateLimitResult, config: RateLimitConfig): Record<string, string> {
	return {
		'X-RateLimit-Limit': config.maxRequests.toString(),
		'X-RateLimit-Remaining': result.remaining.toString(),
		'X-RateLimit-Reset': result.resetTime.toString(),
		...(result.allowed ? {} : { 'Retry-After': result.retryAfter.toString() })
	};
}

// Pre-configured rate limiters for common use cases

/** Strict limit for authentication endpoints: 5 attempts per minute */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
	maxRequests: 5,
	windowMs: 60 * 1000, // 1 minute
	prefix: 'auth'
};

/** Very strict limit for password reset: 3 attempts per hour */
export const PASSWORD_RESET_RATE_LIMIT: RateLimitConfig = {
	maxRequests: 3,
	windowMs: 60 * 60 * 1000, // 1 hour
	prefix: 'password-reset'
};

/** Moderate limit for data import: 10 per hour */
export const IMPORT_RATE_LIMIT: RateLimitConfig = {
	maxRequests: 10,
	windowMs: 60 * 60 * 1000, // 1 hour
	prefix: 'import'
};
