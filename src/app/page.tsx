"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";

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

  const topics = ["All", ...Array.from(new Set(dataPoints.map((d) => d.topic)))];

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
                .map((row: any) => ({
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
                  createdAt: new Date(row["Date"]),
                }));
              setDataPoints(parsedData);
            },
          });
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 1000 * 60 * 60 * 5); // refresh every 5 hours
    return () => clearInterval(interval);
  }, []);

  const filteredData = dataPoints
    .filter(
      (d) =>
        (selectedTopic === "All" || d.topic === selectedTopic) &&
        (d.summary.toLowerCase().includes(search.toLowerCase()) ||
          d.source.toLowerCase().includes(search.toLowerCase()) ||
          d.topic.toLowerCase().includes(search.toLowerCase()) ||
          d.sector.toLowerCase().includes(search.toLowerCase()))
    );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isNew = (createdAt: Date) => {
    const now = new Date();
    const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  };

  return (
    <main className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cybersecurity Trend Dashboard</h1>

      <div className="mb-4 flex flex-col gap-6">
        <input
          type="text"
          placeholder="Search stats, sources, sectors or topics"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-1/2 border px-3 py-2 rounded"
        />

        <select
          value={selectedTopic}
          onChange={(e) => {
            setSelectedTopic(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded w-full sm:w-auto"
        >
          {topics.map((topic, i) => (
            <option key={i} value={topic}>
              {topic}
            </option>
          ))}
        </select>
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
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        Export Selected
      </button>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100 text-left text-black">
            <th className="border p-2 text-black">
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
            <th className="border p-2 text-black">Source</th>
            <th className="border p-2 text-black">Summary</th>
            <th className="border p-2 text-black">Sector</th>
            <th className="border p-2 text-black">Topic</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((d, i) => (
            <tr key={i}>
              <td className="border p-2">
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
              <td className="border p-2">{d.source}</td>
              <td className="border p-2">
                <button
                  onClick={() => {
                    setSelectedStat(d);
                    setShowModal(true);
                  }}
                  className="text-blue-600 underline hover:font-bold cursor-pointer transition-all"
                >
                  <>
                    {d.summary}
                    {isNew(d.createdAt) && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                        NEW
                      </span>
                    )}
                  </>
                </button>
              </td>
              <td className="border p-2">{d.sector}</td>
              <td className="border p-2">{d.topic}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 text-black rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>Page {currentPage}</span>
        <button
          onClick={() =>
            setCurrentPage((prev) =>
              prev * itemsPerPage < filteredData.length ? prev + 1 : prev
            )
          }
          disabled={currentPage * itemsPerPage >= filteredData.length}
          className="px-4 py-2 bg-gray-200 text-black rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <p className="text-sm text-gray-500 mt-2">
        Last updated: {new Date().toLocaleString()}
      </p>

      {showModal && selectedStat && (
        <>
          <div
            className="fixed inset-0 bg-neutral-400 bg-opacity-20 z-40"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed z-50 bg-zinc-300 text-black p-4 shadow-lg rounded max-w-md w-fit mx-auto left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <h2 className="text-xl font-bold mb-4">Stat Detail</h2>
            <p className="mb-2">
              <strong>Stat:</strong> {selectedStat.summary}
            </p>
            <p className="mb-2">
              <strong>Source:</strong> {selectedStat.source}
            </p>
            <p className="mb-2">
              <strong>Sector:</strong> {selectedStat.sector}
            </p>
            <p className="mb-2">
              <strong>Topic:</strong> {selectedStat.topic}
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
              className="mt-2 bg-slate-800 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </>
      )}
    </main>
  );
}