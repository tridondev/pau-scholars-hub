"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { updateMe, updateAcademicProfile, uploadProfileFile, getInstitutes, Institute } from "@/lib/api";
import Avatar from "@/components/Avatar";

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"image" | "cv" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [institutes, setInstitutes] = useState<Institute[]>([]);

  // User fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [institute, setInstitute] = useState("");
  const [studentStaffId, setStudentStaffId] = useState("");
  const [country, setCountry] = useState("");
  const [orcidId, setOrcidId] = useState("");

  // Academic profile fields
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [programme, setProgramme] = useState("");
  const [biography, setBiography] = useState("");
  const [researchInterests, setResearchInterests] = useState("");
  const [scholarUrl, setScholarUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    getInstitutes().then((data) => setInstitutes(Array.isArray(data) ? data : data.results)).catch(() => {});
  }, []);

  function startEditing() {
    if (!user) return;
    setFirstName(user.first_name || "");
    setLastName(user.last_name || "");
    setInstitute(user.institute?.id || "");
    setStudentStaffId(user.student_staff_id || "");
    setCountry(user.country || "");
    setOrcidId(user.orcid_id || "");
    setFaculty(user.profile?.faculty || "");
    setDepartment(user.profile?.department || "");
    setProgramme(user.profile?.programme || "");
    setBiography(user.profile?.biography || "");
    setResearchInterests((user.profile?.research_interests || []).join(", "));
    setScholarUrl(user.profile?.google_scholar_url || "");
    setLinkedinUrl(user.profile?.linkedin_url || "");
    setError("");
    setNotice("");
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      await updateMe({
        first_name: firstName,
        last_name: lastName,
        institute: institute || null,
        student_staff_id: studentStaffId,
        country,
        orcid_id: orcidId,
      });
      if (user.profile?.id) {
        await updateAcademicProfile(user.profile.id, {
          faculty, department, programme, biography,
          research_interests: researchInterests.split(",").map((s) => s.trim()).filter(Boolean),
          google_scholar_url: scholarUrl,
          linkedin_url: linkedinUrl,
        });
      }
      await refresh();
      setEditing(false);
      setNotice("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(field: "profile_image" | "cv_file", e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.profile?.id) return;
    const maxKb = field === "profile_image" ? 2048 : 5120; // 2MB image, 5MB CV
    if (file.size / 1024 > maxKb) {
      setError(`File too large — max ${maxKb / 1024}MB.`);
      e.target.value = "";
      return;
    }
    setUploading(field === "profile_image" ? "image" : "cv");
    setError("");
    try {
      await uploadProfileFile(user.profile.id, field, file);
      await refresh();
      setNotice(field === "profile_image" ? "Profile photo updated." : "CV updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload file.");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  }

  if (loading) return <p className="text-sm text-ink-secondary">Loading…</p>;
  if (!user) return null;

  return (
    <div className="max-w-xl">
      <p className="eyebrow mb-3">Your profile</p>
      <div className="flex items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar user={user} size={56} fallbackClassName="text-gold-700 bg-gold-50 text-lg" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl truncate">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-sm text-ink-secondary truncate">{user.email}</p>
          </div>
        </div>
        {!editing && (
          <button onClick={startEditing} className="btn-secondary shrink-0">Edit profile</button>
        )}
      </div>

      {notice && <p className="text-sm text-secondary-700 mb-4">{notice}</p>}

      {!editing ? (
        <>
          <div className="card divide-y divide-[color:var(--border)]">
            <Row label="Role" value={user.role} />
            <Row label="Institute" value={user.institute?.name || "Not set"} />
            <Row label="Student/Staff ID" value={user.student_staff_id || "Not set"} />
            <Row label="Country" value={user.country || "Not set"} />
            <Row label="ORCID" value={user.orcid_id || "Not linked"} />
            <Row label="Faculty" value={user.profile?.faculty || "Not set"} />
            <Row label="Department" value={user.profile?.department || "Not set"} />
            <Row label="Programme" value={user.profile?.programme || "Not set"} />
            <Row label="Google Scholar" value={user.profile?.google_scholar_url || "Not set"} />
            <Row label="LinkedIn" value={user.profile?.linkedin_url || "Not set"} />
          </div>

          {user.profile?.research_interests && user.profile.research_interests.length > 0 && (
            <div className="mt-8">
              <p className="eyebrow mb-2">Research interests</p>
              <p className="text-sm text-ink-secondary">{user.profile.research_interests.join(", ")}</p>
            </div>
          )}

          {user.profile?.biography && (
            <div className="mt-8">
              <p className="eyebrow mb-2">Biography</p>
              <p className="text-sm text-ink-secondary leading-relaxed">{user.profile.biography}</p>
            </div>
          )}
          {user.profile?.cv_file && (
            <div className="mt-8">
              <p className="eyebrow mb-2">CV</p>
              <a href={user.profile.cv_file} target="_blank" rel="noreferrer" className="text-sm text-primary-600 underline">
                View uploaded CV
              </a>
            </div>
          )}
        </>
      ) : (
        <form onSubmit={handleSave} className="card p-6 sm:p-8 space-y-6">
          <p className="text-xs text-ink-muted -mt-2">
            Role is set by your institution&rsquo;s administrators and can&rsquo;t be changed here.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">First name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="field-input" />
            </div>
            <div>
              <label className="field-label">Last name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="field-input" />
            </div>
          </div>

          <div>
            <label className="field-label">Institute</label>
            <select value={institute} onChange={(e) => setInstitute(e.target.value)} className="field-input">
              <option value="">Not set</option>
              {institutes.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.acronym} — {inst.name}</option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Student/Staff ID</label>
              <input value={studentStaffId} onChange={(e) => setStudentStaffId(e.target.value)} className="field-input" />
            </div>
            <div>
              <label className="field-label">Country</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} className="field-input" />
            </div>
          </div>

          <div>
            <label className="field-label">ORCID iD</label>
            <input value={orcidId} onChange={(e) => setOrcidId(e.target.value)} className="field-input" placeholder="0000-0000-0000-0000" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Faculty</label>
              <input value={faculty} onChange={(e) => setFaculty(e.target.value)} className="field-input" />
            </div>
            <div>
              <label className="field-label">Department</label>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} className="field-input" />
            </div>
          </div>

          <div>
            <label className="field-label">Programme</label>
            <input value={programme} onChange={(e) => setProgramme(e.target.value)} className="field-input" />
          </div>

          <div>
            <label className="field-label">Research interests</label>
            <input
              value={researchInterests} onChange={(e) => setResearchInterests(e.target.value)}
              className="field-input" placeholder="Separate with commas"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Google Scholar URL</label>
              <input value={scholarUrl} onChange={(e) => setScholarUrl(e.target.value)} className="field-input" />
            </div>
            <div>
              <label className="field-label">LinkedIn URL</label>
              <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="field-input" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Profile photo</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload("profile_image", e)} className="field-input" disabled={uploading !== null} />
              <p className="text-xs text-ink-muted mt-1">Max 2MB (JPG, PNG)</p>
              {uploading === "image" && <p className="text-xs text-ink-muted mt-1">Uploading…</p>}
            </div>
            <div>
              <label className="field-label">CV (PDF)</label>
              <input type="file" accept=".pdf" onChange={(e) => handleFileUpload("cv_file", e)} className="field-input" disabled={uploading !== null} />
              {uploading === "cv" && <p className="text-xs text-ink-muted mt-1">Uploading…</p>}
            </div>
          </div>

          <div>
            <label className="field-label">Biography</label>
            <textarea value={biography} onChange={(e) => setBiography(e.target.value)} rows={5} className="field-input resize-y" />
          </div>

          {error && <p className="text-sm text-alert-600">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-ink-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-5 py-3.5 text-sm gap-4">
      <span className="text-ink-secondary shrink-0">{label}</span>
      <span className="font-medium text-right break-words">{value}</span>
    </div>
  );
}
