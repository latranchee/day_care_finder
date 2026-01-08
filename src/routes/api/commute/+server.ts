import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSetting, getDaycaresNeedingCommute, updateDaycareCommute } from '$lib/server/db';
import { SERPAPI } from '$env/static/private';

interface CommuteResult {
	calculated: number;
	skipped: number;
	errors: { daycare: string; error: string }[];
}

async function calculateCommute(origin: string, destination: string): Promise<number | null> {
	const url = new URL('https://serpapi.com/search.json');
	url.searchParams.set('engine', 'google_maps_directions');
	url.searchParams.set('start_addr', origin);
	url.searchParams.set('end_addr', destination);
	url.searchParams.set('travel_mode', '0'); // 0 = driving
	url.searchParams.set('api_key', SERPAPI);

	const response = await fetch(url.toString());

	if (!response.ok) {
		throw new Error(`SerpAPI error: ${response.status}`);
	}

	const data = await response.json();

	if (data.error) {
		throw new Error(data.error);
	}

	// Extract duration from the first direction option
	const duration = data.directions?.[0]?.duration;

	if (typeof duration !== 'number') {
		throw new Error('No route found');
	}

	// Duration is in seconds, convert to minutes
	return Math.round(duration / 60);
}

export const POST: RequestHandler = async () => {
	const homeAddress = getSetting('home_address');

	if (!homeAddress) {
		return json({ error: 'Home address not configured' }, { status: 400 });
	}

	const daycaresNeedingCommute = getDaycaresNeedingCommute(homeAddress);
	const totalDaycares = daycaresNeedingCommute.length;

	const result: CommuteResult = {
		calculated: 0,
		skipped: 0,
		errors: []
	};

	for (const daycare of daycaresNeedingCommute) {
		try {
			const commuteMinutes = await calculateCommute(homeAddress, daycare.address);

			if (commuteMinutes !== null) {
				updateDaycareCommute(daycare.id, commuteMinutes, homeAddress, daycare.address);
				result.calculated++;
			} else {
				result.errors.push({ daycare: daycare.name, error: 'No route found' });
			}

			// Rate limit: wait 1 second between requests
			if (daycaresNeedingCommute.indexOf(daycare) < totalDaycares - 1) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		} catch (error) {
			result.errors.push({
				daycare: daycare.name,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	return json(result);
};
