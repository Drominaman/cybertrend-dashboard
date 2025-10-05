import React, { useMemo, useState } from 'react';
import { TrendData } from '../types';
import { SparklesIcon, InfoIcon } from './Icons';

interface FilteredInsightsProps {
    filteredData: TrendData[];
    hasActiveFilters: boolean;
}

const formatDate = (rawDate: string) => {
    const parsed = Date.parse(rawDate);
    if (Number.isNaN(parsed)) {
        return rawDate;
    }
    return new Date(parsed).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const buildTopList = (items: string[], max = 3) => {
    const counts = new Map<string, number>();
    items.forEach(item => {
        if (!item) return;
        counts.set(item, (counts.get(item) ?? 0) + 1);
    });
    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, max)
        .map(([name, total]) => `${name} (${total})`);
};

const buildDefaultSummary = (filteredData: TrendData[]) => {
    const total = filteredData.length;
    const topics = buildTopList(filteredData.map(item => item.Topic));
    const companies = buildTopList(filteredData.map(item => item.Company));

    const validDates = filteredData
        .map(item => ({ raw: item.Date, value: Date.parse(item.Date) }))
        .filter(item => !Number.isNaN(item.value))
        .sort((a, b) => a.value - b.value);

    const firstDate = validDates[0]?.raw ?? null;
    const lastDate = validDates[validDates.length - 1]?.raw ?? null;

    const parts: string[] = [`${total} stat${total === 1 ? '' : 's'} match the current filters.`];

    if (topics.length > 0) {
        parts.push(`Key topics include ${topics.join(', ')}.`);
    }

    if (companies.length > 0) {
        parts.push(`Notable companies mentioned: ${companies.join(', ')}.`);
    }

    if (firstDate && lastDate) {
        parts.push(`Coverage spans from ${formatDate(firstDate)} to ${formatDate(lastDate)}.`);
    } else if (lastDate) {
        parts.push(`Most recent update: ${formatDate(lastDate)}.`);
    }

    return parts.join(' ');
};

const answerQuestion = (question: string, filteredData: TrendData[]) => {
    const cleanedQuestion = question.trim().toLowerCase();
    if (!cleanedQuestion) {
        return '';
    }

    if (filteredData.length === 0) {
        return 'No stats match the current filters, so there is nothing to analyze yet.';
    }

    const total = filteredData.length;
    const topics = buildTopList(filteredData.map(item => item.Topic));
    const companies = buildTopList(filteredData.map(item => item.Company));

    const validDates = filteredData
        .map(item => ({ data: item, value: Date.parse(item.Date) }))
        .filter(item => !Number.isNaN(item.value))
        .sort((a, b) => a.value - b.value);

    const latestEntry = validDates[validDates.length - 1]?.data;
    const earliestEntry = validDates[0]?.data;

    if (cleanedQuestion.includes('how many')) {
        return `There are ${total} stat${total === 1 ? '' : 's'} in view after applying the filters.`;
    }

    if (cleanedQuestion.includes('latest') || cleanedQuestion.includes('recent')) {
        if (!latestEntry) {
            return 'I could not determine the most recent date from the filtered stats.';
        }
        return `The latest update is from ${formatDate(latestEntry.Date)}: ${latestEntry.stat}`;
    }

    if (cleanedQuestion.includes('oldest') || cleanedQuestion.includes('earliest')) {
        if (!earliestEntry) {
            return 'I could not determine the earliest date from the filtered stats.';
        }
        return `The earliest stat in this view is from ${formatDate(earliestEntry.Date)}: ${earliestEntry.stat}`;
    }

    if (cleanedQuestion.includes('company')) {
        if (companies.length === 0) {
            return 'No company information is present in the filtered stats.';
        }
        return `Companies mentioned most often: ${companies.join(', ')}.`;
    }

    if (cleanedQuestion.includes('topic')) {
        if (topics.length === 0) {
            return 'No topic information is present in the filtered stats.';
        }
        return `Key topics represented: ${topics.join(', ')}.`;
    }

    return buildDefaultSummary(filteredData);
};

export const FilteredInsights: React.FC<FilteredInsightsProps> = ({ filteredData, hasActiveFilters }) => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    const summary = useMemo(() => buildDefaultSummary(filteredData), [filteredData]);

    if (!hasActiveFilters || filteredData.length === 0) {
        return null;
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const response = answerQuestion(question, filteredData);
        setAnswer(response);
    };

    return (
        <section className="mb-6">
            <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-5">
                <div className="flex items-start gap-3">
                    <SparklesIcon className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <div className="space-y-3">
                        <div>
                            <h4 className="text-lg font-semibold text-slate-100">Insights for the filtered stats</h4>
                            <p className="text-sm text-slate-400 mt-1">Use this quick summary or ask a question about the data in view.</p>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-700 rounded-md p-4 text-sm text-slate-200">
                            {summary}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <label className="text-xs uppercase tracking-wide text-slate-400 block">Ask a question</label>
                            <input
                                value={question}
                                onChange={(event) => setQuestion(event.target.value)}
                                type="text"
                                placeholder="e.g. What is the latest stat in this view?"
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 text-sm font-medium rounded-md transition-colors"
                            >
                                Analyze question
                            </button>
                        </form>
                        {answer && (
                            <div className="flex items-start gap-2 bg-slate-900/50 border border-slate-700 rounded-md p-4 text-sm text-slate-200">
                                <InfoIcon className="w-5 h-5 text-cyan-300 mt-0.5" />
                                <p>{answer}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
