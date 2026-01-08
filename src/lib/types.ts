export interface Daycare {
	id: number;
	name: string;
	address: string;
	phone: string;
	email: string;
	facebook: string;
	website: string;
	portal_url: string;
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
	// Extended fields from portal
	installation_id: string;
	daycare_type: string;
	subventionne: boolean;
	places_poupons: number | null;
	places_18_mois_plus: number | null;
	description: string;
	horaires: string;
	// Bureau Coordonnateur (for Milieu familial)
	bureau_coord_name: string;
	parent_daycare_id: number | null;
	// Additional portal fields
	accessible: boolean;
	inspection_url: string;
	// Child association
	child_id: number | null;
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
	portal_url?: string;
	capacity?: number | null;
	price?: string;
	hours?: string;
	age_range?: string;
	rating?: number | null;
	stage?: Stage;
	hidden?: boolean;
	// Extended fields from portal
	installation_id?: string;
	daycare_type?: string;
	subventionne?: boolean;
	places_poupons?: number | null;
	places_18_mois_plus?: number | null;
	description?: string;
	horaires?: string;
	// Bureau Coordonnateur (for Milieu familial)
	bureau_coord_name?: string;
	parent_daycare_id?: number | null;
	// Additional portal fields
	accessible?: boolean;
	inspection_url?: string;
	// Child association
	child_id?: number;
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
	showSubsidized: boolean;
}

// Filter settings for hiding/showing daycares based on criteria
export interface FilterSettings {
	maxCommuteMinutes: number | null;
	requireReviews: boolean;
	subsidizedOnly: boolean;
	minRating: number | null;
	requirePhone: boolean;
	requireEmail: boolean;
	requireWebsite: boolean;
	requireFacebook: boolean;
}

// Child profiles for multi-child support
export interface Child {
	id: number;
	name: string;
	date_of_birth: string;
	created_at: string;
}

export interface ChildInput {
	name: string;
	date_of_birth: string;
}

export interface ChildWithDetails extends Child {
	is_owner: boolean;
	parents: { id: number; name: string; email: string; role: string }[];
}

// Invitation for sharing child profiles
export interface Invitation {
	id: number;
	child_id: number;
	code: string;
	created_by_user_id: number;
	expires_at: string;
	used_by_user_id: number | null;
	used_at: string | null;
	created_at: string;
}

// Comment types for public daycare discussions
export interface Comment {
	id: number;
	daycare_id: number;
	parent_id: number | null;
	user_id: number;
	content: string;
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
}

export interface CommentInput {
	content: string;
	parent_id?: number | null;
}

export interface CommentWithDetails extends Comment {
	author_name: string;
	author_email: string;
	vote_score: number;
	upvote_count: number;
	downvote_count: number;
	user_vote: -1 | 0 | 1;
	replies: CommentWithDetails[];
}

export interface CommentVote {
	id: number;
	comment_id: number;
	user_id: number;
	vote: -1 | 1;
	created_at: string;
}

export interface VoteCounts {
	vote_score: number;
	upvote_count: number;
	downvote_count: number;
}

// Canada Post AddressComplete API types
export interface AddressSuggestion {
	id: string;
	text: string;
	highlight: string;
	description: string;
	next: 'Find' | 'Retrieve';
}

export interface AddressDetails {
	line1: string;
	line2: string;
	city: string;
	province: string;
	postalCode: string;
	country: string;
	formatted: string;
}

export interface AddressFindResponse {
	suggestions: AddressSuggestion[];
	error?: string;
}

export interface AddressRetrieveResponse {
	address: AddressDetails | null;
	error?: string;
}

// Admin view types
export interface AdminUser {
	id: number;
	email: string;
	name: string;
	created_at: string;
}

export interface AdminChildDetails {
	id: number;
	name: string;
	date_of_birth: string;
	parents: { id: number; name: string; email: string; role: string }[];
	daycare_counts: Record<Stage, number>;
	total_daycares: number;
}

export interface AdminFamilyResponse {
	users: (AdminUser & { children: AdminChildDetails[] })[];
}
