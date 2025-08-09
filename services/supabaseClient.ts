// This declaration is necessary because we're loading the Supabase client from a CDN
declare const supabase: { createClient: (url: string, key: string) => any };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required.');
}

// Add a check to ensure the CDN script has loaded the Supabase global object
if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
    throw new Error('Supabase client library not loaded from CDN. Please check the script tag in index.html and your internet connection.');
}

// Initialize the Supabase client from the global object
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// Re-export as 'supabase' to match the data service's usage
export { supabaseClient as supabase };
