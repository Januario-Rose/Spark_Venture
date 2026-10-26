
import { NavLink, Link } from "react-router-dom";
import navLogo from "../assets/nav-logo.png";

const links = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img
            src={navLogo}
            alt="Spark-Venture"
            className="h-9 w-auto object-contain"
          />
        </Link>

        {/* Main navigation */}
        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? "text-blue-700"
                    : "text-slate-600 hover:text-blue-600"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Authentication actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 sm:px-5"
          >
            Sign in
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:px-5"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
