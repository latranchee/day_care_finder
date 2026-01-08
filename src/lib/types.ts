export interface Daycare {
	id: number;
	name: string;
	address: string;
	phone: string;
	email: string;
	website: string;
	capacity: number | null;
	price: string;
	hours: string;
	age_range: string;
	rating: number | null;
	stage: Stage;
	position: number;
	hidden: boolean;
	created_at: string;
	updated_at: string;
}

export interface Note {
	id: number;
	daycare_id: number;
	content: string;
	created_at: string;
}

export type Stage =
	| 'to_research'
	| 'to_contact'
	| 'contacted'
	| 'visited'
	| 'waitlisted'
	| 'decision_made';

export const STAGES: { id: Stage; label: string }[] = [
	{ id: 'to_research', label: 'To Research' },
	{ id: 'to_contact', label: 'To Contact' },
	{ id: 'contacted', label: 'Contacted' },
	{ id: 'visited', label: 'Visited' },
	{ id: 'waitlisted', label: 'Waitlisted' },
	{ id: 'decision_made', label: 'Decision Made' }
];

export interface DaycareInput {
	name: string;
	address?: string;
	phone?: string;
	email?: string;
	website?: string;
	capacity?: number | null;
	price?: string;
	hours?: string;
	age_range?: string;
	rating?: number | null;
	stage?: Stage;
	hidden?: boolean;
}
