import React, { useMemo } from 'react';
import { TrendItem } from '../types';
import { LinkIcon, BuildingOfficeIcon, CalendarDaysIcon } from './icons';

interface ResultCardProps {
  item: TrendItem;
}

const ResultCard: React.FC<ResultCardProps> = ({ item }) => {
  const { stat, resourceName, publisher, tags, link, notes, datePublished, originalDateString } = item;

  const displayDate = useMemo(() => {
    // If we have a valid, parsed date, format it intelligently.
    if (datePublished && originalDateString) {
      // Heuristic: If the original string contains no day indicators like '/' or '-',
      // it's likely just a "Month Year" format (e.g., "Sep 2024").
      const isMonthYearOnly = !originalDateString.includes('/') && !originalDateString.includes('-');

      const options: Intl.DateTimeFormatOptions = {
        // Use UTC when formatting to prevent the formatted date being a day off from the parsed date.
        timeZone: 'UTC',
        ...(isMonthYearOnly
          ? { month: 'long', year: 'numeric' }
          : { dateStyle: 'long' })
      };

      return new Intl.DateTimeFormat('en-US', options).format(datePublished);
    }
    
    // Fallback for non-parsable dates like "Q3 2024". We show the original text from the sheet.
    if (originalDateString) {
      return originalDateString;
    }

    return null;
  }, [datePublished, originalDateString]);

  return (
    <article className="bg-slate-800/60 border border-slate-700 rounded-xl shadow-lg p-5 flex flex-col transition-all duration-300 hover:border-blue-500 hover:bg-slate-800">
      <div className="mb-4">
        <p className="text-xl text-slate-200">{stat}</p>
      </div>

      <h3 className="text-lg font-bold text-slate-100 mb-2">{resourceName}</h3>
      
      {notes && (
        <blockquote className="my-3 pl-4 border-l-4 border-slate-600 bg-slate-900/50 p-3 rounded-r-lg flex-grow">
          <p className="text-slate-300 italic">{notes}</p>
        </blockquote>
      )}

      <div className="flex flex-wrap items-center text-slate-400 text-sm my-4 gap-x-6 gap-y-2">
        <div className="flex items-center">
            <BuildingOfficeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{publisher}</span>
        </div>
        {displayDate && (
             <div className="flex items-center">
                <CalendarDaysIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{displayDate}</span>
            </div>
        )}
      </div>
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <span key={tag} className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="mt-auto pt-4 border-t border-slate-700/50">
         <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200"
        >
          <LinkIcon className="h-5 w-5 mr-2" />
          View Source
        </a>
      </div>
    </article>
  );
};

export default ResultCard;