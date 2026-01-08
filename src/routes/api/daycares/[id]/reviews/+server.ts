import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getReviewsByDaycareId, createReview, recalculateDaycareRating } from '$lib/server/db';
import { parseIdParam, requireDaycare, requireNonEmptyString } from '$lib/server/validation';

export const GET: RequestHandler = async ({ params }) => {
	const daycareId = parseIdParam(params);
	requireDaycare(daycareId);

	const reviews = getReviewsByDaycareId(daycareId);
	return json(reviews);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const daycareId = parseIdParam(params);
	requireDaycare(daycareId);

	const { text, source_url, rating } = await request.json();

	const validatedText = requireNonEmptyString(text, 'Review text');

	if (!rating || rating < 1 || rating > 5) {
		throw error(400, 'Rating must be between 1 and 5');
	}

	const review = createReview(daycareId, {
		text: validatedText,
		source_url: source_url?.trim() || '',
		rating
	});

	// Recalculate the daycare's average rating
	recalculateDaycareRating(daycareId);

	return json(review, { status: 201 });
};
