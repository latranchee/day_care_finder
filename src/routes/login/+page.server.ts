import { redirect, fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';
import { login, createSessionCookie } from '$lib/server/auth';
import { checkRateLimit, AUTH_RATE_LIMIT } from '$lib/server/rate-limit';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if already logged in
	if (locals.user) {
		throw redirect(302, '/');
	}
};

export const actions: Actions = {
	default: async (event) => {
		const { request, cookies } = event;

		// Check rate limit before processing login attempt
		const rateLimitResult = checkRateLimit(event, AUTH_RATE_LIMIT);
		if (!rateLimitResult.allowed) {
			return fail(429, {
				error: 'Too many login attempts. Please try again later.',
				retryAfter: rateLimitResult.retryAfter
			});
		}

		const data = await request.formData();
		const email = data.get('email')?.toString() || '';
		const password = data.get('password')?.toString() || '';

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		const result = await login(email, password);

		if (!result.success) {
			return fail(400, { error: result.error, email });
		}

		// Set session cookie
		cookies.set('session_id', result.sessionId!, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		throw redirect(302, '/');
	}
};
