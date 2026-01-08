import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkRateLimit, PASSWORD_RESET_RATE_LIMIT, getRateLimitHeaders } from '$lib/server/rate-limit';
import { initiatePasswordReset } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
	// Very strict rate limit for password reset: 3 attempts per hour
	const rateLimitResult = checkRateLimit(event, PASSWORD_RESET_RATE_LIMIT);

	if (!rateLimitResult.allowed) {
		throw error(429, {
			message: 'Too many password reset requests. Please try again later.',
			// @ts-expect-error - SvelteKit allows custom error properties
			retryAfter: rateLimitResult.retryAfter
		});
	}

	const { request, url } = event;
	const body = await request.json();
	const email = body.email?.toString().trim().toLowerCase();

	if (!email) {
		throw error(400, 'Email is required');
	}

	// Get base URL for the reset link
	const baseUrl = `${url.protocol}//${url.host}`;

	// Initiate password reset (logs URL to console for now)
	// Always returns success to prevent email enumeration
	initiatePasswordReset(email, baseUrl);

	// Return success with rate limit headers
	return json(
		{ success: true },
		{
			headers: getRateLimitHeaders(rateLimitResult, PASSWORD_RESET_RATE_LIMIT)
		}
	);
};
