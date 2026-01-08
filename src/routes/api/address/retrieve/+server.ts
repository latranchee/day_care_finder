import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireGooglePlacesKey } from '$lib/server/env';
import { requireAuth } from '$lib/server/authorization';
import type { AddressDetails } from '$lib/types';

export const GET: RequestHandler = async (event) => {
	requireAuth(event);
	const { url } = event;
	const placeId = url.searchParams.get('id');

	if (!placeId) {
		return json({ address: null, error: 'Place ID is required' }, { status: 400 });
	}

	let apiKey: string;
	try {
		apiKey = requireGooglePlacesKey();
	} catch {
		return json(
			{ address: null, error: 'Address autocomplete is not configured' },
			{ status: 500 }
		);
	}

	// Using the new Places API (v1)
	const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}`;

	try {
		const response = await fetch(detailsUrl, {
			method: 'GET',
			headers: {
				'X-Goog-Api-Key': apiKey,
				'X-Goog-FieldMask': 'formattedAddress,addressComponents'
			}
		});

		const data = await response.json();

		if (data.error) {
			console.error('Google Places Details API error:', data.error);
			return json({
				address: null,
				error: data.error.message || 'Address not found'
			});
		}

		const components = data.addressComponents || [];

		// Extract address components (new API format)
		const getComponent = (type: string): string => {
			const comp = components.find((c: { types: string[] }) => c.types.includes(type));
			return comp?.longText || '';
		};

		const streetNumber = getComponent('street_number');
		const route = getComponent('route');
		const city =
			getComponent('locality') ||
			getComponent('sublocality') ||
			getComponent('administrative_area_level_3');
		const province = getComponent('administrative_area_level_1');
		const postalCode = getComponent('postal_code');

		const line1 = [streetNumber, route].filter(Boolean).join(' ');

		const address: AddressDetails = {
			line1,
			line2: '',
			city,
			province,
			postalCode,
			country: 'Canada',
			formatted: data.formattedAddress || ''
		};

		return json({ address });
	} catch (err) {
		console.error('Google Places Details API error:', err);
		return json({
			address: null,
			error: 'Failed to retrieve address'
		});
	}
};
