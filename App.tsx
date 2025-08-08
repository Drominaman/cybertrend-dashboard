import React, { useState, useEffect, useMemo } from 'react';
import { TrendData, FilterOptions } from './types';
import { fetchAndParseData } from './services/dataService';
import { Header } from './components/Header';
import { LoaderIcon, InfoIcon, SearchIcon } from './components/Icons';
import { StatsTable } from './components/StatsTable';
import { StatDetailModal } from './components/StatDetailModal';
import { FilterSidebar } from './components/FilterSidebar';

const App: React.FC = () => {
    const [allData, setAllData] = useState<TrendData[]>([]);
    const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    // Client-side Filter State
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [selectedStat, setSelectedStat] = useState<TrendData | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsDataLoading(true);
                const data = await fetchAndParseData();
                setAllData(data);
                setDataError(null);
            } catch (err) {
                setDataError('Failed to load the cybersecurity data trends. Please check the data source and configuration.');
                console.error(err);
            } finally {
                setIsDataLoading(false);
            }
        };
        loadData();
    }, []);

    const filterOptions = useMemo<FilterOptions>(() => {
        const topics = new Set<string>();
        const companies = new Set<string>();
        const dates = new Set<string>();
        allData.forEach(item => {
            if (item.Topic) topics.add(item.Topic);
            if (item.Company) companies.add(item.Company);
            if (item.Date) dates.add(item.Date);
        });
        return {
            topics: Array.from(topics).sort(),
            companies: Array.from(companies).sort(),
            dates: Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
        };
    }, [allData]);

    const filteredData = useMemo(() => {
        return allData.filter(item => {
            const topicMatch = selectedTopics.length === 0 || selectedTopics.includes(item.Topic);
            const companyMatch = selectedCompanies.length === 0 || selectedCompanies.includes(item.Company);
            const dateMatch = selectedDates.length === 0 || selectedDates.includes(item.Date);
            
            const searchLower = searchTerm.toLowerCase();
            const termMatch = searchTerm === '' ||
                item.stat.toLowerCase().includes(searchLower) ||
                item.ResourceName.toLowerCase().includes(searchLower) ||
                item.Company.toLowerCase().includes(searchLower) ||
                item.Topic.toLowerCase().includes(searchLower) ||
                item.Technology.toLowerCase().includes(searchLower);

            return topicMatch && companyMatch && dateMatch && termMatch;
        });
    }, [allData, selectedTopics, selectedCompanies, selectedDates, searchTerm]);

    const handleStatSelect = (stat: TrendData) => {
        setSelectedStat(stat);
    };

    const handleCloseModal = () => {
        setSelectedStat(null);
    };

    // Filter handlers
    const handleTopicToggle = (topic: string) => setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
    const handleCompanyToggle = (company: string) => setSelectedCompanies(prev => prev.includes(company) ? prev.filter(c => c !== company) : [...prev, company]);
    const handleDateToggle = (date: string) => setSelectedDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]);
    const handleResetFilters = () => {
        setSelectedTopics([]);
        setSelectedCompanies([]);
        setSelectedDates([]);
        setSearchTerm('');
    };

    if (isDataLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-200">
                <LoaderIcon className="w-12 h-12 animate-spin text-cyan-400" />
                <p className="mt-4 text-lg">Loading Trend Database...</p>
            </div>
        );
    }
    
    if (dataError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 text-red-400">
                <p className="text-xl">{dataError}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 font-sans">
            <Header />
            <main className="max-w-screen-2xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
                <FilterSidebar
                    filterOptions={filterOptions}
                    selectedTopics={selectedTopics}
                    onTopicToggle={handleTopicToggle}
                    selectedCompanies={selectedCompanies}
                    onCompanyToggle={handleCompanyToggle}
                    selectedDates={selectedDates}
                    onDateToggle={handleDateToggle}
                    onResetFilters={handleResetFilters}
                />
                <div className="flex-1 min-w-0">
                    <div id="results-section">
                        <div className="relative mb-4">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by keyword, resource, company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                            />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-200 mb-4">
                            Browse Database <span className="text-base font-normal text-slate-400">({filteredData.length} stats found)</span>
                        </h3>
                        {filteredData.length > 0 ? (
                            <StatsTable stats={filteredData} onStatSelect={handleStatSelect} />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-800/50 rounded-lg border border-slate-700">
                                <InfoIcon className="w-12 h-12 text-slate-500 mb-4" />
                                <h3 className="text-xl font-semibold text-slate-200">No Results Found</h3>
                                <p className="text-slate-400 mt-2">Try adjusting your filters or search term.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {selectedStat && (
                <StatDetailModal stat={selectedStat} onClose={handleCloseModal} />
            )}
        </div>
    );
};

export default App;