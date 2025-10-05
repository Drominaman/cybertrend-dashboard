import React, { useEffect, useState } from 'react';
import { FilterOptions } from '../types';
import { SparklesIcon, TagIcon, CalendarIcon, RefreshCwIcon } from './Icons';

interface GuidedFilterSearchProps {
    filterOptions: FilterOptions;
    onApply: (topic: string | null, date: string | null) => void;
    currentTopic: string | null;
    currentDate: string | null;
}

export const GuidedFilterSearch: React.FC<GuidedFilterSearchProps> = ({
    filterOptions,
    onApply,
    currentTopic,
    currentDate
}) => {
    const [topicSelection, setTopicSelection] = useState<string>(currentTopic ?? '');
    const [dateSelection, setDateSelection] = useState<string>(currentDate ?? '');

    useEffect(() => {
        setTopicSelection(currentTopic ?? '');
    }, [currentTopic]);

    useEffect(() => {
        setDateSelection(currentDate ?? '');
    }, [currentDate]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onApply(topicSelection || null, dateSelection || null);
    };

    const handleReset = () => {
        setTopicSelection('');
        setDateSelection('');
        onApply(null, null);
    };

    const canApply = topicSelection !== '' || dateSelection !== '';

    return (
        <section className="mb-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h2 className="text-lg font-semibold text-slate-100 flex items-center">
                        <SparklesIcon className="w-5 h-5 text-cyan-400 mr-2" />
                        Guided Filter Search
                    </h2>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center text-sm text-slate-300 hover:text-slate-100 transition-colors"
                    >
                        <RefreshCwIcon className="w-4 h-4 mr-1" />
                        Clear guided search
                    </button>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                    Follow the steps to look up stats by topic and narrow them down by time period.
                </p>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="text-xs uppercase tracking-wide text-slate-400 mb-1 block">Step 1 · Choose a topic</label>
                        <div className="relative">
                            <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={topicSelection}
                                onChange={(event) => setTopicSelection(event.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">Any topic</option>
                                {filterOptions.topics.map(topic => (
                                    <option key={topic} value={topic}>{topic}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs uppercase tracking-wide text-slate-400 mb-1 block">Step 2 · Pick a time</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={dateSelection}
                                onChange={(event) => setDateSelection(event.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">Anytime</option>
                                {filterOptions.dates.map(date => (
                                    <option key={date} value={date}>{date}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                            Apply will update the filters panel using the selections above.
                        </p>
                        <button
                            type="submit"
                            disabled={!canApply}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${canApply ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                        >
                            Apply filters
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};
