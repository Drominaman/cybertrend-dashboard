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

type DataPoint = {
  summary: string;
  source: string;
  sector: string;
  topic: string;
  date: string;
  link: string;
  createdAt: Date;
};

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
                .filter((row: any) => row["Stat"] && row["Publisher"])
                .map((row: any) => {
                  let parsedDate = new Date();
                  const rawDate = row["Date"]?.trim();
                  if (rawDate && /^\/[A-Za-z]+\/\d{4}$/.test(rawDate)) {
                    const parts = rawDate.split("/");
                    const monthName = parts[1];
                    const year = parts[2];
                    parsedDate = new Date(`${monthName} 1, ${year}`);
                  }
                  return {
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
                    createdAt: parsedDate,
                  };
                });
              setDataPoints(parsedData);
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
      (d.summary.toLowerCase().includes(search.toLowerCase()) ||
        d.source.toLowerCase().includes(search.toLowerCase()) ||
        d.topic.toLowerCase().includes(search.toLowerCase()))
  );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isNew = (createdAt: Date) => {
    const now = new Date();
    const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 90;
  };

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
        <select
          className="border px-3 py-2 rounded text-sm"
          value={selectedDate || ""}
          onChange={(e) => {
            setSelectedDate(e.target.value || null);
            setCurrentPage(1);
          }}
        >
          <option value="">All Dates</option>
          {[...new Set(dataPoints.map((d) => d.date))].sort().map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search for topics"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
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
            <th className="border border-black p-2 text-black">Topic</th>
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
                  }}
                  className="text-sm text-blue-600 underline hover:font-bold cursor-pointer transition-all"
                >
                  {d.summary}
                  {isNew(d.createdAt) && (
                    <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium uppercase">
                      New
                    </span>
                  )}
                </button>
              </td>
              <td className="border border-black p-2">{d.topic}</td>
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
              <strong>Topic:</strong> {selectedStat.topic}
            </p>
            <p className="mb-2">
              <strong>Published:</strong>{" "}
              {new Date(selectedStat.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
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
              onClick={() => setShowModal(false)}
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