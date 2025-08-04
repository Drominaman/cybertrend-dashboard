


import { useState, useEffect, useMemo } from 'react';
import { TrendItem, FilterOptions, Filters, DateFilterOption } from './types';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import ResultCard from './components/ResultCard';
import { fetchDashboardData } from './services/geminiService';
import { ListBulletIcon, PresentationChartLineIcon, MagnifyingGlassIcon } from './components/icons';
import ChartDisplay from './components/ChartDisplay';

const RESULTS_PER_PAGE = 5;

// --- Helper Function for Chronological Sorting ---
/**
 * Converts various date strings into a representative Date object for sorting.
 * Handles formats like "YYYY-MM", "Q1 2024", "H2 2024", etc.
 * @param dateString The string to convert.
 * @returns A Date object for sorting. Unsortable strings result in an old date.
 */
const getSortableDate = (dateString: string): Date => {
    // Standard YYYY-MM format (month is 1-indexed)
    const yyyyMmMatch = dateString.match(/^(\d{4})-(\d{2})$/);
    if (yyyyMmMatch) {
        // new Date(year, monthIndex, day)
        return new Date(parseInt(yyyyMmMatch[1], 10), parseInt(yyyyMmMatch[2], 10) - 1, 1);
    }

    // Handle "Qx YYYY" (e.g., "Q3 2024")
    const quarterMatch = dateString.match(/^Q(\d)\s+(\d{4})$/i);
    if (quarterMatch) {
        const quarter = parseInt(quarterMatch[1], 10);
        const year = parseInt(quarterMatch[2], 10);
        const monthIndex = (quarter - 1) * 3; // Q1->0, Q2->3, Q3->6, Q4->9
        return new Date(year, monthIndex, 1);
    }

    // Handle "Hx YYYY" (e.g., "H1 2025")
    const halfMatch = dateString.match(/^H(\d)\s+(\d{4})$/i);
    if (halfMatch) {
        const half = parseInt(halfMatch[1], 10);
        const year = parseInt(halfMatch[2], 10);
        const monthIndex = (half - 1) * 6; // H1->0, H2->6
        return new Date(year, monthIndex, 1);
    }
    
    // Fallback for other potential string formats that Date.parse might handle, e.g. "Sep 2024"
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
        return parsed;
    }

    // Return a very old date for anything that can't be parsed,
    // so it gets sorted to the end when sorting descending.
    return new Date(0); 
};


