import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCommentById, commentHasReplies, softDeleteComment, deleteComment } from '$lib/server/db';
import { parseIdParam } from '$lib/server/validation';
import { deleted, notFound } from '$lib/server/api-utils';
import { requireAuth } from '$lib/server/authorization';

export const DELETE: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const commentId = parseIdParam(event.params);

	const comment = getCommentById(commentId);
	if (!comment) {
		notFound('Comment');
	}

	// Only the author can delete their own comment
	if (comment.user_id !== user.id) {
		throw error(403, 'You can only delete your own comments');
	}

	// Check if comment has replies
	const hasReplies = commentHasReplies(commentId);

	if (hasReplies) {
		// Soft delete: replace content with [deleted]
		softDeleteComment(commentId);
	} else {
		// Hard delete: remove from database
		deleteComment(commentId);
	}

	return deleted();
};
