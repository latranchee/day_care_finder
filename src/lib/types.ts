export interface Daycare {
	id: number;
	name: string;
	address: string;
	phone: string;
	email: string;
	facebook: string;
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
	username: string | null;
	created_at: string;
}

export interface Review {
	id: number;
	daycare_id: number;
	text: string;
	source_url: string;
	rating: number;
	created_at: string;
}

export interface ReviewInput {
	text: string;
	source_url?: string;
	rating: number;
}

export interface Contact {
	id: number;
	daycare_id: number;
	name: string;
	role: string;
	phone: string;
	email: string;
	notes: string;
	is_primary: boolean;
	created_at: string;
	updated_at: string;
}

export interface ContactInput {
	name: string;
	role?: string;
	phone?: string;
	email?: string;
	notes?: string;
	is_primary?: boolean;
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
	facebook?: string;
	website?: string;
	capacity?: number | null;
	price?: string;
	hours?: string;
	age_range?: string;
	rating?: number | null;
	stage?: Stage;
	hidden?: boolean;
}
