
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  LogOut,
  UserRound,
  ChevronDown,
  Building2,
  LoaderCircle,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function Header() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Get the logged-in user and their business profile.
  useEffect(() => {
    let active = true;

    const loadUserAndBusiness = async (currentUser) => {
      if (!active) return;

      setUser(currentUser);

      if (!currentUser) {
        setBusiness(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("business_profiles")
        .select("business_name, logo_url, email")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Could not load business profile:", error.message);
      }

      setBusiness(data || null);
      setLoading(false);
    };

    const initialize = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      if (error) {
        console.error("Could not load authenticated user:", error.message);
        setLoading(false);
        return;
      }

      await loadUserAndBusiness(data.user);
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      const currentUser = session?.user ?? null;

      // Defer the database request until the auth callback finishes.
      Promise.resolve().then(() => {
        if (active) loadUserAndBusiness(currentUser);
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Supabase Auth metadata, commonly populated by Google OAuth.
  const metadata = user?.user_metadata || {};

  const profileImage =
    metadata.avatar_url ||
    metadata.picture ||
    metadata.photoURL ||
    "";

  const userName =
    metadata.full_name ||
    metadata.name ||
    user?.email?.split("@")[0] ||
    "Account";

  const companyName = business?.business_name || "Your Business";

  // Sign out and return to the public landing page.
  const handleSignOut = async () => {
    setSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out failed:", error.message);
      setSigningOut(false);
      return;
    }

    setUser(null);
    setBusiness(null);
    navigate("/", { replace: true });
  };

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8 bg-transparent">
      {/* Left side: company identity and welcome message */}
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {/* Company logo or default building icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {business?.logo_url ? (
            <img
              src={business.logo_url}
              alt={`${companyName} logo`}
              className="h-full w-full object-fit"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <Building2 className="h-6 w-6 text-blue-600" />
          )}
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg">
            {loading ? "Loading business..." : companyName}
          </h1>

          <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
            Welcome back, {userName}
          </p>
        </div>
      </div>

      {/* Right side: notifications and account menu */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm transition hover:bg-gray-50"
        >
          <Bell className="h-5 w-5 text-gray-600" />
        </button>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen((open) => !open)}
            aria-expanded={isProfileOpen}
            aria-label="Open account menu"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 pr-2.5 shadow-sm transition hover:bg-gray-50"
          >
            {/* Auth profile picture or default icon */}
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue-100">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Your profile"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <UserRound className="h-5 w-5 text-blue-600" />
              )}
            </div>

            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isProfileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isProfileOpen && (
            <>
              {/* Close menu when clicking outside */}
              <button
                type="button"
                aria-label="Close account menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setIsProfileOpen(false)}
              />

              <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
                {/* Account details */}
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {userName}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {user?.email || ""}
                  </p>
                  <p className="mt-2 truncate text-xs font-medium text-blue-600">
                    {companyName}
                  </p>
                </div>

                {/* Business profile */}
                <Link
                    to="/business-profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50"
                    >
                    <Building2 className="h-4 w-4" />
                    View Business Profile
                </Link>

                {/* Sign out */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {signingOut ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
