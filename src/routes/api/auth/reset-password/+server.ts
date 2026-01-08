import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkRateLimit, PASSWORD_RESET_RATE_LIMIT, getRateLimitHeaders } from '$lib/server/rate-limit';
import { resetPassword, validatePasswordResetToken } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
	// Very strict rate limit for password reset: 3 attempts per hour
	const rateLimitResult = checkRateLimit(event, PASSWORD_RESET_RATE_LIMIT);

	if (!rateLimitResult.allowed) {
		throw error(429, {
			message: 'Too many password reset attempts. Please try again later.',
			// @ts-expect-error - SvelteKit allows custom error properties
			retryAfter: rateLimitResult.retryAfter
		});
	}

	const body = await event.request.json();
	const token = body.token?.toString().trim();
	const password = body.password?.toString();

	if (!token) {
		throw error(400, 'Reset token is required');
	}

	if (!password) {
		throw error(400, 'Password is required');
	}

	// Attempt to reset the password
	const result = await resetPassword(token, password);

	if (!result.success) {
		return json(
			{ success: false, error: result.error },
			{
				status: 400,
				headers: getRateLimitHeaders(rateLimitResult, PASSWORD_RESET_RATE_LIMIT)
			}
		);
	}

	return json(
		{ success: true },
		{
			headers: getRateLimitHeaders(rateLimitResult, PASSWORD_RESET_RATE_LIMIT)
		}
	);
};

// GET endpoint to validate a token without using it
export const GET: RequestHandler = async (event) => {
	const token = event.url.searchParams.get('token');

	if (!token) {
		throw error(400, 'Reset token is required');
	}

	const result = validatePasswordResetToken(token);

	if (!result.valid) {
		return json({ valid: false, error: result.error }, { status: 400 });
	}

	return json({ valid: true, email: result.email });
};
