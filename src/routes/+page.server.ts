import type { PageServerLoad } from './$types';
import { getAllDaycares, getFirstReviewByDaycareId, getPrimaryContactByDaycareId, getContactCountByDaycareId } from '$lib/server/db';
import type { Stage, DaycareWithExtras } from '$lib/types';
import { STAGES } from '$lib/types';

export const load: PageServerLoad = async () => {
	const daycares = getAllDaycares();

	// Group daycares by stage with first review and contact info
	const columns: Record<Stage, DaycareWithExtras[]> = {
		to_research: [],
		to_contact: [],
		contacted: [],
		visited: [],
		waitlisted: [],
		decision_made: []
	};

	for (const daycare of daycares) {
		const firstReview = getFirstReviewByDaycareId(daycare.id);
		const primaryContact = getPrimaryContactByDaycareId(daycare.id);
		const contactCount = getContactCountByDaycareId(daycare.id);
		columns[daycare.stage].push({
			...daycare,
			firstReview,
			primaryContact,
			contactCount
		});
	}

	// Sort each column by position
	for (const stage of Object.keys(columns) as Stage[]) {
		columns[stage].sort((a, b) => a.position - b.position);
	}

	return {
		columns,
		stages: STAGES
	};
};
