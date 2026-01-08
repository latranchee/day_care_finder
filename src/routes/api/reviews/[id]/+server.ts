import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteReview, getReviewDaycareId, recalculateDaycareRating } from '$lib/server/db';

export const DELETE: RequestHandler = async ({ params }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		throw error(400, 'Invalid ID');
	}

	// Get the daycare ID before deleting so we can recalculate rating
	const daycareId = getReviewDaycareId(id);

	const success = deleteReview(id);
	if (!success) {
		throw error(404, 'Review not found');
	}

	// Recalculate the daycare's average rating
	if (daycareId) {
		recalculateDaycareRating(daycareId);
	}

	return json({ success: true });
};
