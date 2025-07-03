export interface TrendItem {
  id: string;
  resourceName: string;
  link: string;
  publisher: string;
  stat: string;
  tags: string[];
  locations: string[];
  notes?: string;
  datePublished?: Date;
  originalDateString?: string;
}

export interface FilterOptions {
  publishers: string[];
  tags: string[];
  locations: string[];
}

export interface Filters {
  publisher: string;
  tag: string;
  dateRange: string;
  location: string;
}

export interface DateFilterOption {
  value: string; // e.g., "2024-08" or "Q3 2024"
  label: string; // e.g., "September 2024" or "Q3 2024"
}
