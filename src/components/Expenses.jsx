
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Wallet,
  CalendarDays,
  Repeat2,
  Trash2,
  LoaderCircle,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const CATEGORIES = [
  "Rent",
  "Utilities",
  "Internet & Phone",
  "Transport",
  "Salaries",
  "Marketing",
  "Supplies",
  "Stock Purchases",
  "Maintenance",
  "Bank Charges",
  "Other",
];

const PAYMENT_METHODS = [
  "EFT",
  "Cash",
  "Card",
  "Debit Order",
  "Other",
];

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(Number(amount || 0));

const today = () => new Date().toISOString().slice(0, 10);

const initialForm = {
  description: "",
  category: "Other",
  amount: "",
  expense_date: today(),
  payment_method: "EFT",
  is_recurring: false,
  notes: "",
};

export default function Expenses({ businessId, userId }) {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [period, setPeriod] = useState("month");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadExpenses = useCallback(async () => {
    if (!businessId || !userId) {
      setLoading(false);
      setError("Your business or user information is missing.");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("business_expenses")
      .select("*")
      .eq("business_id", businessId)
      .eq("user_id", userId)
      .order("expense_date", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setExpenses([]);
    } else {
      setExpenses(data || []);
    }

    setLoading(false);
  }, [businessId, userId]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();

    return expenses.filter((expense) => {
      const date = new Date(`${expense.expense_date}T00:00:00`);

      let matchesPeriod = true;

      if (period === "month") {
        matchesPeriod =
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear();
      } else if (period === "year") {
        matchesPeriod = date.getFullYear() === now.getFullYear();
      }

      const matchesCategory =
        categoryFilter === "All" ||
        expense.category === categoryFilter;

      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        expense.description.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query);

      return matchesPeriod && matchesCategory && matchesSearch;
    });
  }, [expenses, period, categoryFilter, search]);

  const totalExpenses = expenses.reduce(
  (total, expense) => total + Number(expense.amount || 0),
  0
);

  const recurringExpenses = filteredExpenses
    .filter((expense) => expense.is_recurring)
    .reduce((total, expense) => total + Number(expense.amount || 0), 0);

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveExpense = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!businessId || !userId) {
      setError("Business or user information is missing.");
      return;
    }

    const amount = Number(form.amount);

    if (!form.description.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter a description and an amount greater than zero.");
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase
      .from("business_expenses")
      .insert({
        business_id: businessId,
        user_id: userId,
        description: form.description.trim(),
        category: form.category,
        amount,
        expense_date: form.expense_date,
        payment_method: form.payment_method,
        is_recurring: form.is_recurring,
        notes: form.notes.trim() || null,
        is_demo: false,
      });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setForm({ ...initialForm, expense_date: today() });
    setShowForm(false);
    setSuccess("Expense saved successfully.");
    await loadExpenses();
  };

  const deleteExpense = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("business_expenses")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId)
      .eq("user_id", userId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setSuccess("Expense deleted.");
    await loadExpenses();
  };
  

  return (
    <section className="min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Business expenses
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Track the money your business spends to operate.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((visible) => !visible)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add expense
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <Wallet size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total expenses</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatMoney(totalExpenses)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Based on the selected period and filters.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Repeat2 size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Recurring expenses</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatMoney(recurringExpenses)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Recurring expenses included in the current view.
          </p>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={saveExpense}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Record an expense
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Enter the amount your business spent.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Description
              <input
                required
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="e.g. Monthly electricity bill"
                className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-blue-500"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Amount (ZAR)
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                name="amount"
                value={form.amount}
                onChange={updateField}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-blue-500"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Category
              <select
                name="category"
                value={form.category}
                onChange={updateField}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Expense date
              <input
                required
                type="date"
                name="expense_date"
                value={form.expense_date}
                onChange={updateField}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-blue-500"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Payment method
              <select
                name="payment_method"
                value={form.payment_method}
                onChange={updateField}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-500"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_recurring"
                checked={form.is_recurring}
                onChange={updateField}
                className="h-4 w-4 accent-blue-600"
              />
              This is a recurring expense
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Notes (optional)
              <textarea
                name="notes"
                rows={3}
                value={form.notes}
                onChange={updateField}
                placeholder="Additional details..."
                className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <LoaderCircle size={17} className="animate-spin" />}
              {saving ? "Saving..." : "Save expense"}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search expenses..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
        >
          <option value="month">This month</option>
          <option value="year">This year</option>
          <option value="all">All time</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
        >
          <option value="All">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <h3 className="font-bold text-slate-900">Expense history</h3>
          <p className="mt-1 text-sm text-slate-500">
            {filteredExpenses.length} expense record(s)
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
            <LoaderCircle size={18} className="animate-spin" />
            Loading expenses...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-10 text-center">
            <CalendarDays className="mx-auto text-slate-400" size={32} />
            <p className="mt-3 font-semibold text-slate-800">
              No expenses found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add an expense or change your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Expense</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Payment</th>
                  <th className="px-5 py-3 text-right font-semibold">Amount</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {expense.description}
                      </p>
                      {expense.is_recurring && (
                        <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                          Recurring
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {expense.category}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {expense.expense_date}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {expense.payment_method}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-red-600">
                      −{formatMoney(expense.amount)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => deleteExpense(expense.id)}
                        aria-label={`Delete ${expense.description}`}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan={4} className="px-5 py-4 font-bold text-slate-800">
                    Total expenses
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-red-600">
                    {new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(totalExpenses)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