// --- Helper Component: FilterControls ---
interface FilterControlsProps {
  filters: Filters;
  filterOptions: FilterOptions;
  onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onClearFilters: () => void;
  dateFilterOptions: DateFilterOption[];
  searchKeyword: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FilterControls = ({
  filters,
  filterOptions,
  onFilterChange,
  onClearFilters,
  dateFilterOptions,
  searchKeyword,
  onSearchChange,
}: FilterControlsProps) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 my-6 backdrop-blur-sm">
         <div className="mb-5">
            <label htmlFor="search-input" className="block text-sm font-medium text-slate-300 mb-1">Search by Keyword</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="search"
                    id="search-input"
                    name="search"
                    value={searchKeyword}
                    onChange={onSearchChange}
                    placeholder="e.g., 'phishing', 'ransomware', 'Microsoft'..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 pl-10 pr-4 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    aria-label="Search by keyword"
                />
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
                <label htmlFor="publisher-filter" className="block text-sm font-medium text-slate-300 mb-1">Company / Publisher</label>
                <select
                    id="publisher-filter"
                    name="publisher"
                    value={filters.publisher}
                    onChange={onFilterChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                    <option value="all">All Publishers</option>
                    {filterOptions.publishers.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="tag-filter" className="block text-sm font-medium text-slate-300 mb-1">Topic / Technology</label>
                <select
                    id="tag-filter"
                    name="tag"
                    value={filters.tag}
                    onChange={onFilterChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                    <option value="all">All Tags</option>
                    {filterOptions.tags.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="date-range-filter" className="block text-sm font-medium text-slate-300 mb-1">Publication Month</label>
                <select
                    id="date-range-filter"
                    name="dateRange"
                    value={filters.dateRange}
                    onChange={onFilterChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                    <option value="all">All Time</option>
                    {dateFilterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="location-filter" className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                <select
                    id="location-filter"
                    name="location"
                    value={filters.location}
                    onChange={onFilterChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                    <option value="all">All Locations</option>
                    {filterOptions.locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row sm:justify-end">
            <button
                onClick={onClearFilters}
                className="w-full sm:w-auto px-4 py-2 border border-slate-600 bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700 hover:text-white transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-label="Clear all filters and search"
            >
                Clear Filters & Search
            </button>
        </div>
    </div>
);


// --- Helper Component: PaginationControls ---
interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    setCurrentPage: (value: number | ((prev: number) => number)) => void;
}

const PaginationControls = ({ currentPage, totalPages, setCurrentPage }: PaginationControlsProps) => (
    <div className="flex justify-center items-center gap-4 mt-8">
      <button
        onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>
      <span className="text-slate-400" aria-live="polite">
        Page {currentPage} of {totalPages > 0 ? totalPages : 1}
      </span>
      <button
        onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages || totalPages === 0}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );


// --- Main App Component ---

const App = () => {
  const [allTrends, setAllTrends] = useState<TrendItem[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ publishers: [], tags: [], locations: [] });
  const [filters, setFilters] = useState<Filters>({ publisher: 'all', tag: 'all', dateRange: 'all', location: 'all' });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'charts'>('list');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { trends, filterOptions } = await fetchDashboardData();
        setAllTrends(trends);
        setFilterOptions(filterOptions);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred while loading data.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const dateFilterOptions = useMemo((): DateFilterOption[] => {
    if (!allTrends.length) return [];

    const dateOptionsMap = new Map<string, string>();

    allTrends.forEach((trend: TrendItem) => {
        if (trend.datePublished) {
            const date = trend.datePublished;
            const year = date.getUTCFullYear();
            const month = date.getUTCMonth() + 1; // 1-12
            const key = `${year}-${String(month).padStart(2, '0')}`;
            
            if (!dateOptionsMap.has(key)) {
                const monthName = date.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
                const displayLabel = `${monthName} ${year}`;
                dateOptionsMap.set(key, displayLabel);
            }
        } else if (trend.originalDateString) {
            const keyAndLabel = trend.originalDateString;
            if (!dateOptionsMap.has(keyAndLabel)) {
                dateOptionsMap.set(keyAndLabel, keyAndLabel);
            }
        }
    });

    return Array.from(dateOptionsMap.entries())
        .sort((a, b) => {
            const dateA = getSortableDate(a[0]);
            const dateB = getSortableDate(b[0]);
            return dateB.getTime() - dateA.getTime();
        }) 
        .map(([value, label]) => ({ value, label }));

  }, [allTrends]);

  const filteredTrends = useMemo(() => {
    const lowercasedKeyword = searchKeyword.toLowerCase();
    
    return allTrends.filter((trend: TrendItem) => {
      const publisherMatch = filters.publisher === 'all' || trend.publisher === filters.publisher;
      const tagMatch = filters.tag === 'all' || trend.tags.includes(filters.tag);
      const locationMatch = filters.location === 'all' || trend.locations.includes(filters.location);
      
      const keywordMatch = searchKeyword === '' ||
          trend.resourceName.toLowerCase().includes(lowercasedKeyword) ||
          trend.stat.toLowerCase().includes(lowercasedKeyword) ||
          (trend.notes && trend.notes.toLowerCase().includes(lowercasedKeyword));

      let dateMatch = true;
      if (filters.dateRange !== 'all') {
        const filterValue = filters.dateRange;
        
        if (filterValue.match(/^\d{4}-\d{2}$/)) {
            if (trend.datePublished) {
                const date = trend.datePublished;
                const year = date.getUTCFullYear();
                const month = date.getUTCMonth() + 1;
                const trendKey = `${year}-${String(month).padStart(2, '0')}`;
                dateMatch = trendKey === filterValue;
            } else {
                dateMatch = false;
            }
        } else {
            dateMatch = trend.originalDateString === filterValue;
        }
      }

      return publisherMatch && tagMatch && dateMatch && locationMatch && keywordMatch;
    });
  }, [allTrends, filters, searchKeyword]);

  const totalPages = Math.ceil(filteredTrends.length / RESULTS_PER_PAGE);
  const paginatedTrends = filteredTrends.slice((currentPage - 1) * RESULTS_PER_PAGE, currentPage * RESULTS_PER_PAGE);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev: Filters) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ publisher: 'all', tag: 'all', dateRange: 'all', location: 'all' });
    setSearchKeyword('');
    setCurrentPage(1);
  };

  const handleTagSelect = (tagName: string) => {
    setFilters((prev: Filters) => ({ ...prev, tag: tagName }));
    setView('list');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <div className="container mx-auto px-4 pb-12">
        <Header />
        
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <LoadingSpinner text="Loading dashboard data..." />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : (
            <main>
              <FilterControls 
                filters={filters}
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                dateFilterOptions={dateFilterOptions}
                searchKeyword={searchKeyword}
                onSearchChange={handleSearchChange}
              />
              
              <div className="mb-6 border-b border-slate-700">
                  <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                      <button
                          onClick={() => setView('list')}
                          className={`${view === 'list' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}
                                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                          aria-current={view === 'list' ? 'page' : undefined}
                      >
                          <ListBulletIcon className="-ml-0.5 mr-2 h-5 w-5" />
                          <span>Trends List</span>
                      </button>
                      <button
                          onClick={() => setView('charts')}
                          className={`${view === 'charts' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}
                                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                          aria-current={view === 'charts' ? 'page' : undefined}
                      >
                          <PresentationChartLineIcon className="-ml-0.5 mr-2 h-5 w-5" />
                          <span>Charts & Analysis</span>
                      </button>
                  </nav>
              </div>
              
              {view === 'list' ? (
                <div>
                  <div className="text-right text-slate-400 text-sm mb-4 pr-1" aria-live="polite">
                    Found {filteredTrends.length} result{filteredTrends.length !== 1 ? 's' : ''}
                  </div>

                  {paginatedTrends.length > 0 ? (
                    <div className="space-y-6">
                      {paginatedTrends.map((item: TrendItem) => (
                        <div key={item.id}>
                          <ResultCard item={item} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 px-6 bg-slate-800 rounded-xl">
                      <h3 className="text-xl font-semibold text-slate-100">No Results Found</h3>
                      <p className="text-slate-400 mt-2">Try adjusting your filters to find what you're looking for.</p>
                    </div>
                  )}
                  {totalPages > 1 && (
                    <PaginationControls 
                      currentPage={currentPage}
                      totalPages={totalPages}
                      setCurrentPage={setCurrentPage}
                    />
                  )}
                </div>
              ) : (
                <ChartDisplay trends={filteredTrends} onTagSelect={handleTagSelect} />
              )}
            </main>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;