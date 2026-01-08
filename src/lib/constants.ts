import type { CardSettings, FilterSettings, Stage } from './types';
import * as m from '$lib/paraglide/messages.js';

export const DEFAULT_CARD_SETTINGS: CardSettings = {
	showAddress: true,
	showPhone: true,
	showEmail: true,
	showPrice: true,
	showAgeRange: true,
	showFacebook: true,
	showContacts: true,
	showReview: true,
	showCommuteTime: true,
	showSubsidized: true
};

export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
	maxCommuteMinutes: null,
	requireReviews: false,
	subsidizedOnly: false,
	minRating: null,
	requirePhone: false,
	requireEmail: false,
	requireWebsite: false,
	requireFacebook: false
};

export const STAGE_LABELS: Record<Stage, () => string> = {
	to_research: () => m.stage_to_research(),
	to_contact: () => m.stage_to_contact(),
	contacted: () => m.stage_contacted(),
	visited: () => m.stage_visited(),
	waitlisted: () => m.stage_waitlisted(),
	decision_made: () => m.stage_decision_made()
};

export const APP_CONFIG = {
	MAX_TRUNCATE_LENGTH: 80,
	RATING_MAX: 5,
	RATING_MIN: 1,
	NOTE_PREVIEW_LENGTH: 150
} as const;
