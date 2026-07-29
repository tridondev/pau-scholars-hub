"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Avatar from "@/components/Avatar";

const publicLinks = [{ href: "/repository", label: "Repository" }];
const memberLinks = [
  { href: "/repository", label: "Repository" },
  { href: "/submit", label: "Submit research" },
  { href: "/services", label: "Services" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => setOpen(false), [pathname]);

  function handleLogout() {
    logout();
    setOpen(false);
    router.push("/");
  }

  const links = user
    ? user.role === "reviewer"
      ? [...memberLinks, { href: "/reviews", label: "Reviews" }]
      : user.role === "editor" || user.role === "admin"
      ? [...memberLinks, { href: "/admin", label: "Admin" }]
      : memberLinks
    : publicLinks;

  if (user?.is_role_manager) {
    links.push({
      href: "/admin/roles",
      label: "Manage roles",
    });
  }

  if (user?.role === "lecturer" || user?.role === "admin" || user?.is_superuser) {
    links.push({
      href: "/results",
      label: "Enter results",
    });
  }

  if (user?.is_superuser) {
    links.push({
      href: "/admin/services",
      label: "Manage services",
    });
  }

  return (
    <header className="sticky top-0 z-30 bg-masthead text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <span className="bg-white rounded-md p-1 shrink-0 flex items-center justify-center">
            <Image
              src="/logos/pau-emblem-white.png"
              alt="Pan African University logo"
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
              priority
            />
          </span>
          <span className="truncate">
            <span className="block font-display text-base leading-tight">Scholars Hub</span>
            <span className="hidden sm:block text-[11px] text-white/50 font-mono tracking-wide leading-tight">
              PAN AFRICAN UNIVERSITY
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/80 hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
          {loading ? null : user ? (
            <>
              <Link href="/profile" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                <Avatar user={user} size={28} />
                {user.first_name || "Profile"}
              </Link>
              <button onClick={handleLogout} className="text-white/80 hover:text-white transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-white/80 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="bg-gold-400 text-gold-900 rounded-full px-4 py-1.5 text-sm font-medium hover:bg-gold-300 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block w-5 h-4">
            <span className={`absolute left-0 top-0 w-5 h-0.5 bg-white transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`absolute left-0 top-[7px] w-5 h-0.5 bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 top-[14px] w-5 h-0.5 bg-white transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </span>
        </button>
      </div>

      {/* thin gold rule, like the foot of a masthead */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />

      {/* Mobile nav panel */}
      {open && (
        <nav className="md:hidden border-t border-white/10 px-4 pb-4 flex flex-col gap-1 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="py-3 border-b border-white/10 text-white/85">
              {l.label}
            </Link>
          ))}
          {loading ? null : user ? (
            <>
              <Link href="/profile" className="py-3 border-b border-white/10 text-white/85 flex items-center gap-2">
                <Avatar user={user} size={24} />
                My profile ({user.first_name || user.email})
              </Link>
              <button onClick={handleLogout} className="py-3 text-left text-white/85">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="py-3 border-b border-white/10 text-white/85">Sign in</Link>
              <Link href="/signup" className="py-3 text-white/85">Get started</Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}