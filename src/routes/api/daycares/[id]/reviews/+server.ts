import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDaycareById, getReviewsByDaycareId, createReview, recalculateDaycareRating } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
	const daycareId = parseInt(params.id);
	if (isNaN(daycareId)) {
		throw error(400, 'Invalid ID');
	}

	const daycare = getDaycareById(daycareId);
	if (!daycare) {
		throw error(404, 'Daycare not found');
	}

	const reviews = getReviewsByDaycareId(daycareId);
	return json(reviews);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const daycareId = parseInt(params.id);
	if (isNaN(daycareId)) {
		throw error(400, 'Invalid ID');
	}

	const daycare = getDaycareById(daycareId);
	if (!daycare) {
		throw error(404, 'Daycare not found');
	}

	const { text, source_url, rating } = await request.json();

	if (!text || text.trim() === '') {
		throw error(400, 'Review text is required');
	}

	if (!rating || rating < 1 || rating > 5) {
		throw error(400, 'Rating must be between 1 and 5');
	}

	const review = createReview(daycareId, {
		text: text.trim(),
		source_url: source_url?.trim() || '',
		rating
	});

	// Recalculate the daycare's average rating
	recalculateDaycareRating(daycareId);

	return json(review, { status: 201 });
};
