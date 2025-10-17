/**
 * Attendify - Attendance Tracking Component
 */

import React, { useState, useEffect } from 'react';
import './AttendanceTracker.css';

const AttendanceTracker = ({ onBack }) => {
  // Config
  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
  const API_ATTENDANCE = `${API_BASE}/attendance`;

  // State
  const [userId, setUserId] = useState(null);
  const [timetable, setTimetable] = useState([]); // [{ day: 'General', subject: 'Math' }, ...]
  const [sessions, setSessions] = useState([]); // records from backend
  const [targetAttendance, setTargetAttendance] = useState(75);
  const [manualSubject, setManualSubject] = useState("");
  const [showTimetable, setShowTimetable] = useState(true);
  const [showExtraOptions, setShowExtraOptions] = useState({});
  const [selectedDates, setSelectedDates] = useState({});
  const [actionHistory, setActionHistory] = useState([]); // client-side undo stack
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null); // { type: 'success'|'error', text }
  const [extraShowMore, setExtraShowMore] = useState({});
  const [scheduledShowMore, setScheduledShowMore] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedSubjectForCalendar, setSelectedSubjectForCalendar] = useState("");

  // Helper: get local YYYY-MM-DD string (avoids timezone-shift issues)
  const getLocalDateString = (date = new Date()) => {
    const d = new Date(date);
    const tzOffset = d.getTimezoneOffset() * 60000; // in ms
    const local = new Date(d.getTime() - tzOffset);
    return local.toISOString().split("T")[0];
  };

  // Show a transient global message
  const showMessage = (text, type = "success", duration = 3000) => {
    setGlobalMessage({ text, type });
    setTimeout(() => setGlobalMessage(null), duration);
  };

  // Load login user id from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) setUserId(parsed.id);
        else setUserId(null);
      } else {
        setUserId(null);
      }
    } catch (err) {
      console.error("Failed to parse stored user:", err);
      setUserId(null);
    }
  }, []);

  // Load UI prefs from localStorage
  useEffect(() => {
    const sTarget = localStorage.getItem("targetAttendance");
    if (sTarget) setTargetAttendance(parseInt(sTarget, 10) || 75);

    const sDates = localStorage.getItem("selectedDates");
    if (sDates) {
      try { setSelectedDates(JSON.parse(sDates)); } catch { /* ignore */ }
    }

    const sTimetable = localStorage.getItem("timetable");
    if (sTimetable) {
      try { setTimetable(JSON.parse(sTimetable)); } catch { /* ignore */ }
    }

    const sHistory = localStorage.getItem("actionHistory");
    if (sHistory) {
      try { setActionHistory(JSON.parse(sHistory)); } catch { /* ignore */ }
    }
  }, []);

  // Persist certain UI prefs
  useEffect(() => localStorage.setItem("targetAttendance", String(targetAttendance)), [targetAttendance]);
  useEffect(() => localStorage.setItem("selectedDates", JSON.stringify(selectedDates)), [selectedDates]);
  useEffect(() => localStorage.setItem("timetable", JSON.stringify(timetable)), [timetable]);
  useEffect(() => localStorage.setItem("actionHistory", JSON.stringify(actionHistory)), [actionHistory]);

  // Fetch attendance records for user
  const fetchAttendance = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_ATTENDANCE}/${userId}`);
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
      const records = await res.json();
      // Expect records to be an array of { id, userId, subject, date: 'YYYY-MM-DD', attendance: 'present'|'absent', status: 'scheduled'|'extra' }
      setSessions(Array.isArray(records) ? records : []);
      // Build timetable from subjects if timetable empty (use backend as source of truth)
      const subjects = [...new Set((Array.isArray(records) ? records : []).map((r) => r.subject))];
      if (subjects.length && timetable.length === 0) {
        setTimetable(subjects.map((s) => ({ day: "General", subject: s })));
      }
      // Latest dates per subject
      const latest = {};
      (records || []).forEach((r) => {
        if (!latest[r.subject] || new Date(r.date) > new Date(latest[r.subject])) {
          latest[r.subject] = r.date;
        }
      });
      setSelectedDates((prev) => ({ ...latest, ...prev }));
    } catch (err) {
      console.error("fetchAttendance error:", err);
      showMessage("Unable to fetch attendance. Check your network or API URL.", "error", 4000);
    } finally {
      setLoading(false);
    }
  };

  // fetch when userId available
  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Add manual subject (client side, persisted locally and used for UI)
  const addManualEntry = async () => {
    if (!manualSubject.trim()) return showMessage("Please enter a subject name.", "error");
    const normalized = manualSubject.trim();
    if (timetable.some((t) => t.subject.toLowerCase() === normalized.toLowerCase())) {
      return showMessage("Subject already exists", "error");
    }
    const newEntry = { day: "General", subject: normalized };
    setTimetable((prev) => [...prev, newEntry]);
    setSelectedDates((prev) => ({ ...prev, [normalized]: getLocalDateString() }));
    setManualSubject("");
    setShowTimetable(true);
    showMessage("Subject added locally. You can mark attendance now.", "success");
  };

  const handleKeyPress = (e) => { if (e.key === "Enter") addManualEntry(); };

  // Remove subject (client-side removal + optional backend delete of sessions)
  const removeTimetableEntry = async (day, subject) => {
    if (!window.confirm(`Remove ${subject} and its attendance records?`)) return;
    setTimetable((prev) => prev.filter((t) => !(t.day === day && t.subject === subject)));

    if (!userId) {
      // If no user, just remove local sessions
      setSessions((prev) => prev.filter((s) => s.subject !== subject));
      showMessage("Subject removed locally", "success");
      return;
    }

    // Attempt backend removal of sessions for that subject (optional endpoint)
    try {
      setLoading(true);
      const res = await fetch(`${API_ATTENDANCE}/${userId}/${encodeURIComponent(subject)}`, { method: "DELETE" });
      if (!res.ok) {
        // Not fatal — still remove locally
        console.warn("Backend delete subject responded", res.status);
      }
      // Update local sessions anyway
      setSessions((prev) => prev.filter((s) => s.subject !== subject));
      showMessage("Subject and sessions removed", "success");
    } catch (err) {
      console.error("removeTimetableEntry error:", err);
      showMessage("Failed to remove subject from server. Removed locally.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add to small undo history (client-side)
  const pushHistory = (action, payload) => {
    const entry = { id: Date.now(), action, payload, ts: new Date().toISOString() };
    setActionHistory((prev) => [entry, ...prev].slice(0, 12));
  };

  // Undo last client action (only undoes local session change or recent add)
  const undoLastAction = () => {
    if (!actionHistory.length) return showMessage("Nothing to undo", "error");
    const [last, ...rest] = actionHistory;
    if (last.action === "add_session_local") {
      setSessions((prev) => prev.filter((s) => s.id !== last.payload.id));
      showMessage("Added session undone (local)", "success");
    } else if (last.action === "mark_attendance_local") {
      // restore previous status
      setSessions((prev) => prev.map((s) => (s.id === last.payload.id ? { ...s, attendance: last.payload.prev } : s)));
      showMessage("Attendance change undone (local)", "success");
    }
    setActionHistory(rest);
  };

  // Mark attendance (backend-driven). status: 'scheduled'|'extra', attendance: 'present'|'absent'
  const markAttendance = async (subject, date, attendanceValue, status = "scheduled") => {
    if (!userId) return showMessage("Please login to mark attendance", "error");
    const dateStr = date || getLocalDateString();

    const payload = {
      userId,
      subject,
      date: dateStr,
      attendance: attendanceValue,
      status,
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_ATTENDANCE}/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      // refresh sessions after server returns success
      await fetchAttendance();
      showMessage(`Marked ${subject} ${dateStr} as ${attendanceValue}`, "success");
    } catch (err) {
      console.error("markAttendance error:", err);
      showMessage("Failed to mark attendance. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete a single session (backend)
  const deleteSession = async (session) => {
    if (!userId) return showMessage("Please login to delete session", "error");
    if (!window.confirm(`Delete session ${session.subject} on ${session.date}?`)) return;

    setLoading(true);
    try {
      const path = `${API_ATTENDANCE}/${userId}/${encodeURIComponent(session.subject)}/${session.date}/${session.status}`;
      const res = await fetch(path, { method: "DELETE" });
      if (!res.ok) {
        console.warn("Delete session responded", res.status);
      }
      await fetchAttendance();
      showMessage("Session deleted", "success");
    } catch (err) {
      console.error("deleteSession error:", err);
      showMessage("Failed to delete session", "error");
    } finally {
      setLoading(false);
    }
  };

  // Helpers to calculate stats (same as your original calcStats but uses sessions)
  const calcStats = (subject) => {
    const scheduledSessions = sessions.filter((s) => s.subject === subject && s.status === "scheduled");
    const extraSessions = sessions.filter((s) => s.subject === subject && s.status === "extra");

    const totalScheduled = scheduledSessions.length;
    const attendedScheduled = scheduledSessions.filter((s) => s.attendance === "present").length;
    const totalExtra = extraSessions.length;
    const attendedExtra = extraSessions.filter((s) => s.attendance === "present").length;

    const totalClasses = totalScheduled + totalExtra;
    const totalAttended = attendedScheduled + attendedExtra;
    const totalAbsent = (totalScheduled - attendedScheduled) + (totalExtra - attendedExtra);

    if (totalClasses === 0) return { percentage: 0, attended: 0, total: 0, absent: 0, extra: totalExtra, extraAttended: attendedExtra, extraAbsent: totalExtra - attendedExtra, effectiveTotal: 0, classesNeeded: 0 };

    const percentage = (totalAttended / totalClasses) * 100;
    const classesNeeded = percentage < targetAttendance ? Math.ceil((targetAttendance * totalClasses - 100 * totalAttended) / (100 - targetAttendance)) : 0;

    return { percentage, attended: totalAttended, total: totalClasses, absent: totalAbsent, extra: totalExtra, extraAttended: attendedExtra, extraAbsent: totalExtra - attendedExtra, effectiveTotal: totalClasses, classesNeeded };
  };

  // Calendar helpers
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const getAttendanceStatus = (date, subject) => {
    if (!subject) return null;
    const dateStr = getLocalDateString(new Date(currentYear, currentMonth, date));
    const session = sessions.find((s) => s.subject === subject && s.date === dateStr);
    return session ? session.attendance : null;
  };

  const navigateMonth = (direction) => {
    if (direction === "prev") {
      if (currentMonth === 0) setCurrentYear((y) => y - 1);
      setCurrentMonth((m) => (m === 0 ? 11 : m - 1));
    } else {
      if (currentMonth === 11) setCurrentYear((y) => y + 1);
      setCurrentMonth((m) => (m === 11 ? 0 : m + 1));
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);

    for (let day = 1; day <= daysInMonth; day++) {
      const attendanceStatus = getAttendanceStatus(day, selectedSubjectForCalendar);
      const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
      days.push(
        <div key={day} className={`calendar-day ${attendanceStatus || ""} ${isToday ? "today" : ""}`}>
          <span className="day-number">{day}</span>
          {attendanceStatus && <div className={`attendance-indicator ${attendanceStatus}`}>{attendanceStatus === "present" ? "✓" : "✗"}</div>}
        </div>
      );
    }

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={() => navigateMonth("prev")}>‹</button>
          <h3 className="calendar-title">{monthNames[currentMonth]} {currentYear}</h3>
          <button className="calendar-nav-btn" onClick={() => navigateMonth("next")}>›</button>
        </div>

        <div className="calendar-weekdays">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="weekday">{d}</div>)}
        </div>

        <div className="calendar-grid">{days}</div>

        <div className="calendar-legend">
          <div className="legend-item"><div className="legend-color present"></div><span>Present</span></div>
          <div className="legend-item"><div className="legend-color absent"></div><span>Absent</span></div>
          <div className="legend-item"><div className="legend-color today"></div><span>Today</span></div>
        </div>
      </div>
    );
  };

  const subjects = [...new Set(timetable.map((t) => t.subject))];

  return (
    <div className="attendance-container">
      <div className="top-row">
        <button className="back-arrow-btn" onClick={onBack}>←</button>
        <h2 className="attendance-title">📋 Attendance Tracker</h2>
        {loading && <div className="loading-pill">Syncing…</div>}
      </div>

      {globalMessage && (
        <div className={`global-message ${globalMessage.type}`}>{globalMessage.text}</div>
      )}

      <div className="upload-section">
        <h3>Target Attendance Percentage</h3>
        <div className="target-input">
          <input type="number" min="0" max="100" value={targetAttendance} onChange={(e) => setTargetAttendance(parseInt(e.target.value, 10) || 75)} className="target-slider" />
          <span className="target-label">%</span>
        </div>

        <h3>Enter All Your Subjects</h3>
        <div className="manual-input">
          <input type="text" placeholder="Type subject name and press Enter to add" value={manualSubject} onChange={(e) => setManualSubject(e.target.value)} onKeyPress={handleKeyPress} className="subject-input" />
          <button className="btn btn-add" onClick={addManualEntry}>Add Subject</button>
        </div>
        <p className="subject-info">Type a subject to start tracking. You can mark attendance after adding a subject.</p>

        {timetable.length > 0 && (
          <div className="timetable-display">
            <div className="timetable-header">
              <h4>Your Subjects ({timetable.length})</h4>
              <button className="btn-toggle" onClick={() => setShowTimetable(!showTimetable)}>{showTimetable ? "Hide Subjects" : "Show Subjects"}</button>
            </div>

            {showTimetable && (
              <div className="subjects-list">
                {subjects.map((subject) => (
                  <div key={subject} className="subject-item">
                    <span className="subject-name">{subject}</span>
                    <button className="btn-remove" onClick={() => removeTimetableEntry("General", subject)} title="Remove subject">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calendar */}
      {subjects.length > 0 && (
        <div className="calendar-section">
          <h3>📅 Attendance Calendar</h3>
          <div className="calendar-subject-selector">
            <label htmlFor="calendar-subject">Select Subject:</label>
            <select id="calendar-subject" value={selectedSubjectForCalendar} onChange={(e) => setSelectedSubjectForCalendar(e.target.value)} className="calendar-subject-select">
              <option value="">Choose a subject...</option>
              {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </div>
          {selectedSubjectForCalendar && renderCalendar()}
        </div>
      )}

      {/* Subjects Grid */}
      <div className="subjects-grid">
        {subjects.length === 0 ? (
          <p className="no-classes-text">No subjects added yet. Add subjects above to start tracking attendance.</p>
        ) : (
          subjects.map((subject) => {
            const stat = calcStats(subject);
            const scheduledSessions = sessions.filter((s) => s.subject === subject && s.status === "scheduled").sort((a,b) => new Date(b.date) - new Date(a.date));
            const extraSessions = sessions.filter((s) => s.subject === subject && s.status === "extra").sort((a,b) => new Date(b.date) - new Date(a.date));

            return (
              <div key={subject} className="subject-card">
                <h3 className="subject-title">{subject}</h3>
                <div className="stats-overview">
                  <p className={`percentage ${stat.percentage >= targetAttendance ? "good" : "warning"}`}>Attendance: {stat.percentage.toFixed(1)}%</p>
                  <p className="total-classes">Total Classes: {stat.total}</p>
                  {stat.extra > 0 && <p className="extra-classes">Extra Classes: {stat.extra} (Present: {stat.extraAttended}, Absent: {stat.extraAbsent})</p>}
                </div>

                <div className="attendance-buttons-main">
                  <h4>Mark Attendance</h4>
                  <input type="date" value={selectedDates[subject] || getLocalDateString()} onChange={(e) => setSelectedDates((prev) => ({ ...prev, [subject]: e.target.value }))} />
                  <div className="main-attendance-buttons">
                    <button className="btn-present" onClick={() => markAttendance(subject, selectedDates[subject] || getLocalDateString(), "present", "scheduled")}>Present</button>
                    <button className="btn-absent" onClick={() => markAttendance(subject, selectedDates[subject] || getLocalDateString(), "absent", "scheduled")}>Absent</button>
                    <button className="btn-extra" onClick={() => setShowExtraOptions((p) => ({ ...p, [subject]: !p[subject] }))}>Extra Class</button>
                  </div>
                </div>

                {/* Scheduled History */}
                {scheduledSessions.length > 0 && (
                  <div className="scheduled-history">
                    <h5>Scheduled History</h5>
                    {scheduledSessions.slice(0, scheduledShowMore[subject] ? undefined : 3).map((s) => (
                      <div key={s.id} className="session-item">
                        <span>{s.date}</span>
                        <span className={s.attendance}>{s.attendance}</span>
                        <button onClick={() => deleteSession(s)}>🗑️</button>
                      </div>
                    ))}
                    {scheduledSessions.length > 3 && <button className="btn-show-more" onClick={() => setScheduledShowMore((prev) => ({ ...prev, [subject]: !prev[subject] }))}>{scheduledShowMore[subject] ? "Show Less" : "Show More"}</button>}
                  </div>
                )}

                {/* Extra History */}
                {extraSessions.length > 0 && (
                  <div className="extra-history">
                    <h5>Extra Class History</h5>
                    {extraSessions.slice(0, extraShowMore[subject] ? undefined : 3).map((s) => (
                      <div key={s.id} className="extra-session-item">
                        <span>{s.date}</span>
                        <span className={s.attendance}>{s.attendance}</span>
                        <button onClick={() => deleteSession(s)}>🗑️</button>
                      </div>
                    ))}
                    {extraSessions.length > 3 && <button className="btn-show-more" onClick={() => setExtraShowMore((prev) => ({ ...prev, [subject]: !prev[subject] }))}>{extraShowMore[subject] ? "Show Less" : "Show More"}</button>}
                  </div>
                )}

                {/* Extra Options */}
                {showExtraOptions[subject] && (
                  <div className="extra-options">
                    <button className="btn-present-small" onClick={() => markAttendance(subject, selectedDates[subject] || getLocalDateString(), "present", "extra")}>Extra Present</button>
                    <button className="btn-absent-small" onClick={() => markAttendance(subject, selectedDates[subject] || getLocalDateString(), "absent", "extra")}>Extra Absent</button>
                    <button className="btn-close-extra" onClick={() => setShowExtraOptions((p) => ({ ...p, [subject]: false }))}>✕ Close</button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default AttendanceTracker;
