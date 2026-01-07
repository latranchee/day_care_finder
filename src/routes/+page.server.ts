import type { PageServerLoad } from './$types';
import { getAllDaycares } from '$lib/server/db';
import type { Daycare, Stage } from '$lib/types';
import { STAGES } from '$lib/types';

export const load: PageServerLoad = async () => {
	const daycares = getAllDaycares();

	// Group daycares by stage
	const columns: Record<Stage, Daycare[]> = {
		to_research: [],
		to_contact: [],
		contacted: [],
		visited: [],
		waitlisted: [],
		decision_made: []
	};

	for (const daycare of daycares) {
		columns[daycare.stage].push(daycare);
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
