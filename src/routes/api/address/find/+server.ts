import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireGooglePlacesKey } from '$lib/server/env';
import { requireAuth } from '$lib/server/authorization';
import type { AddressSuggestion } from '$lib/types';

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';

export const GET: RequestHandler = async (event) => {
	requireAuth(event);
	const { url } = event;
	const searchTerm = url.searchParams.get('q');
	const language = url.searchParams.get('lang') || 'en';

	if (!searchTerm) {
		return json({ suggestions: [], error: 'Search term is required' }, { status: 400 });
	}

	let apiKey: string;
	try {
		apiKey = requireGooglePlacesKey();
	} catch {
		return json(
			{ suggestions: [], error: 'Address autocomplete is not configured' },
			{ status: 500 }
		);
	}

	try {
		const response = await fetch(AUTOCOMPLETE_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Goog-Api-Key': apiKey
			},
			body: JSON.stringify({
				input: searchTerm,
				includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
				includedRegionCodes: ['ca'],
				languageCode: language
			})
		});

		const data = await response.json();

		if (data.error) {
			console.error('Google Places API error:', data.error);
			return json({
				suggestions: [],
				error: data.error.message || 'API error'
			});
		}

		const suggestions: AddressSuggestion[] = (data.suggestions || [])
			.filter((s: { placePrediction?: unknown }) => s.placePrediction)
			.map(
				(suggestion: {
					placePrediction: {
						placeId: string;
						text: { text: string; matches?: { startOffset?: number; endOffset: number }[] };
						structuredFormat?: {
							mainText: { text: string; matches?: { startOffset?: number; endOffset: number }[] };
							secondaryText?: { text: string };
						};
					};
				}) => {
					const pred = suggestion.placePrediction;

					// Build highlight string from matched substrings
					let highlight = '';
					const matches = pred.structuredFormat?.mainText?.matches || pred.text?.matches || [];
					if (matches.length > 0) {
						highlight = matches
							.map(
								(m: { startOffset?: number; endOffset: number }) =>
									`${m.startOffset || 0}-${m.endOffset - 1}`
							)
							.join(',');
					}

					return {
						id: pred.placeId,
						text: pred.structuredFormat?.mainText?.text || pred.text?.text || '',
						highlight,
						description: pred.structuredFormat?.secondaryText?.text || '',
						next: 'Retrieve' as const
					};
				}
			);

		return json({ suggestions });
	} catch (err) {
		console.error('Google Places API error:', err);
		return json({
			suggestions: [],
			error: 'Failed to fetch address suggestions'
		});
	}
};
