"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import InstituteConstellation from "@/components/InstituteConstellation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
            &ldquo;A single, continental record of African scholarship.&rdquo;
          </p>
          <p className="text-sm text-white/50 max-w-sm leading-relaxed">
            Sign in to submit research, track review status, and manage
            your academic profile across any of PAU&rsquo;s five institutes.
          </p>
        </div>
        <InstituteConstellation dark />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-14 sm:py-20">
        <div className="w-full max-w-sm">
          <p className="eyebrow mb-3 lg:hidden">PAU Scholars Hub</p>
          <h1 className="font-display text-2xl sm:text-3xl mb-1">Sign in</h1>
          <p className="text-sm text-ink-secondary mb-8">
            Use your institutional or personal academic email.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Email</label>
              <input
                type="email" placeholder="you@pau.edu" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input" required
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input" required
              />
            </div>
            {error && <p className="text-sm text-alert-600">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-ink-secondary mt-6">
            New here?{" "}
            <Link href="/signup" className="text-primary-600 font-medium underline">Create an account</Link>
          </p>

          <p className="text-xs text-ink-muted mt-4 leading-relaxed">
            Google and ORCID sign-in are wired on the backend — add the
            buttons here once client IDs are configured.
          </p>
        </div>
      </div>
    </div>
  );
}
