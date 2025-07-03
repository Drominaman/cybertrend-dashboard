import React, { useMemo } from 'react';
import { TrendItem } from '../types';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid } from 'recharts';
import { ChartBarIcon } from './icons';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900 border border-slate-600 p-3 rounded-md shadow-lg">
        <p className="label text-slate-200 font-bold">{`${label}`}</p>
        <p className="intro text-blue-400">{`${data.name}: ${data.value}`}</p>
      </div>
    );
  }
  return null;
};

interface ChartDisplayProps {
  trends: TrendItem[];
  onTagSelect: (tag: string) => void;
}

const ChartDisplay: React.FC<ChartDisplayProps> = ({ trends, onTagSelect }) => {
    
    const topTags = useMemo(() => {
        const counts = trends.flatMap(trend => trend.tags).reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }));
    }, [trends]);

    return (
        <div className="mt-6 grid grid-cols-1 gap-8">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 min-h-[450px]">
                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center">
                    <ChartBarIcon className="h-6 w-6 mr-3 text-blue-400" />
                    Top 10 Tags
                </h2>
                {topTags.length > 0 ? (
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart layout="vertical" data={topTags} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis type="number" stroke="#94a3b8" allowDecimals={false} />
                                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={120} tick={{ fontSize: 12, fill: '#cbd5e1' }} interval={0} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(30, 41, 59, 0.5)' }} />
                                <Bar 
                                    dataKey="count" 
                                    name="Mentions"
                                    fill="#60a5fa" 
                                    barSize={20}
                                    onClick={(data) => onTagSelect(data.name)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[400px] text-slate-400">
                        <p>No tag data for current filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartDisplay;