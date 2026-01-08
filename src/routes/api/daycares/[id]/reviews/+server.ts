import type { RequestHandler } from './$types';
import { getReviewsByDaycareId, createReview, recalculateDaycareRating } from '$lib/server/db';
import { parseIdParam, requireNonEmptyString } from '$lib/server/validation';
import { success, created, badRequest } from '$lib/server/api-utils';
import { requireAuth, requireDaycareAccess } from '$lib/server/authorization';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const daycareId = parseIdParam(event.params);

	// Verify user has access to this daycare
	requireDaycareAccess(user.id, daycareId);

	const reviews = getReviewsByDaycareId(daycareId);
	return success(reviews);
};

export const POST: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const daycareId = parseIdParam(event.params);

	// Verify user has access to this daycare
	requireDaycareAccess(user.id, daycareId);

	const { text, source_url, rating } = await event.request.json();

	const validatedText = requireNonEmptyString(text, 'Review text');

	if (!rating || rating < 1 || rating > 5) {
		badRequest('Rating must be between 1 and 5');
	}

	const review = createReview(daycareId, {
		text: validatedText,
		source_url: source_url?.trim() || '',
		rating
	});

	// Recalculate the daycare's average rating
	recalculateDaycareRating(daycareId);

	return created(review);
};
