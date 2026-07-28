import Link from "next/link";
import InstituteConstellation from "./InstituteConstellation";

export default function Footer() {
  return (
    <footer className="bg-masthead text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 mb-10">
          <div className="max-w-sm">
            <p className="font-display text-lg mb-2">PAU Scholars Hub</p>
            <p className="text-sm text-white/55 leading-relaxed">
              Connecting African scholars. Advancing African knowledge. The
              official research, publishing, and academic network of the
              Pan African University.
            </p>
          </div>
          <nav className="flex gap-10 text-sm">
            <div className="flex flex-col gap-2.5">
              <span className="eyebrow text-gold-400">Platform</span>
              <Link href="/repository" className="text-white/70 hover:text-white">Repository</Link>
              <Link href="/submit" className="text-white/70 hover:text-white">Submit research</Link>
              <Link href="/dashboard" className="text-white/70 hover:text-white">Dashboard</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="eyebrow text-gold-400">Account</span>
              <Link href="/login" className="text-white/70 hover:text-white">Sign in</Link>
            </div>
          </nav>
        </div>

        <div className="pt-8 border-t border-white/10">
          <p className="eyebrow text-gold-400 mb-4">Five institutes, one network</p>
          <InstituteConstellation dark />
        </div>

        <p className="text-[11px] text-white/35 mt-10 font-mono">
          © {new Date().getFullYear()} PAU SCHOLARS HUB — PAN AFRICAN UNIVERSITY
        </p>
      </div>
    </footer>
  );
}
