import type { Handle } from '@sveltejs/kit';
import { getSession, SESSION_COOKIE_NAME } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Get session from cookie
	const sessionId = event.cookies.get(SESSION_COOKIE_NAME);

	if (sessionId) {
		const user = getSession(sessionId);
		if (user) {
			event.locals.user = user;
		}
	}

	return resolve(event);
};
