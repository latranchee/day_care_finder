import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { login, createSessionCookie } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if already logged in
	if (locals.user) {
		throw redirect(302, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
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
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		throw redirect(302, '/');
	}
};
