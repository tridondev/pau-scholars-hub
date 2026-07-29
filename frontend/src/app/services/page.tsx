"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyServices, UniversityServiceLite } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ServicesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<UniversityServiceLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      getMyServices()
        .then((data) => setServices(Array.isArray(data) ? data : data.results))
        .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load services"))
        .finally(() => setLoading(false));
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <p className="text-sm text-ink-secondary">Loading…</p>;
  }

  return (
    <div>
      <p className="eyebrow mb-3">University services</p>
      <h1 className="font-display text-3xl mb-2">Your services</h1>
      <p className="text-sm text-ink-secondary mb-8 max-w-xl">
        The tools available to you as a {user.role}, in one place.
      </p>

      {loading && <p className="text-sm text-ink-secondary">Loading…</p>}
      {error && <p className="text-sm text-alert-600">{error}</p>}

      {!loading && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <Link
              key={s.key}
              href={`/services/${s.key}`}
              className="card p-5 flex flex-col hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <h3 className="font-display text-lg mb-1.5">{s.name}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed flex-1">{s.description}</p>
              <span className="text-sm font-medium text-primary-600 mt-4 inline-flex items-center gap-1">
                Open <span aria-hidden>&rarr;</span>
              </span>
            </Link>
          ))}
          {services.length === 0 && (
            <p className="text-sm text-ink-muted card px-5 py-8 text-center sm:col-span-2 lg:col-span-3">
              No services are available for your role yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
