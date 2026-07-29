"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listAllServices, updateService, UniversityService } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ROLE_OPTIONS } from "@/lib/roles";

export default function AdminServicesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<UniversityService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !user.is_superuser)) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user?.is_superuser) return;
    listAllServices()
      .then((data) => setServices(Array.isArray(data) ? data : data.results))
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load services"))
      .finally(() => setLoading(false));
  }, [user]);

  async function toggleActive(s: UniversityService) {
    setSavingId(s.id);
    setError("");
    try {
      const updated = await updateService(s.id, { is_active: !s.is_active });
      setServices((prev) => prev.map((row) => (row.id === s.id ? updated : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update the service");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleRole(s: UniversityService, role: string) {
    const nextRoles = s.allowed_roles.includes(role)
      ? s.allowed_roles.filter((r) => r !== role)
      : [...s.allowed_roles, role];
    setSavingId(s.id);
    setError("");
    try {
      const updated = await updateService(s.id, { allowed_roles: nextRoles });
      setServices((prev) => prev.map((row) => (row.id === s.id ? updated : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update the service");
    } finally {
      setSavingId(null);
    }
  }

  if (authLoading || !user || !user.is_superuser) {
    return <p className="text-sm text-ink-secondary">Loading…</p>;
  }

  return (
    <div>
      <p className="eyebrow mb-3">Admin</p>
      <h1 className="font-display text-3xl mb-2">University services</h1>
      <p className="text-sm text-ink-secondary mb-8 max-w-xl">
        Turn services on or off, and control which roles can see each one.
      </p>

      {loading && <p className="text-sm text-ink-secondary">Loading…</p>}
      {error && <p className="text-sm text-alert-600 mb-4">{error}</p>}

      {!loading && (
        <div className="space-y-4">
          {services.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-ink-secondary mt-1">{s.description}</p>
                </div>
                <button
                  onClick={() => toggleActive(s)}
                  disabled={savingId === s.id}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    s.is_active
                      ? "bg-secondary-100 text-secondary-800"
                      : "bg-surface-1 text-ink-secondary"
                  }`}
                >
                  {s.is_active ? "Active" : "Inactive"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((r) => {
                  const on = s.allowed_roles.includes(r.value);
                  return (
                    <button
                      key={r.value}
                      onClick={() => toggleRole(s, r.value)}
                      disabled={savingId === s.id}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                        on
                          ? "bg-primary-500 text-white border-primary-500"
                          : "bg-white text-ink-secondary border-[color:var(--border-strong)] hover:bg-surface-1"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <p className="text-sm text-ink-muted card px-5 py-8 text-center">
              No services found. Run the <code>seed_university_services</code> management command.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
