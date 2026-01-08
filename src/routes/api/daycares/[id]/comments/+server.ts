import type { RequestHandler } from './$types';
import { getCommentsByDaycareId, createComment, getCommentById } from '$lib/server/db';
import { parseIdParam, requireNonEmptyString } from '$lib/server/validation';
import { success, created, badRequest } from '$lib/server/api-utils';
import { requireAuth, requireDaycareAccess } from '$lib/server/authorization';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const daycareId = parseIdParam(event.params);

	// Verify user has access to this daycare
	requireDaycareAccess(user.id, daycareId);

	const comments = getCommentsByDaycareId(daycareId, user.id);
	return success(comments);
};

export const POST: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const daycareId = parseIdParam(event.params);

	// Verify user has access to this daycare
	requireDaycareAccess(user.id, daycareId);

	const { content, parent_id } = await event.request.json();
	const trimmedContent = requireNonEmptyString(content, 'Content');

	// Validate parent_id if provided
	if (parent_id !== undefined && parent_id !== null) {
		const parentComment = getCommentById(parent_id);
		if (!parentComment || parentComment.daycare_id !== daycareId) {
			badRequest('Invalid parent comment');
		}
	}

	const comment = createComment(daycareId, user.id, {
		content: trimmedContent,
		parent_id: parent_id ?? null
	});

	return created(comment);
};
