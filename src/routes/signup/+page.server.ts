import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { signup } from '$lib/server/auth';

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
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		throw redirect(302, '/');
	}
};
