import Logo from "../assets/footer-logo.png";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  UserRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const fullName = form.fullName.trim();
    const email = form.email.trim();

    if (!fullName || !email || !form.password || !form.confirmPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        setMessage(
          "Your account has been created successfully. You can now sign in."
        );
      } else {
        setMessage(
          "Registration received! Check your email for a confirmation link before signing in."
        );
      }

      setForm({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err.message || "We could not create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-2">
        {/* Left branding panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex xl:p-14">
          <div className="absolute -right-24 -top-20 h-80 w-80 rounded-full bg-blue-600/25 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

          <div className="relative">
            <Link to="/" className="flex shrink-0 items-center gap-2">
                <img
                src={Logo}
                alt="Spark-Venture"
                className="h-20 w-auto object-contain"
                />
            </Link>
          </div>

          <div className="relative my-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-blue-300">
              <Sparkles size={15} />
              Your journey starts here
            </span>

            <h1 className="mt-7 text-4xl font-bold leading-tight xl:text-5xl">
              Turn your ideas into your next big move.
            </h1>

            <p className="mt-6 max-w-md leading-8 text-slate-300">
              Discover resources, explore opportunities, and take practical
              steps towards building your business with SparkVenture.
            </p>

            <div className="mt-8 space-y-4 text-sm text-slate-300">
              {[
                "Explore entrepreneurial resources",
                "Develop your business ideas",
                "Plan your next steps with confidence",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 size={19} className="text-cyan-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-slate-500">
            Your ideas deserve an opportunity to grow.
          </p>
        </section>

        {/* Registration form */}
        <section className="p-6 sm:p-10 lg:p-12 xl:p-14">
          <div className="mx-auto max-w-md">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 lg:hidden"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                S
              </span>
              Spark<span className="-ml-2 text-blue-600">Venture</span>
            </Link>

            <div className="mt-8 lg:mt-0">
              <span className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Create an account
              </span>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                Join SparkVenture
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Create your account and start exploring your entrepreneurial
                journey.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <AlertCircle size={19} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {message && (
              <div
                role="status"
                className="mt-6 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"
              >
                <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
                <div>
                  <p>{message}</p>
                  <Link
                    to="/login"
                    className="mt-2 inline-flex items-center gap-1 font-semibold underline underline-offset-4"
                  >
                    Go to login
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Full name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full name
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={form.fullName}
                    onChange={updateField}
                    maxLength={100}
                    required
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={updateField}
                    required
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={updateField}
                    minLength={8}
                    required
                    disabled={loading}
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter your password again"
                    value={form.confirmPassword}
                    onChange={updateField}
                    required
                    disabled={loading}
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs leading-5 text-slate-500">
                By creating an account, you agree to our{" "}
                <Link
                  to="/terms"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating your account..." : "Create account"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-800"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-8 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} SparkVenture. All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
