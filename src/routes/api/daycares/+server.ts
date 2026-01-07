import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllDaycares, createDaycare } from '$lib/server/db';
import type { DaycareInput } from '$lib/types';

export const GET: RequestHandler = async () => {
	const daycares = getAllDaycares();
	return json(daycares);
};

export const POST: RequestHandler = async ({ request }) => {
	const input: DaycareInput = await request.json();

	if (!input.name || input.name.trim() === '') {
		return json({ error: 'Name is required' }, { status: 400 });
	}

	const daycare = createDaycare(input);
	return json(daycare, { status: 201 });
};
