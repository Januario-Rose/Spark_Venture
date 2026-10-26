
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Bookmark,
  CalendarDays,
  Wallet,
  FileCheck2,
  Clock3,
  ArrowUpRight,
  RefreshCw,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import {
  getFundingOpportunities,
  getFundingRecords,
  saveFundingOpportunity,
  unsaveFunding,
  markFundingApplied,
  updateFundingRecord,
  calculateFundingSummary,
} from "../lib/funding";

import { getReadinessLabel } from "../lib/fundingScoring";

const VIEWS = ["All", "Saved", "Applied", "Approved", "Declined"];

const TYPES = [
  { label: "All types", value: "all" },
  { label: "Grants", value: "grant" },
  { label: "Loans", value: "loan" },
  { label: "Government", value: "government" },
  { label: "Crowdfunding", value: "crowdfunding" },
  { label: "Investment", value: "investment" },
];

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatAmountRange(item) {
  const min = Number(item.amount_min || 0);
  const max = Number(item.amount_max || 0);

  if (!min && !max) return "Amount not specified";
  if (!min) return `Up to ${formatCurrency(max)}`;
  if (!max) return `From ${formatCurrency(min)}`;

  return `${formatCurrency(min)} – ${formatCurrency(max)}`;
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function DeadlineBadge({ info }) {
  if (!info) return null;

  const styles = {
    critical: "bg-red-50 text-red-700",
    soon: "bg-amber-50 text-amber-700",
    normal: "bg-emerald-50 text-emerald-700",
    closed: "bg-slate-100 text-slate-500",
    none: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
        styles[info.urgency] || styles.none
      }`}
    >
      <CalendarDays size={13} />
      {info.label}
    </span>
  );
}

function FundingCard({ item, record, onSave, onApply, busy }) {
  const [expanded, setExpanded] = useState(false);

  const isSaved = Boolean(record);
  const hasApplication = [
    "applied",
    "approved",
    "declined",
    "withdrawn",
  ].includes(record?.status);

  const isClosed = item.effectiveStatus === "closed";

  return (
    <article className="flex flex-col rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
              {item.opportunity_type}
            </span>

            {item.is_demo && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
                Demo listing
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-slate-900">
            {item.title}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {item.provider}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSave(item, record)}
          disabled={busy || hasApplication || isClosed}
          title={isSaved ? "Remove saved opportunity" : "Save opportunity"}
          aria-label={isSaved ? "Unsave opportunity" : "Save opportunity"}
          className="rounded-xl border border-blue-100 p-2.5 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Bookmark size={19} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <p className="mt-4 text-xl font-bold text-slate-900">
        {formatAmountRange(item)}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {item.summary}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.sector && (
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-600">
            {item.sector}
          </span>
        )}

        {item.province && (
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-600">
            {item.province}
          </span>
        )}
      </div>

      <div className="mt-4">
        <DeadlineBadge info={item.deadlineInfo} />
      </div>

      {record && (
        <div className="mt-4 rounded-xl bg-blue-50 p-3 text-sm">
          <p className="font-medium capitalize text-blue-800">
            Status: {record.status}
          </p>

          {record.amount_requested != null && (
            <p className="mt-1 text-slate-600">
              Requested: {formatCurrency(record.amount_requested)}
            </p>
          )}

          {record.status === "approved" &&
            record.amount_approved != null && (
              <p className="mt-1 text-emerald-700">
                Approved: {formatCurrency(record.amount_approved)}
              </p>
            )}
        </div>
      )}

      {expanded && (
        <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              Who can apply?
            </h4>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {item.who_its_for || "Check with the funding provider."}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              Eligibility requirements
            </h4>

            {item.eligibility_requirements?.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {item.eligibility_requirements.map((requirement, index) => (
                  <li key={`${requirement}-${index}`}>{requirement}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-slate-600">
                Confirm the requirements with the provider.
              </p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              Required documents
            </h4>

            {item.documents_required?.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {item.documents_required.map((document, index) => (
                  <li key={`${document}-${index}`}>{document}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-slate-600">
                Check the provider's document checklist.
              </p>
            )}
          </div>

          {item.cost_notes && (
            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                Costs and repayment
              </h4>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {item.cost_notes}
              </p>
            </div>
          )}

          {item.application_url && (
            <a
              href={item.application_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              Visit provider website <ArrowUpRight size={16} />
            </a>
          )}

          {item.reference_number && (
            <p className="text-xs text-slate-500">
              Reference: {item.reference_number}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-3 pt-5">
        <button
          type="button"
          onClick={() => setExpanded((previous) => !previous)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {expanded ? "Hide details" : "View details"}
        </button>

        {hasApplication ? (
          <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={16} />
            Application recorded
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onApply(item, record)}
            disabled={busy || isClosed}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark as applied
          </button>
        )}
      </div>
    </article>
  );
}

const Funding = () => {
  /*
   * Connect businessId to your existing selected-business state or context.
   * Do not leave it empty if you want to save opportunities or applications.
   */
  const [businessId] = useState("");

  const [opportunities, setOpportunities] = useState([]);
  const [records, setRecords] = useState([]);
  const [readinessScore, setReadinessScore] = useState(null);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [sector, setSector] = useState("all");
  const [province, setProvince] = useState("all");
  const [status, setStatus] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [activeView, setActiveView] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadFunding = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [opportunityData, recordData] = await Promise.all([
        getFundingOpportunities({
          search,
          type,
          sector,
          province,
          status,
          minAmount,
          maxAmount,
        }),
        businessId ? getFundingRecords(businessId) : Promise.resolve([]),
      ]);

      setOpportunities(opportunityData);
      setRecords(recordData);
    } catch (err) {
      setError(err.message || "Unable to load funding opportunities.");
    } finally {
      setLoading(false);
    }
  }, [
    businessId,
    search,
    type,
    sector,
    province,
    status,
    minAmount,
    maxAmount,
  ]);

  useEffect(() => {
    loadFunding();
  }, [loadFunding]);

  const recordByOpportunityId = useMemo(
    () =>
      new Map(
        records.map((record) => [record.opportunity_id, record])
      ),
    [records]
  );

  const summary = useMemo(
    () => calculateFundingSummary(records),
    [records]
  );

  const visibleOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
      const record = recordByOpportunityId.get(item.id);

      if (activeView === "Saved") return record?.status === "saved";
      if (activeView === "Applied") return record?.status === "applied";
      if (activeView === "Approved") return record?.status === "approved";
      if (activeView === "Declined") return record?.status === "declined";

      return true;
    });
  }, [opportunities, recordByOpportunityId, activeView]);

  const closingSoonCount = opportunities.filter(
    (item) =>
      item.deadlineInfo?.daysRemaining >= 0 &&
      item.deadlineInfo?.daysRemaining <= 30 &&
      item.effectiveStatus !== "closed"
  ).length;

  async function handleSave(item, existingRecord) {
    if (!businessId) {
      setError("Connect your selected business before saving opportunities.");
      return;
    }

    setBusyId(item.id);
    setError("");

    try {
      if (existingRecord?.status === "saved") {
        await unsaveFunding(existingRecord.id);
      } else if (!existingRecord) {
        await saveFundingOpportunity({
          businessId,
          opportunityId: item.id,
        });
      }

      await loadFunding();
    } catch (err) {
      setError(err.message || "Unable to update saved funding.");
    } finally {
      setBusyId("");
    }
  }

  async function handleApply(item, existingRecord) {
    if (!businessId) {
      setError("Connect your selected business before tracking applications.");
      return;
    }

    const amountInput = window.prompt(
      "Enter the amount requested in ZAR. Leave blank if unknown."
    );

    if (amountInput === null) return;

    let amountRequested = null;

    if (amountInput.trim() !== "") {
      amountRequested = Number(amountInput);

      if (!Number.isFinite(amountRequested) || amountRequested < 0) {
        setError("Enter a valid, non-negative amount.");
        return;
      }
    }

    const notes = window.prompt("Add an optional application note:");

    if (notes === null) return;

    setBusyId(item.id);
    setError("");

    try {
      if (existingRecord) {
        await updateFundingRecord({
          recordId: existingRecord.id,
          status: "applied",
          amountRequested,
          notes,
          appliedAt: new Date().toISOString().slice(0, 10),
        });
      } else {
        await markFundingApplied({
          businessId,
          opportunityId: item.id,
          amountRequested,
          notes,
          appliedAt: new Date().toISOString().slice(0, 10),
        });
      }

      await loadFunding();
    } catch (err) {
      setError(err.message || "Unable to record your application.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F0F7FF]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  SparkVenture
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  Funding opportunities
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Discover funding options, manage your applications, and
                  prepare your business for its next stage of growth.
                </p>
              </div>

              <button
                type="button"
                onClick={loadFunding}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-50 disabled:opacity-50 sm:self-auto"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {!businessId && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Your business has not been connected to this page yet.
                Opportunities can still be browsed, but saving and application
                tracking require your selected business ID.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Open opportunities"
                value={opportunities.filter(
                  (item) => item.effectiveStatus !== "closed"
                ).length}
                subtitle="In the current results"
                icon={Wallet}
              />

              <StatCard
                title="Closing soon"
                value={closingSoonCount}
                subtitle="Within 30 days"
                icon={Clock3}
              />

              <StatCard
                title="Saved opportunities"
                value={summary.saved}
                subtitle="Kept for later"
                icon={Bookmark}
              />

              <StatCard
                title="Applications in progress"
                value={summary.inProgress}
                subtitle="Awaiting an outcome"
                icon={FileCheck2}
              />
            </div>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-blue-100 bg-white p-5 lg:col-span-2">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <ClipboardCheck size={21} className="text-blue-600" />
                      <h2 className="text-lg font-semibold text-slate-900">
                        Funding readiness
                      </h2>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Review your business registration, financial records,
                      documents, and funding plan.
                    </p>
                  </div>

                  <a
                    href="/funding/readiness"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Start assessment <ArrowUpRight size={16} />
                  </a>
                </div>

                {readinessScore !== null ? (
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        Latest score
                      </span>
                      <span className="font-semibold text-slate-900">
                        {readinessScore}/100
                      </span>
                    </div>

                    <div
                      className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-valuenow={readinessScore}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${readinessScore}%` }}
                      />
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {getReadinessLabel(readinessScore)}. This measures
                      preparation, not approval probability.
                    </p>
                  </div>
                ) : (
                  <p className="mt-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
                    Complete your first assessment to see your readiness
                    score here.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-5">
                <h2 className="font-semibold text-slate-900">
                  Application totals
                </h2>

                <p className="mt-4 text-sm text-slate-500">
                  Total requested
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {formatCurrency(summary.totalRequested)}
                </p>

                <p className="mt-4 text-sm text-slate-500">
                  Total approved
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-700">
                  {formatCurrency(summary.totalApproved)}
                </p>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Based on the application amounts recorded for this business.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Search size={19} className="text-slate-500" />
                <h2 className="font-semibold text-slate-900">
                  Find funding
                </h2>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search opportunities..."
                  aria-label="Search funding opportunities"
                  className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400 sm:col-span-2"
                />

                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  aria-label="Funding type"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
                >
                  {TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={province}
                  onChange={(event) => setProvince(event.target.value)}
                  aria-label="Province"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
                >
                  <option value="all">All provinces</option>
                  <option value="National">National</option>
                  {PROVINCES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  value={sector === "all" ? "" : sector}
                  onChange={(event) => setSector(event.target.value || "all")}
                  placeholder="Sector"
                  aria-label="Sector"
                  className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                />

                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  aria-label="Opportunity status"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
                >
                  <option value="all">Any status</option>
                  <option value="open">Open</option>
                  <option value="closing_soon">Closing soon</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="closed">Closed</option>
                </select>

                <input
                  type="number"
                  min="0"
                  value={minAmount}
                  onChange={(event) => setMinAmount(event.target.value)}
                  placeholder="Minimum amount (R)"
                  aria-label="Minimum funding amount"
                  className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                />

                <input
                  type="number"
                  min="0"
                  value={maxAmount}
                  onChange={(event) => setMaxAmount(event.target.value)}
                  placeholder="Maximum amount (R)"
                  aria-label="Maximum funding amount"
                  className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {VIEWS.map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setActiveView(view)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                      activeView === view
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  {activeView === "All"
                    ? "Explore opportunities"
                    : `${activeView} opportunities`}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {visibleOpportunities.length} result
                  {visibleOpportunities.length === 1 ? "" : "s"}
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center rounded-2xl border border-blue-100 bg-white p-12">
                  <RefreshCw
                    className="animate-spin text-blue-600"
                    size={24}
                  />
                  <span className="ml-3 text-sm text-slate-600">
                    Loading funding opportunities...
                  </span>
                </div>
              ) : visibleOpportunities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-blue-200 bg-white px-5 py-12 text-center">
                  <Wallet size={32} className="mx-auto text-slate-400" />
                  <h3 className="mt-4 font-semibold text-slate-900">
                    No opportunities found
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Try changing your filters or exploring another view.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {visibleOpportunities.map((item) => (
                    <FundingCard
                      key={item.id}
                      item={item}
                      record={recordByOpportunityId.get(item.id)}
                      onSave={handleSave}
                      onApply={handleApply}
                      busy={busyId === item.id}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Funding;
