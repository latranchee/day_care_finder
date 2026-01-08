import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/authorization';
import { getAllUsers } from '$lib/server/db';

/**
 * GET /api/admin/users
 * Returns all users with their admin status.
 * Requires admin access.
 */
export const GET: RequestHandler = async (event) => {
	requireAdmin(event);

	const users = getAllUsers();

	// Don't expose password hashes in the response
	const sanitizedUsers = users.map(({ password_hash, ...user }) => user);

	return json({ users: sanitizedUsers });
};
