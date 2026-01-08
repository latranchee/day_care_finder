import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { claimInvitation } from '$lib/server/db';
import { requireAuth } from '$lib/server/authorization';

export const POST: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const { code } = await event.request.json();

	if (!code || typeof code !== 'string') {
		return json({ error: 'Invitation code is required' }, { status: 400 });
	}

	const result = claimInvitation(code.toUpperCase().trim(), user.id);

	if (!result.success) {
		return json({ error: result.error }, { status: 400 });
	}

	return json({ success: true, childId: result.childId });
};
