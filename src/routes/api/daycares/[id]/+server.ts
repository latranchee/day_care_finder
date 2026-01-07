import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDaycareById, updateDaycare, deleteDaycare, moveDaycare } from '$lib/server/db';
import type { DaycareInput, Stage } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		throw error(400, 'Invalid ID');
	}

	const daycare = getDaycareById(id);
	if (!daycare) {
		throw error(404, 'Daycare not found');
	}

	return json(daycare);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		throw error(400, 'Invalid ID');
	}

	const body = await request.json();

	// Check if this is a move operation
	if ('stage' in body && 'position' in body) {
		const daycare = moveDaycare(id, body.stage as Stage, body.position as number);
		if (!daycare) {
			throw error(404, 'Daycare not found');
		}
		return json(daycare);
	}

	// Otherwise it's a regular update
	const input: Partial<DaycareInput> = body;
	const daycare = updateDaycare(id, input);
	if (!daycare) {
		throw error(404, 'Daycare not found');
	}

	return json(daycare);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		throw error(400, 'Invalid ID');
	}

	const success = deleteDaycare(id);
	if (!success) {
		throw error(404, 'Daycare not found');
	}

	return json({ success: true });
};
