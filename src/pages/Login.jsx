import Logo from "../assets/footer-logo.png";
import Logo2 from "../assets/nav-logo.png";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  TrendingUp,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async (event) => {
  event.preventDefault();

  setErrorMessage("");
  setSuccessMessage("");

  if (!email.trim() || !password) {
    setErrorMessage("Please enter your email and password.");
    return;
  }

  setLoading(true);

  try {
    // 1. Authenticate the user with Supabase.
    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      setErrorMessage(
        loginError.message === "Invalid login credentials"
          ? "Incorrect email or password. Please try again."
          : loginError.message
      );
      return;
    }

    // 2. Get the authenticated user's ID from the session.
    const user = data.user;

    if (!user) {
      setErrorMessage("Login succeeded, but no user session was returned.");
      return;
    }

    // 3. Look for a business profile belonging to this user.
    const { data: businessProfile, error: profileError } =
      await supabase
        .from("business_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (profileError) {
      setErrorMessage(
        "You are signed in, but we couldn't check your business profile. Please try again."
      );
      return;
    }

    // 4. Redirect based on whether a profile exists.
    setSuccessMessage("Login successful. Redirecting...");

    if (businessProfile) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/business-profile", { replace: true });
    }
  } catch (error) {
    setErrorMessage(
      "Something went wrong. Please check your connection and try again."
    );
  } finally {
    setLoading(false);
  }
};
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Left branding panel */}
      <section className="relative hidden min-h-screen overflow-hidden bg-[#07152f] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />

        <Link to="/" className="flex shrink-0 items-center gap-2">
            <img
            src={Logo}
            alt="Spark-Venture"
            className="h-20 w-auto object-contain"
            />
        </Link>

        <div className="relative z-10 max-w-xl py-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-blue-100">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Your next chapter starts here
          </div>

          <h1 className="text-5xl font-bold leading-tight xl:text-6xl">
            Turn your
            <span className="block bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              ambition
            </span>
            into action.
          </h1>

          <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
            Your entrepreneurial journey deserves the right tools,
            resources, and opportunities. Pick up where you left off.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-2xl font-bold text-cyan-300">Build</p>
              <p className="mt-1 text-sm text-slate-300">
                Develop your ideas
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-2xl font-bold text-cyan-300">Grow</p>
              <p className="mt-1 text-sm text-slate-300">
                Move your business forward
              </p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-sm text-slate-400">
          © {new Date().getFullYear()} SparkVenture. All rights reserved.
        </p>
      </section>

      {/* Login form */}
      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10 lg:px-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
            <Link to="/" className="flex shrink-0 items-center gap-2">
                <img
                src={Logo2}
                alt="Spark-Venture"
                className="h-20 w-auto object-contain"
                />
            </Link>

          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
              Welcome back
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Sign in to your account
            </h2>

            <p className="mt-3 text-slate-500">
              Enter your details to continue your journey.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
              >
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={19} />}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-sm text-slate-400">New to SparkVenture?</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <Link
            to="/register"
            className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-5 py-3.5 font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            Create an account
          </Link>

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-slate-600">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-slate-600">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
