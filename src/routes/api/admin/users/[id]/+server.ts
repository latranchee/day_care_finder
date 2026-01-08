import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/authorization';
import { getUserById, setUserAdminStatus } from '$lib/server/db';

/**
 * PATCH /api/admin/users/[id]
 * Updates a user's admin status.
 * Requires admin access.
 *
 * Request body:
 * { is_admin: boolean }
 */
export const PATCH: RequestHandler = async (event) => {
	const currentUser = requireAdmin(event);

	const userId = parseInt(event.params.id, 10);
	if (isNaN(userId)) {
		throw error(400, 'Invalid user ID');
	}

	const targetUser = getUserById(userId);
	if (!targetUser) {
		throw error(404, 'User not found');
	}

	// Prevent admins from removing their own admin status
	// This ensures at least one admin always exists
	if (userId === currentUser.id) {
		throw error(400, 'Cannot modify your own admin status');
	}

	const body = await event.request.json();

	if (typeof body.is_admin !== 'boolean') {
		throw error(400, 'is_admin must be a boolean');
	}

	const updatedUser = setUserAdminStatus(userId, body.is_admin);

	if (!updatedUser) {
		throw error(500, 'Failed to update user');
	}

	// Don't expose password hash in the response
	const { password_hash, ...sanitizedUser } = updatedUser;

	return json({ user: sanitizedUser });
};
