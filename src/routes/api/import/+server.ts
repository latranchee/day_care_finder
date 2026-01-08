import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bulkCreateDaycares } from '$lib/server/db';
import type { DaycareInput } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file') as File;

	if (!file) {
		throw error(400, 'No file provided');
	}

	const text = await file.text();
	const lines = text.split(/\r?\n/).filter((line) => line.trim());

	if (lines.length < 2) {
		throw error(400, 'CSV must have a header row and at least one data row');
	}

	const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
	const daycares: DaycareInput[] = [];

	for (let i = 1; i < lines.length; i++) {
		const values = parseCSVLine(lines[i]);
		const daycare: DaycareInput = { name: '' };

		headers.forEach((header, index) => {
			const value = values[index]?.trim() || '';

			switch (header) {
				case 'name':
					daycare.name = value;
					break;
				case 'address':
					daycare.address = value;
					break;
				case 'phone':
					daycare.phone = value;
					break;
				case 'website':
					daycare.website = value;
					break;
				case 'facebook':
					daycare.facebook = value;
					break;
				case 'capacity':
					daycare.capacity = value ? parseInt(value) || null : null;
					break;
				case 'price':
					daycare.price = value;
					break;
				case 'hours':
					daycare.hours = value;
					break;
				case 'age_range':
				case 'agerange':
				case 'age range':
					daycare.age_range = value;
					break;
				case 'rating':
					daycare.rating = value ? parseFloat(value) || null : null;
					break;
			}
		});

		if (daycare.name) {
			daycares.push(daycare);
		}
	}

	if (daycares.length === 0) {
		throw error(400, 'No valid daycares found in CSV');
	}

	const created = bulkCreateDaycares(daycares);
	return json({ imported: created.length, daycares: created }, { status: 201 });
};

function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			result.push(current);
			current = '';
		} else {
			current += char;
		}
	}

	result.push(current);
	return result;
}
