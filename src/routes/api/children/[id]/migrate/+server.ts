import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { assignDaycaresToChild } from '$lib/server/db';
import { requireAuth, requireChildAccess } from '$lib/server/authorization';

export const POST: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const childId = parseInt(event.params.id);

	if (isNaN(childId)) {
		return json({ error: 'Invalid child ID' }, { status: 400 });
	}

	requireChildAccess(user.id, childId);

	const count = assignDaycaresToChild(childId);
	return json({ success: true, count });
};
