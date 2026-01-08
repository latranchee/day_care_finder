import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logout, SESSION_COOKIE_NAME } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);

	if (sessionId) {
		logout(sessionId);
	}

	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });

	throw redirect(302, '/login');
};
