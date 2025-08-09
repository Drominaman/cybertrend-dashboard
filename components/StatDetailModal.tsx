import React, { useEffect } from 'react';
import { TrendData } from '../types';
import { BuildingIcon, CalendarIcon, LinkIcon, TagIcon, CpuIcon, XIcon } from './Icons';

interface StatDetailModalProps {
    stat: TrendData;
    onClose: () => void;
}

const CardInfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string }> = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-start text-sm mb-3">
            <span className="text-slate-400 w-5 h-5 flex-shrink-0 mt-0.5">{icon}</span>
            <span className="font-semibold text-slate-300 mr-2 ml-2">{label}:</span>
            <span className="text-slate-300 break-words min-w-0">{value}</span>
        </div>
    );
};

export const StatDetailModal: React.FC<StatDetailModalProps> = ({ stat, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-slate-800 border border-slate-700 rounded-lg p-6 md:p-8 flex flex-col max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    aria-label="Close modal"
                >
                    <XIcon className="w-6 h-6" />
                </button>
                
                <div>
                    <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-100 mb-3 break-words pr-8">{stat.stat || 'Stat not available'}</h3>
                    <p className="text-lg font-semibold text-cyan-400 mb-6">{stat.ResourceName || 'Untitled Resource'}</p>
                    
                    <CardInfoRow icon={<BuildingIcon />} label="Publisher" value={stat.Company} />
                    <CardInfoRow icon={<TagIcon />} label="Topic" value={stat.Topic} />
                    <CardInfoRow icon={<CpuIcon />} label="Technology" value={stat.Technology} />
                    <CardInfoRow icon={<CalendarIcon />} label="Date" value={stat.Date} />
                </div>
            </div>
             <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translate(0px, 10px) scale(0.98); }
                    to { opacity: 1; transform: translate(0px, 0px) scale(1); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};