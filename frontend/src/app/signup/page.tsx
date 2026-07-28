"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register, getInstitutes, Institute } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import InstituteConstellation from "@/components/InstituteConstellation";

// Self-service roles only — reviewer / editor / admin are assigned
// internally by an institutional administrator, not chosen at signup.
const ROLES = [
  ["student", "Student"],
  ["researcher", "Researcher"],
  ["lecturer", "Lecturer / Supervisor"],
  ["alumni", "Alumni"],
];

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [instituteId, setInstituteId] = useState("");
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refresh } = useAuth();

  useEffect(() => {
    getInstitutes()
      .then((data) => setInstitutes(Array.isArray(data) ? data : data.results))
      .catch(() => setInstitutes([])); // fine if the list is empty in a fresh DB
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        username,
        password,
        role,
        institute: instituteId || null,
      });
      await refresh(); // pulls the new session into the shared auth context
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create your account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="-my-8 sm:-my-12 grid lg:grid-cols-2 min-h-[calc(100vh-8rem)]">
      {/* Editorial panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between bg-masthead-gradient text-white px-12 py-14 -ml-6">
        <p className="eyebrow text-gold-400">PAU Scholars Hub</p>
        <div>
          <p className="font-display italic text-3xl leading-snug max-w-sm mb-6">
            &ldquo;One account, five institutes, one continental record of
            your work.&rdquo;
          </p>
          <p className="text-sm text-white/50 max-w-sm leading-relaxed">
            Your profile follows you across every PAU institute — submissions,
            reviews, and publications all in one place.
          </p>
        </div>
        <InstituteConstellation dark />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-14 sm:py-20">
        <div className="w-full max-w-md">
          <p className="eyebrow mb-3 lg:hidden">PAU Scholars Hub</p>
          <h1 className="font-display text-2xl sm:text-3xl mb-1">Create your account</h1>
          <p className="text-sm text-ink-secondary mb-8">
            Free for every PAU student, researcher, and faculty member.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">First name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="field-input" required />
              </div>
              <div>
                <label className="field-label">Last name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="field-input" required />
              </div>
            </div>

            <div>
              <label className="field-label">Email</label>
              <input type="email" placeholder="you@pau.edu" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" required />
            </div>

            <div>
              <label className="field-label">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="field-input" required />
            </div>

            <div>
              <label className="field-label">Password</label>
              <input type="password" placeholder="At least 10 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="field-input" required minLength={10} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">I am a</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="field-input">
                  {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Institute</label>
                <select value={instituteId} onChange={(e) => setInstituteId(e.target.value)} className="field-input">
                  <option value="">Not listed yet</option>
                  {institutes.map((inst) => (
                    <option key={inst.id} value={inst.id}>{inst.acronym}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-alert-600">{error}</p>}

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-sm text-ink-secondary mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary-600 font-medium underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
