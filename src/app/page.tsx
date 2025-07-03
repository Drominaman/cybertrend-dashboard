"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Papa from "papaparse";
import { Analytics } from "@vercel/analytics/react";
import Link from 'next/link';


const extractKeywords = (text: string) => {
  const stopWords = ["the", "and", "for", "with", "that", "from", "this", "into", "when", "are"];
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3 && !stopWords.includes(word))
    .slice(0, 5);
};

type DataPoint = {
  id: string;
  summary: string;
  source: string;
  sector: string;
  topic: string;
  date: string;
  parsedDate?: Date | null;
  link: string;
  keywords: string[];
};

// Helper to parse DD/MM/YYYY dates (European format)
function parseDateEUFormat(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [_, day, month, year] = match;
    const iso = `${year}-${month}-${day}`;
    const date = new Date(iso);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

// Simple debounce implementation to avoid external dependency
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default function Page() {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof DataPoint | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedStat, setSelectedStat] = useState<DataPoint | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPageOptions = [10, 25, 50, 100];
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const clearAllFilters = useCallback(() => {
    setSelectedSource(null);
    setSelectedSector(null);
    setSelectedDateFilter("");
    setSelectedTopic("All");
    setCurrentPage(1);
  }, []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState("");

  const csvUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRcLWviAhPQSQ1iKYxFF1EjVpIWpzKv-Hfsw3KXPnvwMLA_F42y5aHAGhBJnHimMgeYoUqorn5WKqvH/pub?output=csv";

  // Debounced search setter
  const debouncedSetSearch = useMemo(
    () =>
      debounce((val: string) => {
        setSearch(val);
        setCurrentPage(1);
        localStorage.setItem(
          'trendFilters',
          JSON.stringify({
            source: selectedSource,
            sector: selectedSector,
            date: selectedDateFilter,
            topic: selectedTopic,
            search: val,
            sortField,
            sortOrder,
          })
        );
      }, 300),
    [selectedSource, selectedSector, selectedDateFilter, selectedTopic, sortField, sortOrder]
  );

  // Load data function for reuse (e.g. retry)
  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(csvUrl)
      .then(res => res.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: result => {
            const parsedData: DataPoint[] = result.data
              .filter((row: any) => row["Stat"] && row["Publisher"]?.trim())
              .map((row: any, index: number) => ({
                id: index.toString(),
                summary: row["Stat"].trim(),
                source: row["Publisher"].trim(),
                sector: row["Tag 1"]?.trim() || "N/A",
                topic:
                  row["Tag 2"]?.trim() ||
                  row["Tag 3"]?.trim() ||
                  row["Tag 4"]?.trim() ||
                  row["Tag 5"]?.trim() ||
                  "General",
                date: row["Date"]?.trim() || "Unknown",
                parsedDate: parseDateEUFormat(row["Date"]?.trim()),
                link: row["Link"]?.trim() || "",
                keywords: extractKeywords(row["Stat"] || ""),
              }));
            setDataPoints(parsedData);
            setLoading(false);
            if (window.location.hash.startsWith("#stat=")) {
              const id = window.location.hash.split("=")[1];
              const match = parsedData.find(d => d.id === id);
              if (match) {
                setSelectedStat(match);
                setShowModal(true);
              }
            }
          },
        });
      })
      .catch(e => {
        setError(e.message || "Unknown error");
        setLoading(false);
      });
  }, [csvUrl]);

  useEffect(() => {
    const stored = localStorage.getItem('trendFilters');
    if (stored) {
      try {
        const { source, sector, date, topic, search: s, sortField: sf, sortOrder: so } = JSON.parse(stored);
        if (source) setSelectedSource(source);
        if (sector) setSelectedSector(sector);
        if (date) setSelectedDateFilter(date);
        if (topic) setSelectedTopic(topic);
        if (s) setSearch(s);
        if (sf) setSortField(sf);
        if (so) setSortOrder(so);
      } catch {}
    }
    loadData();
    const interval = setInterval(loadData, 1000 * 60 * 60 * 5);
    return () => clearInterval(interval);
  }, [csvUrl, loadData]);

  const topics = useMemo(() => ['All', ...Array.from(new Set(dataPoints.map(d => d.topic)))], [dataPoints]);

  const topicCounts = useMemo(
    () =>
      dataPoints.reduce((acc, d) => {
        acc[d.topic] = (acc[d.topic] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    [dataPoints]
  );

  const filteredData = useMemo(
    () =>
      dataPoints.filter(
        (d) =>
          (!selectedSource || d.source === selectedSource) &&
          (selectedTopic === "All" || d.topic === selectedTopic) &&
          (!selectedSector || d.sector === selectedSector) &&
          (selectedDateFilter === "" ||
            (() => {
              const parsed = d.parsedDate ?? parseDateEUFormat(d.date);
              let normalized = "";
              if (parsed && !isNaN(parsed.getTime())) {
                normalized = parsed.toISOString().slice(0, 7);
              }
              return normalized === selectedDateFilter;
            })()) &&
          (d.summary.toLowerCase().includes(search.toLowerCase()) ||
            d.source.toLowerCase().includes(search.toLowerCase()) ||
            d.topic.toLowerCase().includes(search.toLowerCase()))
      ),
    [dataPoints, selectedSource, selectedSector, selectedDateFilter, selectedTopic, search]
  );

  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = sortField === 'parsedDate' ? (a.parsedDate?.getTime() || 0) : (a[sortField] as string);
      const bVal = sortField === 'parsedDate' ? (b.parsedDate?.getTime() || 0) : (b[sortField] as string);
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortOrder]);

  const paginatedData = useMemo(
    () => sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [sortedData, currentPage, itemsPerPage]
  );



  if (loading) {
    return <main role="status" aria-label="Loading trends">Loading...</main>;
  }
  if (error) {
    return (
      <main role="alert">
        Error loading trends: {error}
        <button onClick={() => loadData()}>Retry</button>
      </main>
    );
  }

  return (
    <main className="p-4 max-w-5xl mx-auto bg-white text-black">
      <Link href="/publishers" className="text-blue-600 underline mb-4 inline-block">
        View Stats per Publisher
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          className="border px-3 py-2 rounded text-sm"
          value={selectedSector || ""}
          onChange={(e) => {
            setSelectedSector(e.target.value || null);
            setCurrentPage(1);
          }}
        >
          <option value="">All Industries</option>
          {[...new Set(dataPoints.map((d) => d.sector))].map((sector) => (
            <option key={sector as string} value={sector as string}>
              {sector}
            </option>
          ))}
        </select>
        {/* Date filter dropdown */}
        <select
          className="border px-3 py-2 rounded text-sm"
          value={selectedDateFilter}
          onChange={(e) => {
            setSelectedDateFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Dates</option>
          {[...new Set(dataPoints.map((d) => {
            const parsed = parseDateEUFormat(d.date);
            let normalized = "";
            if (parsed && !isNaN(parsed.getTime())) {
              normalized = parsed.toISOString().slice(0, 7);
            }
            return normalized || "";
          }).filter(Boolean))].sort().map((month) => (
            <option key={month || "unknown"} value={month || ""}>
              {month
                ? new Date(`${month}-01`).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "Unknown"}
            </option>
          ))}
        </select>
        <select
          className="border px-3 py-2 rounded text-sm"
          value={selectedSource || ""}
          onChange={(e) => {
            setSelectedSource(e.target.value || null);
            setCurrentPage(1);
          }}
        >
          <option value="">All Publishers</option>
          {[...new Set(dataPoints.map((d) => d.source))].map((publisher) => (
            <option key={publisher} value={publisher}>
              {publisher}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search for data"
          value={search}
          onChange={e => debouncedSetSearch(e.target.value)}
          className="border px-3 py-2 rounded flex-1 min-w-[200px]"
          aria-label="Search statistics"
        />
        <button className="bg-gray-800 text-white px-3 py-2 rounded">
          🔍
        </button>
        <select
          className="border px-3 py-2 rounded text-sm"
          value={itemsPerPage}
          onChange={e => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          {itemsPerPageOptions.map(opt => (
            <option key={opt} value={opt}>{opt} rows/page</option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {selectedTopic !== 'All' && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full cursor-pointer" onClick={() => setSelectedTopic('All')}>
            Topic: {selectedTopic} ×
          </span>
        )}
        {selectedSource && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full cursor-pointer" onClick={() => setSelectedSource(null)}>
            Publisher: {selectedSource} ×
          </span>
        )}
        {selectedSector && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full cursor-pointer" onClick={() => setSelectedSector(null)}>
            Industry: {selectedSector} ×
          </span>
        )}
        {selectedDateFilter && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full cursor-pointer" onClick={() => setSelectedDateFilter('')}>
            Date: {selectedDateFilter} ×
          </span>
        )}
        {((selectedTopic !== 'All') || selectedSource || selectedSector || selectedDateFilter) && (
          <button
            onClick={clearAllFilters}
            className="px-3 py-1 bg-red-200 text-red-800 rounded-full"
          >
            Clear All Filters
          </button>
        )}
      </div>

      <button
        disabled={selectedIds.size === 0}
        onClick={() => {
          const selectedData = Array.from(selectedIds)
            .map((id) => dataPoints.find((d) => d.id === id))
            .filter(Boolean);
          const csv = Papa.unparse(selectedData as DataPoint[]);
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", "selected_stats.csv");
          link.click();
        }}
        className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 transition-colors"
      >
        Export Selected
      </button>

      {selectedSource && (
        <button
          onClick={() => setSelectedSource(null)}
          className="mb-4 ml-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
        >
          Clear Source Filter: {selectedSource}
        </button>
      )}


      {selectedSector && (
        <button
          onClick={() => setSelectedSector(null)}
          className="mb-4 ml-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
        >
          Clear Industry Filter: {selectedSector}
        </button>
      )}

      {selectedDateFilter && (
        <button
          onClick={() => setSelectedDateFilter("")}
          className="mb-4 ml-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
        >
          Clear Date Filter: {selectedDateFilter}
        </button>
      )}

      <p className="mb-2 text-sm text-gray-700">
        Showing {filteredData.length} statistic{filteredData.length !== 1 ? "s" : ""}
      </p>

      <table className="w-full border border-black text-sm">
        <thead className="sticky top-0 bg-gray-100 z-10 text-left text-xs uppercase text-gray-600">
          <tr>
            <th className="border border-black p-2 text-black">
              <input
                type="checkbox"
                checked={paginatedData.length > 0 && paginatedData.every(d => selectedIds.has(d.id))}
                onChange={e => {
                  const updated = new Set(selectedIds);
                  paginatedData.forEach(d => {
                    if (e.target.checked) {
                      updated.add(d.id);
                    } else {
                      updated.delete(d.id);
                    }
                  });
                  setSelectedIds(updated);
                }}
              />
            </th>
            <th
              className="border border-black p-2 text-black cursor-pointer select-none"
              onClick={() => {
                setSortField('source');
                setSortOrder(sortField === 'source' && sortOrder === 'asc' ? 'desc' : 'asc');
              }}
            >
              Source {sortField === 'source' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th className="border border-black p-2 text-black">Summary</th>
            <th
              className="border border-black p-2 text-black cursor-pointer select-none"
              onClick={() => {
                setSortField('parsedDate');
                setSortOrder(sortField === 'parsedDate' && sortOrder === 'asc' ? 'desc' : 'asc');
              }}
            >
              Published {sortField === 'parsedDate' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((d, i) => (
            <tr key={d.id} className="hover:bg-blue-50 transition-colors cursor-pointer">
              <td className="border border-black p-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(d.id)}
                  onChange={() => {
                    const updated = new Set(selectedIds);
                    if (updated.has(d.id)) {
                      updated.delete(d.id);
                    } else {
                      updated.add(d.id);
                    }
                    setSelectedIds(updated);
                  }}
                />
              </td>
              <td
                className="border border-black p-2 text-blue-600 underline hover:font-bold cursor-pointer transition-all"
                onClick={() => setSelectedSource(d.source)}
              >
                {d.source}
              </td>
              <td className="border border-black p-2">
                <button
                  onClick={() => {
                    setSelectedStat(d);
                    setShowModal(true);
                    window.location.hash = `stat=${d.id}`;
                  }}
                  className="text-sm text-blue-600 underline hover:font-bold cursor-pointer transition-all"
                >
                  {d.summary}
                </button>
              </td>
              <td className="border border-black p-2">
                {(() => {
                  const parsed = d.parsedDate ?? parseDateEUFormat(d.date);
                  if (parsed && !isNaN(parsed.getTime())) {
                    return parsed.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                  }
                  const yearOnly = d.date.match(/(?:\D|^)(\d{4})(?:\D|$)/);
                  return yearOnly ? yearOnly[1] : "Unknown";
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded disabled:opacity-50 transition-colors"
        >
          Prev
        </button>
        <span>Page {currentPage} of {Math.ceil(filteredData.length / itemsPerPage)}</span>
        <button
          onClick={() =>
            setCurrentPage((prev) =>
              prev * itemsPerPage < filteredData.length ? prev + 1 : prev
            )
          }
          disabled={currentPage * itemsPerPage >= filteredData.length}
          className="px-4 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded disabled:opacity-50 transition-colors"
        >
          Next
        </button>
      </div>

      {showModal && selectedStat && (
        <>
          <div
            className="fixed inset-0 bg-transparent z-40"
            onClick={() => setShowModal(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="statDetailTitle"
            className="fixed z-50 bg-white text-black p-4 shadow-lg rounded max-w-md w-fit mx-auto left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <h2 id="statDetailTitle" className="text-xl font-bold mb-4">Stat Detail</h2>
            <p className="mb-2">
              <strong>Stat:</strong> {selectedStat.summary}
            </p>
            <p className="mb-2">
              <strong>Source:</strong> {selectedStat.source}
            </p>
            <p className="mb-2">
              <strong>Published:</strong>{" "}
              {(() => {
                const parsed = selectedStat.parsedDate ?? parseDateEUFormat(selectedStat.date);
                if (parsed && !isNaN(parsed.getTime())) {
                  return parsed.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                }
                const yearOnly = selectedStat.date.match(/(?:\D|^)(\d{4})(?:\D|$)/);
                return yearOnly ? yearOnly[1] : "Unknown";
              })()}
            </p>
            {selectedStat.link && (
              <p className="mb-4">
                <strong>Link:</strong>{" "}
                <a
                  href={selectedStat.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View Source
                </a>
              </p>
            )}
            <button
              onClick={() => {
                if (selectedStat?.summary && selectedStat?.link) {
                  const htmlLink = `${selectedStat.summary} (${selectedStat.link})`;
                  navigator.clipboard.writeText(htmlLink);
                }
              }}
              className="mr-2 mt-2 bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded transition-colors"
            >
              Copy Stat
            </button>
            <button
              onClick={() => {
                setShowModal(false);
                window.location.hash = "";
              }}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </>
      )}

      {/* Date modal removed */}
      <Analytics />
    </main>
  );
}