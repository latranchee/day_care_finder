import type { RequestHandler } from './$types';
import { deleteReview, getReviewDaycareId, recalculateDaycareRating } from '$lib/server/db';
import { parseIdParam } from '$lib/server/validation';
import { deleted, notFound } from '$lib/server/api-utils';
import { requireAuth, requireDaycareAccess } from '$lib/server/authorization';

export const DELETE: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const id = parseIdParam(event.params);

	// Get the daycare ID before deleting so we can recalculate rating
	const daycareId = getReviewDaycareId(id);
	if (!daycareId) {
		notFound('Review');
	}

	// Verify user has access to this review's daycare
	requireDaycareAccess(user.id, daycareId);

	const result = deleteReview(id);
	if (!result) {
		notFound('Review');
	}

	// Recalculate the daycare's average rating
	recalculateDaycareRating(daycareId);

	return deleted();
};
