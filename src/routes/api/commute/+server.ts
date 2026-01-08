import type { RequestHandler } from './$types';
import { getSetting, getDaycaresNeedingCommute, updateDaycareCommute } from '$lib/server/db';
import { SERPAPI } from '$env/static/private';

interface CommuteData {
	minutes: number;
	mapsUrl: string;
}

async function calculateCommute(origin: string, destination: string): Promise<CommuteData | null> {
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

	// Extract Google Maps directions URL from search_metadata
	const mapsUrl = data.search_metadata?.google_maps_directions_url || '';

	// Duration is in seconds, convert to minutes
	return {
		minutes: Math.round(duration / 60),
		mapsUrl
	};
}

export const POST: RequestHandler = async () => {
	const homeAddress = getSetting('home_address');

	if (!homeAddress) {
		const errorStream = new ReadableStream({
			start(controller) {
				controller.enqueue(`data: ${JSON.stringify({ error: 'Home address not configured' })}\n\n`);
				controller.close();
			}
		});
		return new Response(errorStream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});
	}

	const daycaresNeedingCommute = getDaycaresNeedingCommute(homeAddress);
	const total = daycaresNeedingCommute.length;

	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			const send = (data: object) => {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
			};

			// Send initial count
			send({ type: 'start', total });

			let calculated = 0;
			const errors: { daycare: string; error: string }[] = [];

			for (let i = 0; i < daycaresNeedingCommute.length; i++) {
				const daycare = daycaresNeedingCommute[i];

				// Send progress update
				send({
					type: 'progress',
					current: i + 1,
					total,
					name: daycare.name
				});

				try {
					const commuteData = await calculateCommute(homeAddress, daycare.address);

					if (commuteData !== null) {
						updateDaycareCommute(
							daycare.id,
							commuteData.minutes,
							homeAddress,
							daycare.address,
							commuteData.mapsUrl
						);
						calculated++;
					} else {
						errors.push({ daycare: daycare.name, error: 'No route found' });
					}

					// Rate limit: wait 1 second between requests
					if (i < total - 1) {
						await new Promise((resolve) => setTimeout(resolve, 1000));
					}
				} catch (error) {
					errors.push({
						daycare: daycare.name,
						error: error instanceof Error ? error.message : 'Unknown error'
					});
				}
			}

			// Send final result
			send({
				type: 'done',
				calculated,
				errors
			});

			controller.close();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
