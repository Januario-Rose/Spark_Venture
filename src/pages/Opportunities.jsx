import React from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  BriefcaseBusiness,
  MapPin,
  CalendarDays,
  Building2,
  RefreshCw,
  SlidersHorizontal,
  Clock,
  AlertCircle,
  LockKeyhole,
  ExternalLink
} from "lucide-react";
import { getOpportunities } from "../lib/opportunities";
import { useNavigate } from 'react-router-dom';

const provinces = [
  "National",
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

const sectors = [
  "Agriculture",
  "Construction",
  "Education",
  "Healthcare",
  "ICT",
  "Office Supplies",
  "Professional Services",
  "Transport",
];

const filtersInitial = {
  search: "",
  type: "all",
  sector: "all",
  province: "all",
  status: "all",
};

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "Value not specified";
  }

  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value) {
  if (!value) return "Closing date not specified";

  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(
    "en-ZA",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function statusLabel(opportunity) {
  if (opportunity.status === "closed") return "Closed";
  if (opportunity.status === "closing_soon") return "Closing soon";
  return "Open";
}

function statusClasses(opportunity) {
  if (opportunity.status === "closed") {
    return "bg-slate-100 text-slate-600";
  }

  if (opportunity.status === "closing_soon") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-emerald-100 text-emerald-700";
}

const Opportunities = () => {
  const [filters, setFilters] = useState(filtersInitial);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate()

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getOpportunities(filters);
      setOpportunities(data);
    } catch (err) {
      console.error("Failed to load opportunities:", err);
      setError(
        err?.message ||
          "Could not load opportunities. Check your Supabase connection and table permissions."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOpportunities();
    }, filters.search.trim() ? 300 : 0);

    return () => clearTimeout(timer);
  }, [loadOpportunities, filters.search]);

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetFilters() {
    setFilters(filtersInitial);
  }

  const openCount = opportunities.filter(
    (item) => item.status !== "closed"
  ).length;

  const closingSoonCount = opportunities.filter(
    (item) => item.status === "closing_soon"
  ).length;

  return (
    <div>
        <div className="flex min-h-screen bg-[#F0F7FF]">
            <Sidebar />
    
            <div className="flex-1 flex flex-col min-w-0">
            <Header />
    
            {/* Your main dashboard content goes here */}
           <main className="min-w-0 flex-1 bg-[#F0F7FF] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Business growth
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Opportunities
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Discover tenders, RFQs, and supplier opportunities
              that can help your business grow.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOpportunities}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Overview cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Open opportunities",
              value: loading ? "…" : openCount,
              icon: BriefcaseBusiness,
              iconStyle: "bg-blue-50 text-blue-600",
            },
            {
              label: "Closing soon",
              value: loading ? "…" : closingSoonCount,
              icon: Clock,
              iconStyle: "bg-amber-50 text-amber-600",
            },
            {
              label: "Saved",
              value: "—",
              icon: BriefcaseBusiness,
              iconStyle: "bg-violet-50 text-violet-600",
            },
            {
              label: "Applied",
              value: "—",
              icon: CalendarDays,
              iconStyle: "bg-emerald-50 text-emerald-600",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">
                    {item.label}
                  </p>

                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconStyle}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold text-slate-900">
                  {item.value}
                </p>
              </article>
            );
          })}
        </section>

        {/* Search and filters */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Discover opportunities
            </h2>
          </div>

          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={filters.search}
              onChange={(event) =>
                updateFilter("search", event.target.value)
              }
              placeholder="Search titles, organisations, or keywords..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <select
              value={filters.type}
              onChange={(event) => updateFilter("type", event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All opportunity types</option>
              <option value="tender">Tenders</option>
              <option value="rfq">Requests for quotation</option>
              <option value="supplier_listing">Supplier opportunities</option>
            </select>

            <select
              value={filters.sector}
              onChange={(event) =>
                updateFilter("sector", event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All sectors</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>

            <select
              value={filters.province}
              onChange={(event) =>
                updateFilter("province", event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All provinces</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(event) =>
                updateFilter("status", event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="closing_soon">Closing soon</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {loading
                ? "Loading opportunities..."
                : `${opportunities.length} opportunit${
                    opportunities.length === 1 ? "y" : "ies"
                  } found`}
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          </div>
        </section>

        {/* Errors */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">
                Could not load opportunities
              </p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={loadOpportunities}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Opportunity cards */}
        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-blue-600" />
            <p className="mt-3 text-sm text-slate-500">
              Finding opportunities for your business...
            </p>
          </div>
        ) : !error && opportunities.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-14 text-center shadow-sm">
            <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-4 font-semibold text-slate-800">
              No opportunities found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Try another search or clear your filters.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {opportunities.map((item) => (
              <article
                key={item.id}
                className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
                    {item.opportunity_type.replaceAll("_", " ")}
                  </span>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${statusClasses(item)}`}
                  >
                    {statusLabel(item)}
                  </span>

                  {item.is_demo && (
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                      Demo listing
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-lg font-bold leading-snug text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                  {item.organisation}
                </p>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {item.summary}
                </p>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {item.province}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(item.closing_date)}
                  </span>
                </div>

                {item.daysLeft !== null &&
                  item.daysLeft !== undefined && (
                    <p
                      className={`mt-3 text-sm font-medium ${
                        item.daysLeft < 0
                          ? "text-slate-500"
                          : item.daysLeft <= 7
                            ? "text-amber-700"
                            : "text-emerald-700"
                      }`}
                    >
                      {item.daysLeft < 0
                        ? "Closing date has passed"
                        : item.daysLeft === 0
                          ? "Closes today"
                          : `Closes in ${item.daysLeft} day${
                              item.daysLeft === 1 ? "" : "s"
                            }`}
                    </p>
                  )}

                <div className="mt-auto border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500">
                    Estimated value
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    {formatCurrency(item.estimated_value)}
                  </p>

                  {item.reference_number && (
                    <p className="mt-2 text-xs text-slate-400">
                      Reference: {item.reference_number}
                    </p>
                  )}
                  {/* ADD THE APPLICATION BUTTON HERE */}
<div className="mt-4 flex flex-wrap gap-3">
  {item.status === "closed" || item.daysLeft < 0 ? (
    <button
      type="button"
      disabled
      className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400"
    >
      <LockKeyhole className="h-4 w-4" />
      Applications closed
    </button>
  ) : (
    <button
      type="button"
      onClick={() =>
        navigate(`/opportunities/${item.id}/apply`)
      }
      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
    >
      Apply for opportunity
      <ExternalLink className="h-4 w-4" />
    </button>
  )}

  {item.status === "closing_soon" && item.daysLeft >= 0 && (
    <span className="inline-flex items-center rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
      Deadline approaching
    </span>
  )}
</div>

                  {item.source_url && (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      View source
                    </a>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
            </div>
        </div>
    </div>
  )
}

export default Opportunities