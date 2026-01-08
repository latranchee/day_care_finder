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
	commute_minutes: number | null;
	commute_origin: string;
	commute_destination: string;
	commute_maps_url: string;
	commute_calculated_at: string | null;
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

// Stage IDs in order (labels are provided via translations)
export const STAGE_IDS: Stage[] = [
	'to_research',
	'to_contact',
	'contacted',
	'visited',
	'waitlisted',
	'decision_made'
];

// Legacy export for backwards compatibility - labels will be overridden by translations
export const STAGES: { id: Stage; label: string }[] = STAGE_IDS.map(id => ({
	id,
	label: id // Will be replaced by translations at runtime
}));

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

// Extended daycare type with related data for display
export type DaycareWithExtras = Daycare & {
	firstReview?: Review;
	primaryContact?: Contact;
	contactCount: number;
};

// Card display settings for controlling what fields are shown on daycare cards
export interface CardSettings {
	showAddress: boolean;
	showPhone: boolean;
	showEmail: boolean;
	showPrice: boolean;
	showAgeRange: boolean;
	showFacebook: boolean;
	showContacts: boolean;
	showReview: boolean;
	showCommuteTime: boolean;
}
