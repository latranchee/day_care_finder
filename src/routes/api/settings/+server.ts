import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllSettings, setSetting } from '$lib/server/db';
import { requireAuth } from '$lib/server/authorization';

export const GET: RequestHandler = async (event) => {
	requireAuth(event);
	const settings = getAllSettings();
	return json(settings);
};

export const PUT: RequestHandler = async (event) => {
	requireAuth(event);
	const { request } = event;
	const updates: Record<string, string> = await request.json();

	for (const [key, value] of Object.entries(updates)) {
		if (typeof value === 'string') {
			setSetting(key, value);
		}
	}

	const settings = getAllSettings();
	return json(settings);
};
