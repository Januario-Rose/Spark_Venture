
import { Link } from "react-router-dom";
import dashboard from "../assets/dashboard.png"
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-cyan-100/50 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:py-24">
        {/* Left: Hero content */}
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            <TrendingUp size={16} />
            Your business journey starts here
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Turn your business idea into your{" "}
            <span className="bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              next big move.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Everything you need to start, manage, and grow your business.
            Discover opportunities, find resources, and take your next step
            with confidence.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-4 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Get started for free
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-4 font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
            >
              Explore features
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={17} className="text-emerald-600" />
              Built for entrepreneurs
            </span>

            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={17} className="text-blue-600" />
              Your business, your future
            </span>
          </div>

          <div className="mt-10 border-t border-slate-100 pt-6">
            <p className="text-sm font-medium text-slate-500">
              Helping South African entrepreneurs move forward.
            </p>
          </div>
        </div>

        {/* Right: Separate dashboard preview */}
        <div class="bg-linear-to-tr relative w-full rounded-3xl from-blue-50 via-sky-100 to-blue-200">
                <img src={dashboard}
                     alt="Entrepreneur"
                     class="h-125 w-full rounded-3xl object-contain shadow-2xl sm:h-125" />
        </div>
      </div>
    </section>
  );
}
