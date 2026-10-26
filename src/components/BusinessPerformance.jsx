
import { useMemo, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const money = (value) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const getDate = (record) =>
  new Date(
    record.expense_date ||
    record.created_at ||
    record.createdAt ||
    record.date
  );

const getAmount = (record) =>
  Number(
    record.total_amount ??
    record.total ??
    record.amount ??
    record.grand_total ??
    0
  );



function MetricCard({ title, value, description, color }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-3 break-words text-2xl font-bold ${color}`}>
        {money(value)}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function BarChart({ rows }) {
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => [row.revenue, row.expenses])
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-blue-600" />
          Revenue
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-amber-400" />
          Expenses
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {rows.map((row) => (
          <div key={row.key} className="min-w-0">
            <div className="flex h-40 items-end justify-center gap-1 border-b border-slate-200 px-1">
              <div
                title={`Revenue: ${money(row.revenue)}`}
                className="w-1/2 max-w-7 rounded-t-md bg-blue-600 transition-all"
                style={{
                  height: `${Math.max(2, (row.revenue / maxValue) * 100)}%`,
                }}
              />
              <div
                title={`Expenses: ${money(row.expenses)}`}
                className="w-1/2 max-w-7 rounded-t-md bg-amber-400 transition-all"
                style={{
                  height: `${Math.max(2, (row.expenses / maxValue) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-2 truncate text-center text-xs font-medium text-slate-500">
              {row.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BusinessPerformance({
  data = {},
  businessId,
  userId,
}) {
  const [period, setPeriod] = useState("3");
  const [expenseRecords, setExpenseRecords] = useState([]);
  const [expenseError, setExpenseError] = useState(null);
  const [expensesLoading, setExpensesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadExpenses() {
      if (!businessId || !userId) {
        setExpenseRecords([]);
        setExpensesLoading(false);
        return;
      }

      setExpensesLoading(true);
      setExpenseError(null);

      const { data: expenseData, error } = await supabase
        .from("business_expenses")
        .select("id, amount, expense_date, category, description")
        .eq("business_id", businessId)
        .eq("user_id", userId)
        .order("expense_date", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Error loading expenses:", error);
        setExpenseError(error.message);
        setExpenseRecords([]);
      } else {
        setExpenseRecords(expenseData || []);
      }

      setExpensesLoading(false);
    }

    loadExpenses();

    return () => {
      cancelled = true;
    };
  }, [businessId, userId]);

  const report = useMemo(() => {
    const invoices = data.invoices || [];
    const orders = data.orders || [];
    const invoiceItems = data.invoiceItems || [];
    const orderItems = data.orderItems || [];

    const now = new Date();
    const months = Number(period);

    const start = new Date(
      now.getFullYear(),
      now.getMonth() - months + 1,
      1
    );

    const inPeriod = (record) => {
      const date = getDate(record);
      return (
        !Number.isNaN(date.getTime()) &&
        date >= start &&
        date <= now
      );
    };

    // Prefer invoices over orders to avoid counting the same sale twice.
    const salesSource = invoices.length ? invoices : orders;

    const validSales = salesSource.filter((record) => {
      const status = String(record.status || "").toLowerCase();

      return (
        inPeriod(record) &&
        !["cancelled", "canceled", "void", "draft"].includes(status)
      );
    });

    const revenue = validSales.reduce(
      (sum, record) => sum + getAmount(record),
      0
    );

    // Use the expenses fetched directly from Supabase.
    const filteredExpenses = expenseRecords.filter(inPeriod);

    const totalExpenses = filteredExpenses.reduce(
      (sum, record) => sum + getAmount(record),
      0
    );

    const rows = Array.from({ length: months }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - months + 1 + index,
        1
      );

      const key = `${date.getFullYear()}-${date.getMonth()}`;

      const monthSales = validSales.filter((record) => {
        const saleDate = getDate(record);

        return (
          saleDate.getFullYear() === date.getFullYear() &&
          saleDate.getMonth() === date.getMonth()
        );
      });

      const monthExpenses = filteredExpenses.filter((record) => {
        const expenseDate = getDate(record);

        return (
          expenseDate.getFullYear() === date.getFullYear() &&
          expenseDate.getMonth() === date.getMonth()
        );
      });

      const monthRevenue = monthSales.reduce(
        (sum, record) => sum + getAmount(record),
        0
      );

      const monthCost = monthExpenses.reduce(
        (sum, record) => sum + getAmount(record),
        0
      );

      return {
        key,
        label: date.toLocaleDateString("en-ZA", {
          month: "short",
        }),
        revenue: monthRevenue,
        expenses: monthCost,
        profit: monthRevenue - monthCost,
      };
    });

    return {
      revenue,
      expenses: totalExpenses,
      profit: revenue - totalExpenses,
      rows,
      invoiceCount: validSales.length,
      invoiceItems,
      orderItems,
    };
  }, [data, period, expenseRecords]);

  const margin = report.revenue
    ? (report.profit / report.revenue) * 100
    : 0;

  const isProfit = report.profit >= 0;

  return (
    <section className="min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Business performance
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Understand your sales, costs and profit at a glance.
          </p>
          {expensesLoading && (
    <p className="mt-3 text-sm text-slate-500">
      Loading expenses...
    </p>
  )}

  {expenseError && (
    <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
      Could not load expenses: {expenseError}
    </p>
  )}
        </div>

        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 sm:w-auto"
        >
          <option value="3">Last 3 months</option>
          <option value="6">Last 6 months</option>
          <option value="12">Last 12 months</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total revenue"
          value={report.revenue}
          description="Sales recorded during this period"
          color="text-blue-700"
        />
        <MetricCard
          title="Recorded expenses"
          value={report.expenses}
          description="Expenses entered into your records"
          color="text-amber-600"
        />
        <MetricCard
          title={isProfit ? "Net result" : "Net loss"}
          value={Math.abs(report.profit)}
          description={isProfit ? "Revenue minus expenses" : "Expenses exceed revenue"}
          color={isProfit ? "text-green-600" : "text-red-600"}
        />
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm font-medium text-slate-500">Profit margin</p>
          <p className={`mt-3 text-2xl font-bold ${isProfit ? "text-green-600" : "text-red-600"}`}>
            {margin.toFixed(1)}%
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {report.revenue
              ? `For every R1 earned, your result is ${money(report.profit / report.revenue)} per rand.`
              : "Record sales to calculate your margin."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 xl:col-span-2">
          <h3 className="text-lg font-bold text-slate-900">
            Revenue vs expenses
          </h3>
          <p className="mb-6 mt-1 text-sm text-slate-500">
            Compare the money coming in with the costs recorded.
          </p>
          <BarChart rows={report.rows} />
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Profit and loss
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Your overall result for this period.
          </p>

          <div className={`mt-6 rounded-xl p-4 ${isProfit ? "bg-green-50" : "bg-red-50"}`}>
            <p className="text-sm text-slate-600">
              {isProfit ? "Your business made a profit of" : "Your business recorded a loss of"}
            </p>
            <p className={`mt-2 break-words text-2xl font-bold ${isProfit ? "text-green-700" : "text-red-700"}`}>
              {money(Math.abs(report.profit))}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">Revenue</span>
              <span className="font-semibold text-slate-900">{money(report.revenue)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">Expenses</span>
              <span className="font-semibold text-slate-900">{money(report.expenses)}</span>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-700">Net result</span>
                <span className={`font-bold ${isProfit ? "text-green-600" : "text-red-600"}`}>
                  {money(report.profit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="font-bold text-slate-900">What this means for your business</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {!report.revenue
            ? "There is not enough recorded sales data for this period yet. Record sales and expenses to see how your business is performing."
            : report.profit > 0
              ? `You earned ${money(report.revenue)} in sales and recorded ${money(report.expenses)} in expenses. Your current result is a profit of ${money(report.profit)}.`
              : report.profit < 0
                ? `Your recorded expenses are higher than your sales by ${money(Math.abs(report.profit))}. Review your costs and check that all sales have been recorded.`
                : "Your recorded revenue and expenses are equal. Review your costs and sales to identify ways to improve profitability."}
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          This overview uses recorded figures. It is not a substitute for a complete accounting report.
        </p>
      </div>
    </section>
  );
}
