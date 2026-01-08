import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ? {
			id: locals.user.id,
			email: locals.user.email,
			name: locals.user.name,
			role: locals.user.role,
			home_address: locals.user.home_address,
			max_commute_minutes: locals.user.max_commute_minutes
		} : null
	};
};
