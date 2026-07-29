"use client";
import { useEffect, useState, useCallback } from "react";
import {
  listCourses, listMyRegistrations, registerForCourse, dropRegistration,
  Course, CourseRegistration as Registration,
} from "@/lib/api";

export default function CourseRegistration() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (s = "") => {
    setLoading(true);
    setError("");
    try {
      const [c, r] = await Promise.all([
        listCourses({ open: true, search: s || undefined }),
        listMyRegistrations(),
      ]);
      setCourses(c);
      setRegistrations(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeByCourseId = new Map<string, Registration>(
    registrations
      .filter((r) => r.status === "registered")
      .map((r) => [r.course, r])
  );

  async function handleRegister(courseId: string) {
    setBusyId(courseId);
    setError("");
    try {
      await registerForCourse(courseId);
      await load(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDrop(registrationId: string) {
    setBusyId(registrationId);
    setError("");
    try {
      await dropRegistration(registrationId);
      await load(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't drop the course");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(search)}
          onBlur={() => load(search)}
          className="field-input max-w-sm"
          placeholder="Search by course code or title"
        />
      </div>

      {error && <p className="text-sm text-alert-600 mb-4">{error}</p>}
      {loading && <p className="text-sm text-ink-secondary">Loading courses…</p>}

      {!loading && (
        <div className="space-y-3">
          {courses.map((c) => {
            const reg = activeByCourseId.get(c.id);
            const isBusy = busyId === c.id || (reg && busyId === reg.id);
            return (
              <div
                key={c.id}
                className="card px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {c.code} — {c.title}
                  </p>
                  <p className="font-mono text-xs text-ink-muted mt-1">
                    {c.credit_units} units · {c.lecturer_name || "Lecturer TBA"} ·{" "}
                    {c.academic_year} · {c.semester === "first" ? "First semester" : "Second semester"}
                  </p>
                </div>
                <div className="shrink-0">
                  {reg ? (
                    <button
                      onClick={() => handleDrop(reg.id)}
                      disabled={!!isBusy}
                      className="btn-secondary text-alert-600 border-alert-200"
                    >
                      {isBusy ? "Dropping…" : "Drop"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(c.id)}
                      disabled={!!isBusy}
                      className="btn-primary"
                    >
                      {isBusy ? "Registering…" : "Register"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {courses.length === 0 && (
            <p className="text-sm text-ink-muted card px-5 py-8 text-center">
              No courses match your search right now.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
