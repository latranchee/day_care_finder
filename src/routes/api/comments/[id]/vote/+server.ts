import type { RequestHandler } from './$types';
import { getCommentById, upsertCommentVote, removeCommentVote, getCommentVoteCounts } from '$lib/server/db';
import { parseIdParam } from '$lib/server/validation';
import { success, notFound, badRequest } from '$lib/server/api-utils';
import { requireAuth } from '$lib/server/authorization';

export const POST: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const commentId = parseIdParam(event.params);

	const comment = getCommentById(commentId);
	if (!comment) {
		notFound('Comment');
	}

	const { vote } = await event.request.json();

	if (![-1, 0, 1].includes(vote)) {
		badRequest('Vote must be -1, 0, or 1');
	}

	if (vote === 0) {
		// Remove vote
		removeCommentVote(commentId, user.id);
	} else {
		// Upsert vote
		upsertCommentVote(commentId, user.id, vote);
	}

	// Return updated vote counts
	const voteCounts = getCommentVoteCounts(commentId);
	return success(voteCounts);
};
