import { error } from '@sveltejs/kit';
import { canUserAccessChild, getDaycareById } from './db';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Check if a user is an admin using the is_admin database field.
 * Falls back to checking the legacy admin email for backward compatibility
 * during the migration period.
 */
export function isAdmin(user: { email: string; is_admin?: boolean } | null): boolean {
	if (!user) return false;
	// Primary check: use the is_admin field from the database
	if (user.is_admin !== undefined) {
		return user.is_admin;
	}
	// Fallback for backward compatibility during migration
	// This handles cases where the user object might not have is_admin loaded
	return user.email === 'ol@latranchee.com';
}

/**
 * Requires an admin user. Throws 401 if not logged in, 403 if not admin.
 * Returns the user object from locals.
 */
export function requireAdmin(event: RequestEvent): NonNullable<App.Locals['user']> {
	const user = requireAuth(event);
	if (!isAdmin(user)) {
		throw error(403, 'Admin access required');
	}
	return user;
}

/**
 * Requires an authenticated user. Throws 401 if not logged in.
 * Returns the user object from locals.
 */
export function requireAuth(event: RequestEvent): NonNullable<App.Locals['user']> {
	if (!event.locals.user) {
		throw error(401, 'Authentication required');
	}
	return event.locals.user;
}

/**
 * Requires user has access to the specified child. Throws 403 if not.
 */
export function requireChildAccess(userId: number, childId: number): void {
	if (!canUserAccessChild(userId, childId)) {
		throw error(403, 'You do not have access to this child profile');
	}
}

/**
 * Requires user has access to the daycare (via its child). Throws 403 if not.
 * Returns the daycare if access is granted.
 */
export function requireDaycareAccess(userId: number, daycareId: number) {
	const daycare = getDaycareById(daycareId);
	if (!daycare) {
		throw error(404, 'Daycare not found');
	}
	if (daycare.child_id && !canUserAccessChild(userId, daycare.child_id)) {
		throw error(403, 'You do not have access to this daycare');
	}
	return daycare;
}
