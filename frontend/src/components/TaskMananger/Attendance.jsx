/**
 * Attendify - Attendance Tracking Component (Fixed)
 */

import React, { useState, useEffect, useCallback } from "react";
import "./AttendanceTracker.css";

const Attendance = ({ user }) => {
  const userId = user?.id || user?.uid || user?._id;

  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5001/api";

  /* ---------------- STATE ---------------- */
  const [subjects, setSubjects] = useState([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [targetPercentage, setTargetPercentage] = useState(75);
  const [selectedDate, setSelectedDate] = useState("");
  const [markAttendanceFor, setMarkAttendanceFor] = useState(null);
  const [showHistoryFor, setShowHistoryFor] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [historyLimits, setHistoryLimits] = useState({});

  /* ---------------- FETCH DATA ---------------- */
  const fetchDataFromDB = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const attendanceRes = await fetch(
        `${API_BASE_URL}/attendance/${userId}`
      );

      if (!attendanceRes.ok) {
        throw new Error("Failed to fetch attendance");
      }

      const records = await attendanceRes.json();

      const grouped = {};
      records.forEach((rec) => {
        if (!grouped[rec.subject]) grouped[rec.subject] = [];
        grouped[rec.subject].push({
          id: rec.id,
          date: rec.date,
          status: rec.status,
        });
      });

      const subjectsData = Object.keys(grouped).map((name) => ({
        id: `${name}-${userId}`,
        name,
        attendance: grouped[name],
      }));

      setSubjects(subjectsData);
    } catch (err) {
      console.error("Error loading attendance", err);
      setError("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [userId, API_BASE_URL]);

  /* ---------------- RUN FETCH ---------------- */
  useEffect(() => {
    fetchDataFromDB();
  }, [fetchDataFromDB]);

  /* ---------------- HELPERS ---------------- */
  const calculateStats = (attendance) => {
    const total = attendance.length;
    const present = attendance.filter(a => a.status === "present").length;
    const absent = total - present;
    const percentage = total ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percentage };
  };

  const getFilteredHistory = (attendance) => {
    if (historyFilter === "present") {
      return attendance.filter(a => a.status === "present");
    }
    if (historyFilter === "absent") {
      return attendance.filter(a => a.status === "absent");
    }
    return attendance;
  };

  /* ---------------- UI ---------------- */
  if (!userId) return <p>Please login to view attendance</p>;
  if (loading) return <p>Loading attendance...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="attendance-tracker">
      <h1>Attendance Tracker</h1>

      {subjects.length === 0 ? (
        <p>No subjects found.</p>
      ) : (
        subjects.map(subject => {
          const stats = calculateStats(subject.attendance);
          return (
            <div key={subject.id} className="subject-container">
              <h3>{subject.name}</h3>
              <p>
                {stats.percentage}% | Present: {stats.present} | Absent:{" "}
                {stats.absent} | Total: {stats.total}
              </p>

              <button onClick={() => setShowHistoryFor(
                showHistoryFor === subject.id ? null : subject.id
              )}>
                View History
              </button>

              {showHistoryFor === subject.id && (
                <div className="history-list">
                  {getFilteredHistory(subject.attendance).map((rec) => (
                    <div key={rec.id}>
                      {rec.date} — {rec.status}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Attendance;
