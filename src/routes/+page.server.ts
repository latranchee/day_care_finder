import type { PageServerLoad } from './$types';
import {
	getAllDaycaresByChildIdWithExtras,
	getChildrenByUserId,
	getUnassignedDaycareCount
} from '$lib/server/db';
import type { DaycareWithExtras, Stage } from '$lib/types';
import { STAGES } from '$lib/types';

const emptyColumns: Record<Stage, DaycareWithExtras[]> = {
	to_research: [],
	to_contact: [],
	contacted: [],
	visited: [],
	waitlisted: [],
	decision_made: []
};

export const load: PageServerLoad = async ({ locals, url }) => {
	// If user is not logged in, return empty state
	if (!locals.user) {
		return {
			columns: emptyColumns,
			stages: STAGES,
			children: [],
			selectedChildId: null,
			hasUnassignedDaycares: false,
			unassignedDaycareCount: 0
		};
	}

	// Get user's children
	const children = getChildrenByUserId(locals.user.id);

	// Get selected child from URL or default to first child
	let selectedChildId: number | null = null;
	const childParam = url.searchParams.get('child');

	if (childParam) {
		const parsedId = parseInt(childParam);
		if (!isNaN(parsedId) && children.some(c => c.id === parsedId)) {
			selectedChildId = parsedId;
		}
	}

	// Default to first child if none selected
	if (!selectedChildId && children.length > 0) {
		selectedChildId = children[0].id;
	}

	// Check for unassigned daycares (for migration modal)
	const unassignedDaycareCount = getUnassignedDaycareCount();
	const hasUnassignedDaycares = unassignedDaycareCount > 0;

	// If no child selected, return empty columns
	if (!selectedChildId) {
		return {
			columns: emptyColumns,
			stages: STAGES,
			children,
			selectedChildId: null,
			hasUnassignedDaycares,
			unassignedDaycareCount
		};
	}

	// Load daycares for selected child with all extras in a single optimized query
	// This replaces the N+1 pattern (3N+1 queries for N daycares -> 1 query)
	const daycares = getAllDaycaresByChildIdWithExtras(selectedChildId);

	// Group daycares by stage (data is already sorted by stage, position from the query)
	const columns: Record<Stage, DaycareWithExtras[]> = {
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

	// No need to sort - data comes pre-sorted from the SQL query (ORDER BY stage, position)

	return {
		columns,
		stages: STAGES,
		children,
		selectedChildId,
		hasUnassignedDaycares,
		unassignedDaycareCount
	};
};
