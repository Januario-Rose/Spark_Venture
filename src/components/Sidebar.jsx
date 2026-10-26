import navLogo from "../assets/nav-logo.png";
import {useState} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Briefcase,
  BookOpen,
  Target,
  Banknote,
  Link2,
  FileText,
  Bell,
  Settings,
  Menu,
  X,
  Library,
  LogOut,
  LoaderCircle,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const BusinessSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", icon: Home, href: "/dashboard" },
    { name: "My Business", icon: Briefcase, href: "/dashboard/my-business" },
    { name: "Bookkeeping", icon: BookOpen, href: "/dashboard/bookkeeping" },
    { name: "Opportunities", icon: Target, href: "/dashboard/opportunities" },
    { name: "Funding", icon: Banknote, href: "/dashboard/funding" },
    { name: "Market", icon: Link2, href: "/dashboard/market" },
    { name: "Documents", icon: FileText, href: "/dashboard/documents" },
    { name: "Resources", icon: Library, href: "/dashboard/resources" },
    { name: "Notifications", icon: Bell, href: "/dashboard/notifications", badge: 3 },
    { name: "Settings", icon: Settings, href: "/settings" },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout failed:", error.message);
        alert("Unable to log out. Please try again.");
        return;
      }

      setIsOpen(false);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      alert("Something went wrong while logging out.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (href) => {
  if (href === "/dashboard") {
    return location.pathname === "/dashboard";
  }

  return (
    location.pathname === href ||
    location.pathname.startsWith(`${href}/`)
  );
};
  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 rounded-lg border border-gray-200 bg-white p-2 shadow-md lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6 text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-gray-100 bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:z-30 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5">
          <Link
            to="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex shrink-0 items-center gap-2"
          >
            <img
              src={navLogo}
              alt="SparkVenture"
              className="h-9 w-auto object-contain"
            />
          </Link>

          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1 hover:bg-gray-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
  const Icon = item.icon;

  const isDashboard = item.href === "/dashboard";

  const isCurrentPage =
    location.pathname === item.href ||
    location.pathname.startsWith(`${item.href}/`);

  return (
    <Link
      key={item.name}
      to={item.href}
      onClick={() => {
        setIsOpen(false);
        window.scrollTo(0, 0);
      }}
      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
        isDashboard
          ? "bg-blue-700 text-white shadow-sm"
          : isCurrentPage
            ? "bg-blue-100 text-blue-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />

      <span className="flex-1">{item.name}</span>

      {item.badge && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            isDashboard
              ? "bg-white text-blue-700"
              : isCurrentPage
                ? "bg-blue-200 text-blue-800"
                : "bg-red-500 text-white"
          }`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
})}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            {isLoggingOut ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}

            <span>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default BusinessSidebar;