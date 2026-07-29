"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  listLecturerCourses, getCourseRoster, createLecturerResult, updateLecturerResult,
  Course, RosterEntry,
} from "@/lib/api";

interface RowState {
  score: string;
  is_published: boolean;
  saving: boolean;
  saved: boolean;
}

export default function ResultsEntryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [error, setError] = useState("");

  const canManage = user?.is_superuser || user?.role === "lecturer" || user?.role === "admin";

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (!authLoading && user && !canManage) router.push("/dashboard");
  }, [authLoading, user, canManage, router]);

  useEffect(() => {
    if (!canManage) return;
    listLecturerCourses()
      .then(setCourses)
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load courses."))
      .finally(() => setLoadingCourses(false));
  }, [canManage]);

  const loadRoster = useCallback((id: string) => {
    if (!id) return;
    setLoadingRoster(true);
    setError("");
    getCourseRoster(id)
      .then((data) => {
        setRoster(data);
        const initial: Record<string, RowState> = {};
        for (const r of data) {
          initial[r.student_id] = {
            score: r.score ?? "",
            is_published: r.is_published,
            saving: false,
            saved: false,
          };
        }
        setRows(initial);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load the class list."))
      .finally(() => setLoadingRoster(false));
  }, []);

  function handleCourseChange(id: string) {
    setCourseId(id);
    setRoster([]);
    setRows({});
    loadRoster(id);
  }

  function updateRow(studentId: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch, saved: false } }));
  }

  async function handleSaveRow(entry: RosterEntry) {
    const row = rows[entry.student_id];
    if (!row) return;
    const scoreNum = row.score === "" ? null : Number(row.score);
    if (row.score !== "" && (Number.isNaN(scoreNum) || scoreNum! < 0 || scoreNum! > 100)) {
      setError(`Enter a valid score (0–100) for ${entry.student_name}.`);
      return;
    }
    updateRow(entry.student_id, { saving: true });
    setError("");
    try {
      if (entry.result_id) {
        await updateLecturerResult(entry.result_id, { score: scoreNum ?? undefined, is_published: row.is_published });
      } else {
        if (scoreNum === null) {
          setError(`Enter a score for ${entry.student_name} before saving.`);
          updateRow(entry.student_id, { saving: false });
          return;
        }
        await createLecturerResult({
          student: entry.student_id, course: courseId, score: scoreNum, is_published: row.is_published,
        });
      }
      updateRow(entry.student_id, { saving: false, saved: true });
      loadRoster(courseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Couldn't save the result for ${entry.student_name}.`);
      updateRow(entry.student_id, { saving: false });
    }
  }

  if (authLoading || !user || !canManage) {
    return <p className="text-sm text-ink-secondary">Loading…</p>;
  }

  return (
    <div className="max-w-3xl">
      <p className="eyebrow mb-3">Academics</p>
      <h1 className="font-display text-3xl mb-1">Enter results</h1>
      <p className="text-sm text-ink-secondary mb-8">
        {user.role === "admin"
          ? "Upload or update grades for any course in your institute."
          : "Upload or update grades for the courses you teach."}
      </p>

      {error && (
        <p className="text-sm text-alert-600 card px-4 py-3 border-alert-200 mb-6">{error}</p>
      )}

      <div className="mb-8">
        <label className="field-label">Course</label>
        <select
          value={courseId}
          onChange={(e) => handleCourseChange(e.target.value)}
          className="field-input"
          disabled={loadingCourses}
        >
          <option value="">{loadingCourses ? "Loading courses…" : "Select a course"}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title} ({c.academic_year}, {c.semester === "first" ? "1st" : "2nd"} semester)
            </option>
          ))}
        </select>
        {!loadingCourses && courses.length === 0 && (
          <p className="text-xs text-ink-muted mt-2">
            {user.role === "admin"
              ? "No courses found for your institute yet."
              : "No courses are assigned to you yet."}
          </p>
        )}
      </div>

      {loadingRoster && <p className="text-sm text-ink-secondary">Loading class list…</p>}

      {!loadingRoster && courseId && roster.length === 0 && (
        <p className="text-sm text-ink-muted card px-5 py-8 text-center">
          No students are registered on this course yet.
        </p>
      )}

      {!loadingRoster && roster.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted border-b border-[color:var(--border)]">
                <th className="py-2.5 px-4">Student</th>
                <th className="px-4">ID</th>
                <th className="px-4">Score</th>
                <th className="px-4">Grade</th>
                <th className="px-4">Published</th>
                <th className="px-4"></th>
              </tr>
            </thead>
            <tbody>
              {roster.map((entry) => {
                const row = rows[entry.student_id];
                if (!row) return null;
                return (
                  <tr key={entry.student_id} className="border-b border-[color:var(--border)] last:border-0">
                    <td className="py-2.5 px-4">
                      <p className="font-medium">{entry.student_name}</p>
                      <p className="text-xs text-ink-muted">{entry.student_email}</p>
                    </td>
                    <td className="px-4 font-mono text-xs">{entry.student_staff_id || "—"}</td>
                    <td className="px-4">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={row.score}
                        onChange={(e) => updateRow(entry.student_id, { score: e.target.value })}
                        className="field-input w-20"
                      />
                    </td>
                    <td className="px-4 font-mono">{entry.grade || "—"}</td>
                    <td className="px-4">
                      <input
                        type="checkbox"
                        checked={row.is_published}
                        onChange={(e) => updateRow(entry.student_id, { is_published: e.target.checked })}
                      />
                    </td>
                    <td className="px-4">
                      <button
                        onClick={() => handleSaveRow(entry)}
                        disabled={row.saving}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        {row.saving ? "Saving…" : row.saved ? "Saved ✓" : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {roster.length > 0 && (
        <p className="text-xs text-ink-muted mt-4">
          A score is only visible to the student once &ldquo;Published&rdquo; is checked and saved.
        </p>
      )}
    </div>
  );
}
