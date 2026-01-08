import { redirect, fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';
import { signup } from '$lib/server/auth';
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

		// Check rate limit before processing signup attempt
		const rateLimitResult = checkRateLimit(event, AUTH_RATE_LIMIT);
		if (!rateLimitResult.allowed) {
			return fail(429, {
				error: 'Too many signup attempts. Please try again later.',
				retryAfter: rateLimitResult.retryAfter
			});
		}

		const data = await request.formData();
		const email = data.get('email')?.toString() || '';
		const password = data.get('password')?.toString() || '';
		const confirmPassword = data.get('confirmPassword')?.toString() || '';
		const name = data.get('name')?.toString() || '';
		const homeAddress = data.get('homeAddress')?.toString() || '';
		const maxCommuteMinutes = parseInt(data.get('maxCommuteMinutes')?.toString() || '5', 10);

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email, name, homeAddress, maxCommuteMinutes });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match', email, name, homeAddress, maxCommuteMinutes });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters', email, name, homeAddress, maxCommuteMinutes });
		}

		const result = await signup(email, password, name, homeAddress, maxCommuteMinutes);

		if (!result.success) {
			return fail(400, { error: result.error, email, name, homeAddress, maxCommuteMinutes });
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
