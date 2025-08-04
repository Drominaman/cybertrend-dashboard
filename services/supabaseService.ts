import { TrendItem, FilterOptions } from '../types';

const SUPABASE_URL =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = !!(SUPABASE_URL && SUPABASE_KEY);

export const fetchSupabaseData = async (): Promise<{
  trends: TrendItem[];
  filterOptions: FilterOptions;
}> => {
  if (!hasSupabaseConfig) {
    throw new Error('Supabase URL or anonymous key is not set');
  }

  const url = `${SUPABASE_URL}/rest/v1/trends?select=*`;
  const key = SUPABASE_KEY!;
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Supabase request failed: ${res.status} ${res.statusText}`);
  }

  const rows: any[] = await res.json();

  const trends: TrendItem[] = rows.map((row, index) => ({
    id: row.id ?? index,
    resourceName: row.resource_name ?? '',
    link: row.link ?? '',
    publisher: row.publisher ?? 'N/A',
    stat: row.stat ?? '',
    tags: row.tags ?? [],
    locations: row.locations ?? [],
    ...(row.notes ? { notes: row.notes } : {}),
    ...(row.date_published ? { datePublished: new Date(row.date_published) } : {}),
  }));

  const allPublishers = new Set(trends.map(t => t.publisher).filter(p => p !== 'N/A'));
  const allTags = new Set(trends.flatMap(t => t.tags));
  const allLocations = new Set(trends.flatMap(t => t.locations));

  const filterOptions: FilterOptions = {
    publishers: Array.from(allPublishers).sort(),
    tags: Array.from(allTags).sort(),
    locations: Array.from(allLocations).sort(),
  };

  return { trends, filterOptions };
};
