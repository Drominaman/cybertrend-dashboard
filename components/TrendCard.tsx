import React from 'react';
import { TrendData } from '../types';
import { BuildingIcon, CalendarIcon, LinkIcon, TagIcon, CpuIcon } from './Icons';

interface TrendCardProps {
    trend: TrendData;
}

const CardInfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string }> = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-start text-sm mb-2">
            <span className="text-slate-400 w-6 h-6 flex-shrink-0">{icon}</span>
            <span className="font-semibold text-slate-300 mr-2 ml-1">{label}:</span>
            <span className="text-slate-300 break-words min-w-0">{value}</span>
        </div>
    );
};


export const TrendCard: React.FC<TrendCardProps> = ({ trend }) => {
    return (
        <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-5 flex flex-col justify-between transition-all duration-300 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10">
            <div>
                <h3 className="text-2xl font-extrabold text-slate-100 mb-2 break-words">{trend.stat || 'Stat not available'}</h3>
                <p className="text-lg font-semibold text-cyan-400 mb-4">{trend.ResourceName || 'Untitled Resource'}</p>
                
                <CardInfoRow icon={<BuildingIcon />} label="Publisher" value={trend.Company} />
                <CardInfoRow icon={<TagIcon />} label="Topic" value={trend.Topic} />
                <CardInfoRow icon={<CpuIcon />} label="Technology" value={trend.Technology} />
                <CardInfoRow icon={<CalendarIcon />} label="Date" value={trend.Date} />
            </div>
            {trend.Source && (
                <div className="mt-4 pt-3 border-t border-slate-700">
                    <a
                        href={trend.Source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                    >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        View Source
                    </a>
                </div>
            )}
        </div>
    );
};
