import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllSettings, setSetting } from '$lib/server/db';

export const GET: RequestHandler = async () => {
	const settings = getAllSettings();
	return json(settings);
};

export const PUT: RequestHandler = async ({ request }) => {
	const updates: Record<string, string> = await request.json();

	for (const [key, value] of Object.entries(updates)) {
		if (typeof value === 'string') {
			setSetting(key, value);
		}
	}

	const settings = getAllSettings();
	return json(settings);
};
