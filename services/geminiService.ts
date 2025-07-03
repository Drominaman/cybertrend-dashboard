import Papa from 'papaparse';
import { TrendItem, FilterOptions } from '../types';
import { countries } from './locationData';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7IAyOqipa4SWgcKEiGgma10TlwS5G9knkq0-E-_dvnuualiNR81yreifFISTuZtGu467l8JhROl86/pub?output=csv';

// We only check for the most essential columns to avoid failing if optional columns are missing headers.
const REQUIRED_HEADERS = ['Resource Name', 'Link', 'Publisher', 'Stat'];

// Pre-build a regex map for efficiency
const countryRegexMap = new Map<string, RegExp>();
countries.forEach(country => {
    const allNames = [country.name, ...country.aliases];
    // Create a regex that matches any of the aliases as whole words, case-insensitive.
    // The `\b` ensures we match whole words only (e.g., "us" not "virus").
    const regex = new RegExp(`\\b(${allNames.map(name => name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`, 'i');
    countryRegexMap.set(country.name, regex);
});

const findLocationsInText = (text: string): string[] => {
    if (!text) return [];
    const found = new Set<string>();
    for (const [countryName, regex] of countryRegexMap.entries()) {
        if (regex.test(text)) {
            found.add(countryName);
        }
    }
    return Array.from(found);
};


export const fetchDashboardData = async (): Promise<{ trends: TrendItem[]; filterOptions: FilterOptions }> => {
    return new Promise((resolve, reject) => {
        Papa.parse(SHEET_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length) {
                    return reject(new Error(`CSV parsing error: ${results.errors[0].message}.`));
                }

                const headers = results.meta.fields;
                if (!headers || !REQUIRED_HEADERS.every(h => headers.includes(h))) {
                    return reject(new Error(`CSV is missing required headers. Found: ${headers?.join(', ')}. Required: ${REQUIRED_HEADERS.join(', ')}`));
                }

                const trends: TrendItem[] = (results.data as any[])
                    .map((row, index) => {
                        if (!row['Resource Name'] || !row['Stat']) {
                            return null;
                        }
                        // Collect all tags from Tag 1 through Tag 5
                        const tags = [
                            row['Tag 1'],
                            row['Tag 2'],
                            row['Tag 3'],
                            row['Tag 4'],
                            row['Tag 5'],
                        ].filter(tag => tag && String(tag).trim() !== '');
                        
                        const notes = String(row['notes'] || '').trim();

                        let datePublished: Date | undefined = undefined;
                        let originalDateString: string | undefined = undefined;
                        
                        const dateValue = row['Date Published'] || row['Date'];
                        if (dateValue && String(dateValue).trim()) {
                            originalDateString = String(dateValue).trim();
                            const dateStr = originalDateString.replace(/-/g, '/');
                            const parsedDate = new Date(dateStr);
                            if (!isNaN(parsedDate.getTime())) {
                                datePublished = parsedDate;
                            }
                        }
                        
                        // Scan for locations
                        const textToScan = [row['Resource Name'], row['Stat'], notes].join(' ');
                        const locations = findLocationsInText(textToScan);

                        return {
                            id: `${index}-${row['Resource Name']}`, // Create a simple unique ID
                            resourceName: String(row['Resource Name'] || '').trim(),
                            link: String(row['Link'] || '').trim(),
                            publisher: String(row['Publisher'] || 'N/A').trim(),
                            stat: String(row['Stat'] || '').trim(),
                            tags,
                            locations,
                            ...(notes ? { notes } : {}),
                            ...(datePublished ? { datePublished } : {}),
                            ...(originalDateString ? { originalDateString } : {}),
                        };
                    })
                    .filter((item): item is TrendItem => item !== null);

                if (trends.length === 0) {
                    return reject(new Error("No valid data rows could be parsed from the sheet."));
                }
                
                const allPublishers = new Set(trends.map(t => t.publisher).filter(p => p !== 'N/A'));
                const allTags = new Set(trends.flatMap(t => t.tags));
                const allLocations = new Set(trends.flatMap(t => t.locations));

                const filterOptions: FilterOptions = {
                    publishers: Array.from(allPublishers).sort(),
                    tags: Array.from(allTags).sort(),
                    locations: Array.from(allLocations).sort(),
                };

                resolve({ trends, filterOptions });
            },
            error: (error: Error) => {
                reject(new Error(`Network error fetching sheet data: ${error.message}`));
            }
        });
    });
};