import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/authorization';
import {
	getAllUsersForAdmin,
	getAllChildrenWithParentsForAdmin,
	getDaycareStageCountsForAdmin
} from '$lib/server/db';
import type { AdminFamilyResponse, AdminChildDetails, Stage, STAGE_IDS } from '$lib/types';

const STAGES: Stage[] = [
	'to_research',
	'to_contact',
	'contacted',
	'visited',
	'waitlisted',
	'decision_made'
];

export const GET: RequestHandler = async (event) => {
	// Verify admin access
	requireAdmin(event);

	// Fetch all data
	const users = getAllUsersForAdmin();
	const childrenRows = getAllChildrenWithParentsForAdmin();
	const stageCountRows = getDaycareStageCountsForAdmin();

	// Build stage counts map: childId -> { stage -> count }
	const stageCounts = new Map<number, Record<Stage, number>>();
	for (const row of stageCountRows) {
		if (!stageCounts.has(row.child_id)) {
			stageCounts.set(row.child_id, {
				to_research: 0,
				to_contact: 0,
				contacted: 0,
				visited: 0,
				waitlisted: 0,
				decision_made: 0
			});
		}
		stageCounts.get(row.child_id)![row.stage] = row.count;
	}

	// Build children map: childId -> AdminChildDetails
	const childrenMap = new Map<number, AdminChildDetails>();
	for (const row of childrenRows) {
		if (!childrenMap.has(row.child_id)) {
			const counts = stageCounts.get(row.child_id) || {
				to_research: 0,
				to_contact: 0,
				contacted: 0,
				visited: 0,
				waitlisted: 0,
				decision_made: 0
			};
			const totalDaycares = Object.values(counts).reduce((a, b) => a + b, 0);

			childrenMap.set(row.child_id, {
				id: row.child_id,
				name: row.child_name,
				date_of_birth: row.date_of_birth,
				parents: [],
				daycare_counts: counts,
				total_daycares: totalDaycares
			});
		}

		// Add parent if exists
		if (row.parent_id) {
			childrenMap.get(row.child_id)!.parents.push({
				id: row.parent_id,
				name: row.parent_name,
				email: row.parent_email,
				role: row.parent_role
			});
		}
	}

	// Build user -> children map
	const userChildrenMap = new Map<number, AdminChildDetails[]>();
	for (const child of childrenMap.values()) {
		for (const parent of child.parents) {
			if (!userChildrenMap.has(parent.id)) {
				userChildrenMap.set(parent.id, []);
			}
			userChildrenMap.get(parent.id)!.push(child);
		}
	}

	// Build response
	const response: AdminFamilyResponse = {
		users: users.map((user) => ({
			...user,
			children: userChildrenMap.get(user.id) || []
		}))
	};

	return json(response);
};
