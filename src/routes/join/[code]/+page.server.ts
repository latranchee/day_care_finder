import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getInvitationByCode, claimInvitation } from '$lib/server/db';

export const load: PageServerLoad = async ({ params, locals }) => {
	const code = params.code.toUpperCase();

	// Get invitation details
	const invitation = getInvitationByCode(code);

	if (!invitation) {
		return {
			error: 'invalid',
			childName: null,
			code
		};
	}

	// Check if expired
	if (new Date(invitation.expires_at) < new Date()) {
		return {
			error: 'expired',
			childName: invitation.child.name,
			code
		};
	}

	// Check if already used
	if (invitation.used_by_user_id) {
		return {
			error: 'used',
			childName: invitation.child.name,
			code
		};
	}

	return {
		error: null,
		childName: invitation.child.name,
		code,
		isLoggedIn: !!locals.user
	};
};

export const actions: Actions = {
	default: async ({ params, locals }) => {
		// Must be logged in to claim
		if (!locals.user) {
			throw redirect(302, `/login?redirect=/join/${params.code}`);
		}

		const code = params.code.toUpperCase();
		const result = claimInvitation(code, locals.user.id);

		if (!result.success) {
			return { success: false, error: result.error };
		}

		// Redirect to the child's page
		throw redirect(302, `/?child=${result.childId}`);
	}
};
