"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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

export default function Page() {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedStat, setSelectedStat] = useState<DataPoint | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "source" | "topic">("date");

  const topics = ["All", ...Array.from(new Set(dataPoints.map((d) => d.topic)))];

  const topicCounts = dataPoints.reduce((acc, d) => {
    acc[d.topic] = (acc[d.topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  useEffect(() => {
    const csvUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRcLWviAhPQSQ1iKYxFF1EjVpIWpzKv-Hfsw3KXPnvwMLA_F42y5aHAGhBJnHimMgeYoUqorn5WKqvH/pub?output=csv";

    const fetchData = () => {
      fetch(csvUrl)
        .then((res) => res.text())
        .then((csvText) => {
          Papa.parse(csvText, {
            header: true,
            complete: (result) => {
              const parsedData: DataPoint[] = result.data
                .filter((row: any) => row["Stat"] && row["Publisher"]?.trim())
                .map((row: any, index: number) => {
                  return {
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
                    link: row["Link"]?.trim() || "",
                    keywords: extractKeywords(row["Stat"] || ""),
                  };
                });
              setDataPoints(parsedData);
              const hash = window.location.hash;
              if (hash.startsWith("#stat=")) {
                const id = hash.split("=")[1];
                const match = parsedData.find((d) => d.id === id);
                if (match) {
                  setSelectedStat(match);
                  setShowModal(true);
                }
              }
            },
          });
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 1000 * 60 * 60 * 5); // refresh every 5 hours
    return () => clearInterval(interval);
  }, []);

  const filteredData = dataPoints.filter(
    (d) =>
      (!selectedSource || d.source === selectedSource) &&
      (selectedTopic === "All" || d.topic === selectedTopic) &&
      (!selectedDate || d.date === selectedDate) &&
      (!selectedSector || d.sector === selectedSector) &&
      (d.summary.toLowerCase().includes(search.toLowerCase()) ||
        d.source.toLowerCase().includes(search.toLowerCase()) ||
        d.topic.toLowerCase().includes(search.toLowerCase()))
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "date") {
      const dateA = parseDateEUFormat(a.date) || new Date(a.date);
      const dateB = parseDateEUFormat(b.date) || new Date(b.date);
      return dateB.getTime() - dateA.getTime(); // most recent first
    }

    const valA = a[sortBy]?.toLowerCase?.() || "";
    const valB = b[sortBy]?.toLowerCase?.() || "";
    if (valA < valB) return 1;
    if (valA > valB) return -1;
    return 0;
  });

  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  if (!dataPoints.length) {
    return (
      <main className="p-4 max-w-5xl mx-auto text-center text-gray-500">
        Loading trends...
      </main>
    );
  }

  return (
    <main className="p-4 max-w-5xl mx-auto bg-white text-black">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          className="border px-3 py-2 rounded text-sm"
          value={selectedSector || ""}
          onChange={(e) => {
            setSelectedSector(e.target.value || null);
            setCurrentPage(1);
          }}
        >
          <option value="">All Topics</option>
          {[...new Set(dataPoints.map((d) => d.sector))].map((sector) => (
            <option key={sector} value={sector}>
              {sector}
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
        {/* Date filter dropdown removed */}
        <select
          className="border px-3 py-2 rounded text-sm"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as "date" | "source" | "topic");
            setCurrentPage(1);
          }}
        >
          <option value="date">Sort by Date</option>
          <option value="source">Sort by Source</option>
          <option value="topic">Sort by Topic</option>
        </select>
        <input
          type="text"
          placeholder="Search for data"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
            localStorage.setItem("trendFilters", JSON.stringify({
              source: selectedSource,
              topic: selectedTopic,
              date: selectedDate,
              search: e.target.value,
              // remove sortOrder from the filters
            }));
          }}
          className="border px-3 py-2 rounded flex-1 min-w-[200px]"
        />
        <button className="bg-gray-800 text-white px-3 py-2 rounded">
          🔍
        </button>
      </div>

      <button
        disabled={selectedIds.size === 0}
        onClick={() => {
          const selectedData = Array.from(selectedIds)
            .map((i) => dataPoints[i])
            .filter(Boolean);
          const csv = Papa.unparse(selectedData);
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

      {selectedDate && (
        <button
          onClick={() => setSelectedDate(null)}
          className="mb-4 ml-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
        >
          Clear Date Filter: {selectedDate}
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

      <p className="mb-2 text-sm text-gray-700">
        Showing {filteredData.length} statistic{filteredData.length !== 1 ? "s" : ""}
      </p>

      <table className="w-full border border-black text-sm">
        <thead className="sticky top-0 bg-gray-100 z-10 text-left text-xs uppercase text-gray-600">
          <tr>
            <th className="border border-black p-2 text-black">
              <input
                type="checkbox"
                checked={
                  paginatedData.length > 0 &&
                  paginatedData.every((_, i) =>
                    selectedIds.has(i + (currentPage - 1) * itemsPerPage)
                  )
                }
                onChange={(e) => {
                  const updated = new Set(selectedIds);
                  paginatedData.forEach((_, i) => {
                    const index = i + (currentPage - 1) * itemsPerPage;
                    if (e.target.checked) {
                      updated.add(index);
                    } else {
                      updated.delete(index);
                    }
                  });
                  setSelectedIds(updated);
                }}
              />
            </th>
            <th className="border border-black p-2 text-black">Source</th>
            <th className="border border-black p-2 text-black">Summary</th>
            <th className="border border-black p-2 text-black">Published</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((d, i) => (
            <tr key={i} className="hover:bg-blue-50 transition-colors cursor-pointer">
              <td className="border border-black p-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(i + (currentPage - 1) * itemsPerPage)}
                  onChange={() => {
                    const index = i + (currentPage - 1) * itemsPerPage;
                    const updated = new Set(selectedIds);
                    if (updated.has(index)) {
                      updated.delete(index);
                    } else {
                      updated.add(index);
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
                  const parsed = parseDateEUFormat(d.date) || new Date(d.date);
                  return !isNaN(parsed.getTime())
                    ? parsed.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                    : "Unknown";
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
          <div className="fixed z-50 bg-white text-black p-4 shadow-lg rounded max-w-md w-fit mx-auto left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <h2 className="text-xl font-bold mb-4">Stat Detail</h2>
            <p className="mb-2">
              <strong>Stat:</strong> {selectedStat.summary}
            </p>
            <p className="mb-2">
              <strong>Source:</strong> {selectedStat.source}
            </p>
            <p className="mb-2">
              <strong>Published:</strong>{" "}
              {(() => {
                const parsed = parseDateEUFormat(selectedStat.date) || new Date(selectedStat.date);
                return !isNaN(parsed.getTime())
                  ? parsed.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                  : "Unknown";
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
    </main>
  );
}