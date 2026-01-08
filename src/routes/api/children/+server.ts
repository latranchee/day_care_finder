import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getChildrenByUserId, createChild } from '$lib/server/db';
import { requireAuth } from '$lib/server/authorization';
import type { ChildInput } from '$lib/types';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const children = getChildrenByUserId(user.id);
	return json(children);
};

export const POST: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const input: ChildInput = await event.request.json();

	if (!input.name || input.name.trim() === '') {
		return json({ error: 'Name is required' }, { status: 400 });
	}

	if (!input.date_of_birth) {
		return json({ error: 'Date of birth is required' }, { status: 400 });
	}

	// Validate date format and ensure it's in the past
	const dob = new Date(input.date_of_birth);
	if (isNaN(dob.getTime())) {
		return json({ error: 'Invalid date of birth' }, { status: 400 });
	}
	if (dob > new Date()) {
		return json({ error: 'Date of birth must be in the past' }, { status: 400 });
	}

	const child = createChild(input, user.id);
	return json(child, { status: 201 });
};
