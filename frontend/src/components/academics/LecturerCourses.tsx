"use client";
import { useEffect, useState, useCallback } from "react";
import {
  listLecturerCourses, getCourseRoster, createLecturerResult, updateLecturerResult,
  listCourseMaterials, uploadCourseMaterial, deleteCourseMaterial,
  Course, RosterEntry, CourseMaterial,
} from "@/lib/api";

export default function LecturerCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listLecturerCourses()
      .then((c) => {
        setCourses(c);
        if (c.length > 0) setSelectedId(c[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load your courses"))
      .finally(() => setLoadingCourses(false));
  }, []);

  const selected = courses.find((c) => c.id === selectedId) || null;

  if (loadingCourses) return <p className="text-sm text-ink-secondary">Loading…</p>;
  if (error) return <p className="text-sm text-alert-600">{error}</p>;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {courses.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`text-sm px-3.5 py-2 rounded-lg border transition-colors ${
              c.id === selectedId
                ? "bg-primary-500 text-white border-primary-500"
                : "bg-white text-ink-primary border-[color:var(--border-strong)] hover:bg-surface-1"
            }`}
          >
            {c.code}
          </button>
        ))}
        {courses.length === 0 && (
          <p className="text-sm text-ink-muted">You&rsquo;re not assigned to any courses yet.</p>
        )}
      </div>

      {selected && <CoursePanel course={selected} />}
    </div>
  );
}

function CoursePanel({ course }: { course: Course }) {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [r, m] = await Promise.all([
        getCourseRoster(course.id),
        listCourseMaterials(course.id),
      ]);
      setRoster(r);
      setMaterials(m);
      setScores(Object.fromEntries(r.map((row) => [row.student_id, row.score ?? ""])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the course roster");
    } finally {
      setLoading(false);
    }
  }, [course.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(row: RosterEntry, publish: boolean) {
    const scoreStr = scores[row.student_id];
    if (scoreStr === "" || scoreStr === undefined) return;
    const score = Number(scoreStr);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setError("Score must be a number between 0 and 100.");
      return;
    }
    setSavingId(row.student_id);
    setError("");
    try {
      if (row.result_id) {
        await updateLecturerResult(row.result_id, { score, is_published: publish });
      } else {
        await createLecturerResult({
          student: row.student_id, course: course.id, score, is_published: publish,
        });
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the score");
    } finally {
      setSavingId(null);
    }
  }

  const [materialTitle, setMaterialTitle] = useState("");
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!materialFile || !materialTitle) return;
    setUploading(true);
    setError("");
    try {
      await uploadCourseMaterial({ course: course.id, title: materialTitle, file: materialFile });
      setMaterialTitle("");
      setMaterialFile(null);
      const m = await listCourseMaterials(course.id);
      setMaterials(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteMaterial(id: string) {
    try {
      await deleteCourseMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete the material");
    }
  }

  if (loading) return <p className="text-sm text-ink-secondary">Loading roster…</p>;

  return (
    <div>
      {error && <p className="text-sm text-alert-600 mb-4">{error}</p>}

      <p className="eyebrow mb-3">Class roster — {course.code}</p>
      <div className="card overflow-x-auto mb-10">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-xs text-ink-muted border-b border-[color:var(--border)]">
              <th className="font-medium p-3">Student</th>
              <th className="font-medium p-3">Score</th>
              <th className="font-medium p-3">Grade</th>
              <th className="font-medium p-3">Published</th>
              <th className="font-medium p-3" />
            </tr>
          </thead>
          <tbody>
            {roster.map((row) => (
              <tr key={row.registration_id} className="border-b border-[color:var(--border)] last:border-0">
                <td className="p-3">
                  <p className="font-medium">{row.student_name}</p>
                  <p className="font-mono text-xs text-ink-muted">{row.student_staff_id}</p>
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={scores[row.student_id] ?? ""}
                    onChange={(e) =>
                      setScores((prev) => ({ ...prev, [row.student_id]: e.target.value }))
                    }
                    className="field-input w-20 py-1.5"
                  />
                </td>
                <td className="p-3 text-ink-secondary">{row.grade || "—"}</td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-md font-medium ${
                      row.is_published ? "bg-secondary-100 text-secondary-800" : "bg-surface-1 text-ink-secondary"
                    }`}
                  >
                    {row.is_published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <button
                    onClick={() => handleSave(row, false)}
                    disabled={savingId === row.student_id}
                    className="btn-secondary py-1.5 px-3 text-xs mr-2"
                  >
                    Save draft
                  </button>
                  <button
                    onClick={() => handleSave(row, true)}
                    disabled={savingId === row.student_id}
                    className="btn-primary py-1.5 px-3 text-xs"
                  >
                    {savingId === row.student_id ? "Saving…" : "Publish"}
                  </button>
                </td>
              </tr>
            ))}
            {roster.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-ink-muted">
                  No students registered for this course yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="eyebrow mb-3">Course materials</p>
      <form onSubmit={handleUpload} className="card p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-end mb-5">
        <div className="flex-1 w-full">
          <label className="field-label">Title</label>
          <input
            value={materialTitle}
            onChange={(e) => setMaterialTitle(e.target.value)}
            className="field-input"
            placeholder="e.g. Week 3 lecture notes"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="field-label">File</label>
          <input
            type="file"
            onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
            className="field-input py-2"
          />
        </div>
        <button className="btn-primary shrink-0" disabled={uploading || !materialFile || !materialTitle}>
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </form>

      <div className="space-y-2">
        {materials.map((m) => (
          <div key={m.id} className="card px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <a
                href={m.file}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary-600 hover:underline"
              >
                {m.title}
              </a>
              <p className="font-mono text-xs text-ink-muted mt-1">
                {m.uploaded_by_name} · {new Date(m.uploaded_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => handleDeleteMaterial(m.id)}
              className="text-xs text-alert-600 hover:underline shrink-0"
            >
              Delete
            </button>
          </div>
        ))}
        {materials.length === 0 && (
          <p className="text-sm text-ink-muted card px-5 py-6 text-center">
            No materials uploaded for this course yet.
          </p>
        )}
      </div>
    </div>
  );
}
