
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Building2,
  FileText,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";

import Expenses from "../components/Expenses";
import BusinessPerformance from "../components/BusinessPerformance";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { supabase } from "../lib/supabaseClient";
import {
  createInvoice,
  recordInvoicePayment,
  getBookkeepingContext,
  getBookkeepingData,
  completeSale,
} from "../lib/bookkeeping";

const tabs = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "stock", label: "Stock", icon: Boxes },
  { id: "pos", label: "Point of Sale", icon: ShoppingCart },
  { id: "customers", label: "Customers", icon: Users },
  { id: "expenses", label: "Expenses", icon: Wallet },
  { id: "performance", label: "Performance", icon: TrendingUp },
];

const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 disabled:opacity-50";

const money = (amount) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);


const emptyCustomer = {
  name: "",
  company: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  notes: "",
};

const emptyProduct = {
  name: "",
  sku: "",
  category: "",
  description: "",
  cost_price: "",
  selling_price: "",
  quantity_on_hand: "0",
  reorder_level: "5",
  unit: "unit",
};

const emptyInvoiceLine = {
  description: "",
  quantity: "1",
  unit_price: "0",
  tax_rate: "15",
};

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-sm font-medium text-blue-600">{eyebrow}</p>
        )}
        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}

function EmptyState({ title, description, action, onAction }) {
  return (
    <div className="rounded-2xl border border-dashed border-blue-200 bg-white px-5 py-10 text-center sm:px-6 sm:py-12">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <FileText size={26} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
      {action && (
        <button type="button" onClick={onAction} className={`${primaryButton} mt-5`}>
          <Plus size={16} />
          {action}
        </button>
      )}
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <div className="min-w-0 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-100/40 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {value}
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-blue-600 sm:p-3">
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function Feedback({ children, type = "error" }) {
  if (!children) return null;

  const styles =
    type === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : type === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-red-200 bg-red-50 text-red-700";

  return (
    <div role="status" className={`break-words rounded-xl border p-3 text-sm sm:p-4 ${styles}`}>
      {children}
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function TableWrap({ children, minWidth = "700px" }) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className="w-full text-left text-sm"
        style={{ minWidth }}
      >
        {children}
      </table>
    </div>
  );
}

export default function Bookkeeping() {
  const [activeTab, setActiveTab] = useState("overview");
  const [context, setContext] = useState(null);
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // POS state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cart, setCart] = useState([]);
  const [processingSale, setProcessingSale] = useState(false);
  const [saleMessage, setSaleMessage] = useState("");
  const [saleError, setSaleError] = useState("");

  // Product state
  const [showProductForm, setShowProductForm] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState("");
  const [productMessage, setProductMessage] = useState("");
  const [productForm, setProductForm] = useState({ ...emptyProduct });

  // Invoice state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceCustomerId, setInvoiceCustomerId] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [invoiceDiscount, setInvoiceDiscount] = useState("0");
  const [invoiceLines, setInvoiceLines] = useState([{ ...emptyInvoiceLine }]);
  const [invoiceError, setInvoiceError] = useState("");
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  // Customer state
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({ ...emptyCustomer });
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSaving, setCustomerSaving] = useState(false);
  const [customerDeletingId, setCustomerDeletingId] = useState(null);
  const [customerError, setCustomerError] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");

  const products = records?.products ?? [];
  const customers = records?.customers ?? [];
  const invoices = records?.invoices ?? [];

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getBookkeepingContext();
      setContext(result);

      if (result.status === "ready") {
        const data = await getBookkeepingData(
          result.business.id,
          result.user.id
        );
        setRecords(data);
      } else {
        setRecords(null);
      }
    } catch (err) {
      console.error("Bookkeeping loading error:", err);
      setError(err.message || "Unable to load bookkeeping data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const stats = useMemo(() => {
    if (!records) return null;

    const allInvoices = records.invoices ?? [];
    const allProducts = records.products ?? [];
    const orders = records.orders ?? [];

    const outstanding = allInvoices
      .filter((invoice) => {
        const status = String(invoice.status || "").toLowerCase();
        return !["paid", "cancelled", "canceled", "void"].includes(status);
      })
      .reduce(
        (total, invoice) =>
          total +
          Math.max(
            0,
            Number(invoice.total || 0) - Number(invoice.amount_paid || 0)
          ),
        0
      );

    const lowStock = allProducts.filter(
      (product) =>
        Number(product.quantity_on_hand || 0) <=
        Number(product.reorder_level || 0)
    ).length;

    const sales = orders
      .filter(
        (order) => String(order.status || "").toLowerCase() === "completed"
      )
      .reduce((total, order) => total + Number(order.total || 0), 0);

    return {
      sales,
      outstanding,
      lowStock,
      customers: (records.customers ?? []).length,
      products: allProducts.length,
      invoices: allInvoices.length,
      orders: orders.length,
    };
  }, [records]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.selling_price) * item.quantity,
    0
  );

  const cartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  const invoiceTotals = useMemo(
    () =>
      invoiceLines.reduce(
        (totals, line) => {
          const subtotal =
            (Number(line.quantity) || 0) *
            (Number(line.unit_price) || 0);

          totals.subtotal += subtotal;
          totals.tax += subtotal * ((Number(line.tax_rate) || 0) / 100);
          return totals;
        },
        { subtotal: 0, tax: 0 }
      ),
    [invoiceLines]
  );

  const invoiceTotal = Math.max(
    0,
    invoiceTotals.subtotal +
      invoiceTotals.tax -
      Math.max(0, Number(invoiceDiscount) || 0)
  );

  // -------------------------
  // Point of Sale
  // -------------------------

  function addToCart() {
    setSaleError("");
    setSaleMessage("");

    const product = products.find((item) => item.id === selectedProductId);

    if (!product) {
      setSaleError("Please select a product.");
      return;
    }

    if (!product.is_active) {
      setSaleError("This product is inactive.");
      return;
    }

    const existing = cart.find((item) => item.id === product.id);
    const requestedQuantity = existing ? existing.quantity + 1 : 1;

    if (requestedQuantity > Number(product.quantity_on_hand)) {
      setSaleError(`Not enough stock available for ${product.name}.`);
      return;
    }

    setCart((previous) => {
      const alreadyAdded = previous.find((item) => item.id === product.id);

      if (alreadyAdded) {
        return previous.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...previous,
        {
          id: product.id,
          name: product.name,
          selling_price: Number(product.selling_price),
          quantity: 1,
        },
      ];
    });

    setSelectedProductId("");
  }

  function changeCartQuantity(productId, value) {
    const product = products.find((item) => item.id === productId);
    const quantity = Number(value);

    if (!product || !Number.isInteger(quantity) || quantity < 1) return;

    if (quantity > Number(product.quantity_on_hand)) {
      setSaleError(`Only ${product.quantity_on_hand} units are available.`);
      return;
    }

    setSaleError("");
    setCart((previous) =>
      previous.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }

  async function handleCompleteSale() {
    if (!context?.business?.id || !context?.user?.id) {
      setSaleError("Your business connection is not ready. Refresh and try again.");
      return;
    }

    if (!cart.length) {
      setSaleError("Add at least one product to the cart.");
      return;
    }

    setProcessingSale(true);
    setSaleError("");
    setSaleMessage("");

    try {
      const orderId = await completeSale({
        businessId: context.business.id,
        customerId: selectedCustomerId || null,
        paymentMethod,
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      });

      setCart([]);
      setSelectedCustomerId("");
      setSaleMessage(`Sale completed successfully. Order ID: ${orderId}`);
      await loadPage();
    } catch (err) {
      console.error("Sale failed:", err);
      setSaleError(err.message || "The sale could not be completed.");
    } finally {
      setProcessingSale(false);
    }
  }

  // -------------------------
  // Stock / products
  // -------------------------

  async function handleAddProduct(event) {
    event.preventDefault();
    setProductError("");
    setProductMessage("");

    if (!context?.user?.id || !context?.business?.id) {
      setProductError("Your business is not connected.");
      return;
    }

    const quantity = Number(productForm.quantity_on_hand);
    const costPrice = Number(productForm.cost_price);
    const sellingPrice = Number(productForm.selling_price);
    const reorderLevel = Number(productForm.reorder_level);

    if (
      !productForm.name.trim() ||
      productForm.cost_price === "" ||
      productForm.selling_price === "" ||
      !productForm.unit.trim()
    ) {
      setProductError("Complete all required fields.");
      return;
    }

    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(costPrice) ||
      !Number.isFinite(sellingPrice) ||
      !Number.isFinite(reorderLevel) ||
      quantity < 0 ||
      costPrice < 0 ||
      sellingPrice < 0 ||
      reorderLevel < 0
    ) {
      setProductError("Prices and stock quantities must be valid non-negative numbers.");
      return;
    }

    setSavingProduct(true);

    try {
      const { error: insertError } = await supabase
        .from("bookkeeping_products")
        .insert({
          business_id: context.business.id,
          user_id: context.user.id,
          name: productForm.name.trim(),
          sku: productForm.sku.trim() || null,
          category: productForm.category.trim() || null,
          description: productForm.description.trim() || null,
          cost_price: costPrice,
          selling_price: sellingPrice,
          quantity_on_hand: quantity,
          reorder_level: reorderLevel,
          unit: productForm.unit.trim(),
          is_active: true,
        });

      if (insertError) throw insertError;

      setProductForm({ ...emptyProduct });
      setShowProductForm(false);
      setProductMessage("Product added successfully.");
      await loadPage();
    } catch (err) {
      console.error("Add product failed:", err);
      setProductError(err.message || "Could not add product.");
    } finally {
      setSavingProduct(false);
    }
  }

  // -------------------------
  // Invoices / payments
  // -------------------------

  async function handleCreateInvoice(event) {
    event.preventDefault();
    setInvoiceError("");

    if (!context?.business?.id || !context?.user?.id) {
      setInvoiceError("Your business session is not ready.");
      return;
    }

    if (
      invoiceLines.some(
        (line) =>
          !line.description.trim() ||
          Number(line.quantity) <= 0 ||
          Number(line.unit_price) < 0 ||
          Number(line.tax_rate) < 0
      )
    ) {
      setInvoiceError("Check each invoice line. Descriptions are required and amounts must be valid.");
      return;
    }

    setSavingInvoice(true);

    try {
      const created = await createInvoice({
        businessId: context.business.id,
        userId: context.user.id,
        customerId: invoiceCustomerId || null,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: invoiceDueDate || null,
        discount: Number(invoiceDiscount || 0),
        notes: invoiceNotes,
        items: invoiceLines,
      });

      setShowInvoiceForm(false);
      setInvoiceCustomerId("");
      setInvoiceDueDate("");
      setInvoiceNotes("");
      setInvoiceDiscount("0");
      setInvoiceLines([{ ...emptyInvoiceLine }]);

      await loadPage();
      window.alert(`Invoice ${created.invoice_number} created successfully.`);
    } catch (err) {
      console.error("Create invoice failed:", err);
      setInvoiceError(err.message || "Unable to create invoice.");
    } finally {
      setSavingInvoice(false);
    }
  }

  async function handleRecordPayment(event) {
    event.preventDefault();

    if (!paymentInvoice || !context?.business?.id) return;

    const amount = Number(paymentAmount);
    const balance = Math.max(
      0,
      Number(paymentInvoice.total) - Number(paymentInvoice.amount_paid)
    );

    if (!Number.isFinite(amount) || amount <= 0 || amount > balance) {
      setInvoiceError("Enter a valid payment amount that does not exceed the outstanding balance.");
      return;
    }

    setInvoiceError("");
    setSavingPayment(true);

    try {
      await recordInvoicePayment(
        paymentInvoice.id,
        context.business.id,
        amount
      );

      setPaymentInvoice(null);
      setPaymentAmount("");
      await loadPage();
    } catch (err) {
      setInvoiceError(err.message || "Unable to record payment.");
    } finally {
      setSavingPayment(false);
    }
  }

  // -------------------------
  // Customers
  // -------------------------

  function openCustomerForm(customer = null) {
    setEditingCustomer(customer);
    setCustomerForm(
      customer
        ? {
            name: customer.name ?? "",
            company: customer.company ?? "",
            email: customer.email ?? "",
            phone: customer.phone ?? "",
            address: customer.address ?? "",
            city: customer.city ?? "",
            notes: customer.notes ?? "",
          }
        : { ...emptyCustomer }
    );

    setCustomerError("");
    setCustomerMessage("");
    setShowCustomerForm(true);
  }

  function handleCustomerChange(event) {
    const { name, value } = event.target;
    setCustomerForm((previous) => ({ ...previous, [name]: value }));
  }

  async function saveCustomer(event) {
    event.preventDefault();
    setCustomerError("");
    setCustomerMessage("");

    if (!customerForm.name.trim()) {
      setCustomerError("Please enter the customer's name.");
      return;
    }

    if (!context?.business?.id || !context?.user?.id) {
      setCustomerError("Your business or user information is missing. Refresh the page and try again.");
      return;
    }

    setCustomerSaving(true);

    const customerData = {
      name: customerForm.name.trim(),
      company: customerForm.company.trim() || null,
      email: customerForm.email.trim() || null,
      phone: customerForm.phone.trim() || null,
      address: customerForm.address.trim() || null,
      city: customerForm.city.trim() || null,
      notes: customerForm.notes.trim() || null,
    };

    try {
      let result;

      if (editingCustomer) {
        result = await supabase
          .from("bookkeeping_customers")
          .update(customerData)
          .eq("id", editingCustomer.id)
          .eq("business_id", context.business.id)
          .eq("user_id", context.user.id);
      } else {
        result = await supabase
          .from("bookkeeping_customers")
          .insert({
            ...customerData,
            business_id: context.business.id,
            user_id: context.user.id,
          });
      }

      if (result.error) throw result.error;

      const wasEditing = Boolean(editingCustomer);

      setShowCustomerForm(false);
      setEditingCustomer(null);
      setCustomerForm({ ...emptyCustomer });
      await loadPage();

      setCustomerMessage(
        wasEditing
          ? "Customer updated successfully."
          : "Customer added successfully."
      );
    } catch (err) {
      console.error("Save customer failed:", err);
      setCustomerError(err.message || "Could not save the customer.");
    } finally {
      setCustomerSaving(false);
    }
  }

  async function deleteCustomer(customer) {
    if (!context?.business?.id || !context?.user?.id) {
      setCustomerError("Your business session is not ready.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.name}?`
    );

    if (!confirmed) return;

    setCustomerError("");
    setCustomerMessage("");
    setCustomerDeletingId(customer.id);

    try {
      const { error: deleteError } = await supabase
        .from("bookkeeping_customers")
        .delete()
        .eq("id", customer.id)
        .eq("business_id", context.business.id)
        .eq("user_id", context.user.id);

      if (deleteError) throw deleteError;

      await loadPage();
      setCustomerMessage("Customer deleted successfully.");
    } catch (err) {
      console.error("Delete customer failed:", err);
      setCustomerError(
        err.message ||
          "Could not delete this customer. They may be linked to an invoice or order."
      );
    } finally {
      setCustomerDeletingId(null);
    }
  }

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.company,
        customer.email,
        customer.phone,
        customer.address,
        customer.city,
      ].some((value) => String(value ?? "").toLowerCase().includes(query))
    );
  }, [customers, customerSearch]);

  function updateInvoiceLine(index, field, value) {
    setInvoiceLines((previous) =>
      previous.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      )
    );
  }

  // -------------------------
  // Page layout
  // -------------------------

  return (
    <div className="min-h-screen bg-[#F0F7FF]">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header />

          <main className="mx-auto w-full max-w-7xl min-w-0 space-y-5 p-3 sm:space-y-6 sm:p-5 lg:p-8">
            <PageHeading
              eyebrow="Business management"
              title="Bookkeeping"
              description="Manage your sales, invoices, customers, and stock in one place."
              action={
                <button
                  type="button"
                  onClick={loadPage}
                  disabled={loading}
                  className={secondaryButton}
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              }
            />

            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-white p-6">
                <LoaderCircle className="animate-spin text-blue-600" size={32} />
                <p className="text-center text-sm text-slate-500">
                  Loading your business records...
                </p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-white p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={22} />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-slate-900">
                      We couldn't load Bookkeeping
                    </h2>
                    <p className="mt-2 break-words text-sm text-slate-600">
                      {error}
                    </p>
                    <button
                      type="button"
                      onClick={loadPage}
                      className={`${primaryButton} mt-4`}
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            ) : context?.status === "unauthenticated" ? (
              <EmptyState
                title="Please sign in"
                description="Sign in to access your business bookkeeping records."
                action="Go to sign in"
                onAction={() => {
                  window.location.href = "/login";
                }}
              />
            ) : context?.status === "no-business" ? (
              <div className="rounded-2xl border border-blue-100 bg-white p-6 sm:p-10">
                <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                  <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
                    <Building2 size={32} />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-slate-900">
                    Set up your business first
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Your Bookkeeping workspace will be ready once you create
                    your business. Your invoices, customers, sales, and stock
                    will be linked to that business.
                  </p>
                  <a href="/my-business" className={`${primaryButton} mt-6`}>
                    <Building2 size={17} />
                    Set up my business
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Business status */}
                <div className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="shrink-0 rounded-xl bg-blue-50 p-3 text-blue-600">
                      <Building2 size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Current business
                      </p>
                      <h2 className="truncate font-semibold text-slate-900">
                        {context?.business?.name ||
                          context?.business?.business_name ||
                          "My business"}
                      </h2>
                    </div>
                    <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 sm:px-3">
                      Connected
                    </span>
                  </div>
                </div>

                {/* Scrollable navigation for small screens */}
                <nav
                  aria-label="Bookkeeping sections"
                  className="-mx-1 overflow-x-auto rounded-2xl border border-blue-100 bg-white p-2"
                >
                  <div className="flex min-w-max gap-1.5">
                    {tabs.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setActiveTab(id)}
                        aria-current={activeTab === id ? "page" : undefined}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition sm:px-4 ${
                          activeTab === id
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        <Icon size={17} />
                        {label}
                      </button>
                    ))}
                  </div>
                </nav>

                {/* OVERVIEW */}
                {activeTab === "overview" && stats && (
                  <section className="space-y-5 sm:space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Business overview
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        A summary of your recorded bookkeeping activity.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                      <StatCard
                        title="Recorded sales"
                        value={money(stats.sales)}
                        description={`${stats.orders} completed POS orders`}
                        icon={Wallet}
                      />
                      <StatCard
                        title="Outstanding invoices"
                        value={money(stats.outstanding)}
                        description={`${stats.invoices} invoices recorded`}
                        icon={FileText}
                      />
                      <StatCard
                        title="Products in stock"
                        value={stats.products}
                        description={`${stats.lowStock} products at or below reorder level`}
                        icon={Boxes}
                      />
                      <StatCard
                        title="Customers"
                        value={stats.customers}
                        description="Customers registered for this business"
                        icon={Users}
                      />
                    </div>

                    {stats.customers === 0 &&
                      stats.products === 0 &&
                      stats.invoices === 0 &&
                      stats.orders === 0 && (
                        <EmptyState
                          title="Your bookkeeping starts here"
                          description="Your business is connected, but you haven't added bookkeeping records yet. Start by adding a customer or a product."
                          action="Add your first customer"
                          onAction={() => {
                            setActiveTab("customers");
                            openCustomerForm();
                          }}
                        />
                      )}

                    {stats.lowStock > 0 && (
                      <Feedback type="warning">
                        <div className="flex items-start gap-3">
                          <AlertCircle size={21} className="mt-0.5 shrink-0" />
                          <div>
                            <h3 className="font-semibold">Stock needs attention</h3>
                            <p className="mt-1">
                              {stats.lowStock} product(s) are at or below their
                              reorder level. Review the Stock tab.
                            </p>
                            <button
                              type="button"
                              onClick={() => setActiveTab("stock")}
                              className="mt-2 font-semibold underline underline-offset-2"
                            >
                              Review stock
                            </button>
                          </div>
                        </div>
                      </Feedback>
                    )}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5">
                        <h3 className="font-semibold text-slate-900">
                          Quick actions
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Jump straight to a bookkeeping task.
                        </p>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {[
                            ["Create invoice", "invoices", FileText],
                            ["Record a sale", "pos", ShoppingCart],
                            ["Add a product", "stock", Boxes],
                            ["Add a customer", "customers", Users],
                          ].map(([label, tab, Icon]) => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => {
                                setActiveTab(tab);
                                if (tab === "invoices") setShowInvoiceForm(true);
                                if (tab === "stock") setShowProductForm(true);
                                if (tab === "customers") openCustomerForm();
                              }}
                              className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                            >
                              <span className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600">
                                <Icon size={18} />
                              </span>
                              <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">
                                {label}
                              </span>
                              <Plus size={16} className="shrink-0 text-slate-400" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5">
                        <h3 className="font-semibold text-slate-900">
                          Bookkeeping snapshot
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Your current record counts.
                        </p>
                        <div className="mt-4 space-y-4">
                          {[
                            ["Invoices", stats.invoices, FileText],
                            ["Products", stats.products, Boxes],
                            ["Customers", stats.customers, Users],
                            ["POS orders", stats.orders, ShoppingCart],
                          ].map(([label, count, Icon]) => (
                            <div
                              key={label}
                              className="flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <Icon size={18} className="shrink-0 text-blue-600" />
                                <span className="text-sm text-slate-600">{label}</span>
                              </div>
                              <span className="text-sm font-semibold text-slate-900">
                                {count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* POINT OF SALE */}
                {activeTab === "pos" && (
                  <section className="space-y-5">
                    <PageHeading
                      title="Point of Sale"
                      description="Add products to the cart and complete a sale. Stock updates after checkout."
                    />

                    <Feedback type="success">{saleMessage}</Feedback>
                    <Feedback>{saleError}</Feedback>

                    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-5">
                      <div className="min-w-0 space-y-5 rounded-2xl border border-blue-100 bg-white p-4 sm:p-5">
                        <h3 className="font-semibold text-slate-900">Add products</h3>

                        <Field label="Product">
                          <select
                            value={selectedProductId}
                            onChange={(event) => setSelectedProductId(event.target.value)}
                            className={inputClass}
                          >
                            <option value="">Choose a product</option>
                            {products
                              .filter((product) => product.is_active)
                              .map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} — {money(product.selling_price)} · Stock: {product.quantity_on_hand}
                                </option>
                              ))}
                          </select>
                        </Field>

                        <button
                          type="button"
                          onClick={addToCart}
                          disabled={!selectedProductId}
                          className={`${primaryButton} w-full`}
                        >
                          <Plus size={17} />
                          Add to cart
                        </button>

                        <div className="space-y-4 border-t border-slate-100 pt-5">
                          <Field label="Customer (optional)">
                            <select
                              value={selectedCustomerId}
                              onChange={(event) => setSelectedCustomerId(event.target.value)}
                              className={inputClass}
                            >
                              <option value="">Walk-in customer</option>
                              {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                  {customer.name}
                                </option>
                              ))}
                            </select>
                          </Field>

                          <Field label="Payment method">
                            <select
                              value={paymentMethod}
                              onChange={(event) => setPaymentMethod(event.target.value)}
                              className={inputClass}
                            >
                              <option value="cash">Cash</option>
                              <option value="card">Card</option>
                              <option value="eft">EFT</option>
                              <option value="mobile_money">Mobile money</option>
                              <option value="other">Other</option>
                            </select>
                          </Field>
                        </div>
                      </div>

                      <div className="min-w-0 rounded-2xl border border-blue-100 bg-white p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-semibold text-slate-900">Current sale</h3>
                          <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            {cartUnits} units
                          </span>
                        </div>

                        {cart.length === 0 ? (
                          <div className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
                            <ShoppingCart className="mx-auto text-slate-300" size={32} />
                            <p className="mt-3 text-sm font-medium text-slate-600">
                              Your cart is empty
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Select a product to start a sale.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-4 divide-y divide-slate-100">
                            {cart.map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-wrap items-center gap-3 py-4"
                              >
                                <div className="min-w-0 flex-1 basis-28">
                                  <p className="break-words text-sm font-medium text-slate-800">
                                    {item.name}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {money(item.selling_price)} each
                                  </p>
                                </div>

                                <input
                                  type="number"
                                  min="1"
                                  max={products.find((p) => p.id === item.id)?.quantity_on_hand ?? undefined}
                                  step="1"
                                  value={item.quantity}
                                  aria-label={`Quantity for ${item.name}`}
                                  onChange={(event) =>
                                    changeCartQuantity(item.id, event.target.value)
                                  }
                                  className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm"
                                />

                                <p className="w-24 text-right text-sm font-semibold text-slate-900">
                                  {money(item.selling_price * item.quantity)}
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setCart((previous) =>
                                      previous.filter((product) => product.id !== item.id)
                                    )
                                  }
                                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                  aria-label={`Remove ${item.name}`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-slate-500">Total</span>
                            <span className="break-words text-xl font-bold text-slate-900 sm:text-2xl">
                              {money(cartTotal)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={handleCompleteSale}
                            disabled={processingSale || loading || cart.length === 0}
                            className={`${primaryButton} mt-5 w-full py-3`}
                          >
                            {processingSale ? (
                              <>
                                <LoaderCircle size={18} className="animate-spin" />
                                Processing sale...
                              </>
                            ) : (
                              <>
                                <ShoppingCart size={18} />
                                Complete sale
                              </>
                            )}
                          </button>
                          <p className="mt-3 text-xs leading-5 text-slate-400">
                            Stock is deducted only after the database confirms the sale.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* STOCK */}
                {activeTab === "stock" && (
                  <section className="space-y-5">
                    <PageHeading
                      title="Inventory"
                      description="Manage products, quantities, and reorder levels."
                      action={
                        <button
                          type="button"
                          onClick={() => {
                            setProductError("");
                            setProductMessage("");
                            setShowProductForm((previous) => !previous);
                          }}
                          className={primaryButton}
                        >
                          <Plus size={17} />
                          Add product
                        </button>
                      }
                    />

                    <Feedback>{productError}</Feedback>
                    <Feedback type="success">{productMessage}</Feedback>

                    {showProductForm && (
                      <form
                        onSubmit={handleAddProduct}
                        className="grid grid-cols-1 gap-4 rounded-2xl border border-blue-100 bg-white p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3"
                      >
                        <h3 className="font-semibold text-slate-900 sm:col-span-2 lg:col-span-3">
                          New product
                        </h3>

                        {[
                          ["name", "Product name", "e.g. School backpack"],
                          ["sku", "SKU (optional)", "e.g. BAG-001"],
                          ["category", "Category", "e.g. Accessories"],
                          ["cost_price", "Cost price (R)", "0.00"],
                          ["selling_price", "Selling price (R)", "0.00"],
                          ["quantity_on_hand", "Opening stock", "0"],
                          ["reorder_level", "Low-stock threshold", "5"],
                          ["unit", "Unit", "unit"],
                        ].map(([field, label, placeholder]) => {
                          const numeric = [
                            "cost_price",
                            "selling_price",
                            "quantity_on_hand",
                            "reorder_level",
                          ].includes(field);

                          return (
                            <Field key={field} label={label}>
                              <input
                                required={[
                                  "name",
                                  "cost_price",
                                  "selling_price",
                                  "quantity_on_hand",
                                  "reorder_level",
                                  "unit",
                                ].includes(field)}
                                type={numeric ? "number" : "text"}
                                min={numeric ? "0" : undefined}
                                step={
                                  ["cost_price", "selling_price"].includes(field)
                                    ? "0.01"
                                    : ["quantity_on_hand", "reorder_level"].includes(field)
                                      ? "0.001"
                                      : undefined
                                }
                                value={productForm[field]}
                                onChange={(event) =>
                                  setProductForm((previous) => ({
                                    ...previous,
                                    [field]: event.target.value,
                                  }))
                                }
                                placeholder={placeholder}
                                className={inputClass}
                              />
                            </Field>
                          );
                        })}

                        <Field label="Description (optional)" className="sm:col-span-2 lg:col-span-3">
                          <textarea
                            value={productForm.description}
                            onChange={(event) =>
                              setProductForm((previous) => ({
                                ...previous,
                                description: event.target.value,
                              }))
                            }
                            rows={3}
                            className={inputClass}
                          />
                        </Field>

                        <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
                          <button type="submit" disabled={savingProduct} className={primaryButton}>
                            {savingProduct ? "Saving..." : "Save product"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowProductForm(false)}
                            className={secondaryButton}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
                      {products.length === 0 ? (
                        <div className="p-3 sm:p-4">
                          <EmptyState
                            title="No products yet"
                            description="Add your first product to start tracking stock and making sales."
                            action="Add your first product"
                            onAction={() => setShowProductForm(true)}
                          />
                        </div>
                      ) : (
                        <TableWrap minWidth="700px">
                          <thead className="bg-blue-50 text-slate-600">
                            <tr>
                              {["Product", "SKU", "Cost", "Selling price", "In stock", "Status"].map((heading) => (
                                <th key={heading} className="whitespace-nowrap px-4 py-3 font-medium sm:px-5">
                                  {heading}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {products.map((product) => {
                              const quantity = Number(product.quantity_on_hand);
                              const low = quantity <= Number(product.reorder_level);

                              return (
                                <tr key={product.id} className="hover:bg-blue-50/40">
                                  <td className="px-4 py-4 sm:px-5">
                                    <p className="font-medium text-slate-900">{product.name}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {product.category || "Uncategorised"}
                                    </p>
                                  </td>
                                  <td className="px-4 py-4 text-slate-500 sm:px-5">
                                    {product.sku || "—"}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-4 text-slate-600 sm:px-5">
                                    {money(product.cost_price)}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-800 sm:px-5">
                                    {money(product.selling_price)}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-4 text-slate-700 sm:px-5">
                                    {quantity} {product.unit}
                                  </td>
                                  <td className="px-4 py-4 sm:px-5">
                                    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                                      !product.is_active
                                        ? "bg-slate-100 text-slate-600"
                                        : low
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-green-100 text-green-800"
                                    }`}>
                                      {!product.is_active ? "Inactive" : low ? "Low stock" : "In stock"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </TableWrap>
                      )}
                    </div>
                  </section>
                )}

                {/* INVOICES */}
                {activeTab === "invoices" && (
                  <section className="space-y-5">
                    <PageHeading
                      title="Invoices"
                      description="Create invoices and track payments from your customers."
                      action={
                        <button
                          type="button"
                          onClick={() => {
                            setInvoiceError("");
                            setShowInvoiceForm((value) => !value);
                          }}
                          className={primaryButton}
                        >
                          <Plus size={17} />
                          Create invoice
                        </button>
                      }
                    />

                    <Feedback>{invoiceError}</Feedback>

                    {showInvoiceForm && (
                      <form
                        onSubmit={handleCreateInvoice}
                        className="space-y-5 rounded-2xl border border-blue-100 bg-white p-4 sm:p-5"
                      >
                        <h3 className="font-semibold text-slate-900">New invoice</h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label="Customer">
                            <select
                              value={invoiceCustomerId}
                              onChange={(event) => setInvoiceCustomerId(event.target.value)}
                              className={inputClass}
                            >
                              <option value="">No customer selected</option>
                              {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                  {customer.name}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Due date">
                            <input
                              type="date"
                              value={invoiceDueDate}
                              onChange={(event) => setInvoiceDueDate(event.target.value)}
                              className={inputClass}
                            />
                          </Field>
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-medium text-slate-800">Line items</h4>
                            <button
                              type="button"
                              onClick={() =>
                                setInvoiceLines((lines) => [
                                  ...lines,
                                  { ...emptyInvoiceLine },
                                ])
                              }
                              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                              + Add line
                            </button>
                          </div>

                          {invoiceLines.map((line, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-2 lg:grid-cols-5"
                            >
                              <Field label="Description" className="lg:col-span-2">
                                <input
                                  required
                                  value={line.description}
                                  onChange={(event) =>
                                    updateInvoiceLine(index, "description", event.target.value)
                                  }
                                  className={inputClass}
                                  placeholder="Product or service"
                                />
                              </Field>

                              {[
                                ["quantity", "Quantity", "0.001"],
                                ["unit_price", "Unit price (R)", "0.01"],
                                ["tax_rate", "Tax (%)", "0.01"],
                              ].map(([field, label, step]) => (
                                <Field key={field} label={label}>
                                  <input
                                    required
                                    type="number"
                                    min={field === "quantity" ? "0.001" : "0"}
                                    step={step}
                                    value={line[field]}
                                    onChange={(event) =>
                                      updateInvoiceLine(index, field, event.target.value)
                                    }
                                    className={inputClass}
                                  />
                                </Field>
                              ))}

                              {invoiceLines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setInvoiceLines((lines) =>
                                      lines.filter((_, i) => i !== index)
                                    )
                                  }
                                  className="flex items-center gap-1 text-left text-xs font-medium text-red-600 hover:text-red-700 lg:col-span-5"
                                >
                                  <Trash2 size={14} />
                                  Remove line
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label="Discount (R)">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={invoiceDiscount}
                              onChange={(event) => setInvoiceDiscount(event.target.value)}
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Notes">
                            <input
                              value={invoiceNotes}
                              onChange={(event) => setInvoiceNotes(event.target.value)}
                              className={inputClass}
                              placeholder="Optional notes"
                            />
                          </Field>
                        </div>

                        <div className="rounded-xl bg-blue-50 p-4 text-sm">
                          <div className="flex justify-between gap-3 py-1">
                            <span className="text-slate-600">Subtotal</span>
                            <span>{money(invoiceTotals.subtotal)}</span>
                          </div>
                          <div className="flex justify-between gap-3 py-1">
                            <span className="text-slate-600">Tax</span>
                            <span>{money(invoiceTotals.tax)}</span>
                          </div>
                          <div className="mt-2 flex justify-between gap-3 border-t border-blue-100 pt-3 text-base font-bold text-slate-900">
                            <span>Total</span>
                            <span>{money(invoiceTotal)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button type="submit" disabled={savingInvoice} className={primaryButton}>
                            {savingInvoice ? "Saving invoice..." : "Save invoice"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowInvoiceForm(false)}
                            className={secondaryButton}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
                      {invoices.length === 0 ? (
                        <div className="p-3 sm:p-4">
                          <EmptyState
                            title="No invoices yet"
                            description="Create your first invoice to start tracking customer balances."
                            action="Create your first invoice"
                            onAction={() => setShowInvoiceForm(true)}
                          />
                        </div>
                      ) : (
                        <TableWrap minWidth="850px">
                          <thead className="bg-blue-50 text-slate-600">
                            <tr>
                              {["Invoice", "Customer", "Issue date", "Due date", "Total", "Balance", "Status", "Action"].map((heading) => (
                                <th key={heading} className="whitespace-nowrap px-4 py-3 font-medium sm:px-5">
                                  {heading}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {invoices.map((invoice) => {
                              const customer = customers.find(
                                (item) => item.id === invoice.customer_id
                              );
                              const balance = Math.max(
                                0,
                                Number(invoice.total) - Number(invoice.amount_paid)
                              );

                              return (
                                <tr key={invoice.id} className="hover:bg-blue-50/40">
                                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900 sm:px-5">
                                    {invoice.invoice_number}
                                  </td>
                                  <td className="px-4 py-4 text-slate-600 sm:px-5">
                                    {customer?.name || "Walk-in customer"}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-4 text-slate-600 sm:px-5">
                                    {invoice.issue_date}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-4 text-slate-600 sm:px-5">
                                    {invoice.due_date || "—"}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-4 text-slate-700 sm:px-5">
                                    {money(invoice.total)}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-800 sm:px-5">
                                    {money(balance)}
                                  </td>
                                  <td className="px-4 py-4 sm:px-5">
                                    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                                      invoice.status === "paid"
                                        ? "bg-green-100 text-green-800"
                                        : invoice.status === "partial"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-blue-100 text-blue-800"
                                    }`}>
                                      {invoice.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 sm:px-5">
                                    {balance > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setInvoiceError("");
                                          setPaymentInvoice(invoice);
                                          setPaymentAmount(balance.toFixed(2));
                                        }}
                                        className="whitespace-nowrap text-xs font-semibold text-blue-600 hover:text-blue-800"
                                      >
                                        Record payment
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </TableWrap>
                      )}
                    </div>

                    {paymentInvoice && (
                      <form
                        onSubmit={handleRecordPayment}
                        className="space-y-4 rounded-2xl border border-blue-100 bg-white p-4 sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-slate-900">
                            Record payment for {paymentInvoice.invoice_number}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setPaymentInvoice(null)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                            aria-label="Close payment form"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <p className="text-sm text-slate-500">
                          Outstanding balance:{" "}
                          {money(Number(paymentInvoice.total) - Number(paymentInvoice.amount_paid))}
                        </p>
                        <Field label="Payment amount (R)">
                          <input
                            required
                            type="number"
                            min="0.01"
                            max={Math.max(
                              0,
                              Number(paymentInvoice.total) - Number(paymentInvoice.amount_paid)
                            )}
                            step="0.01"
                            value={paymentAmount}
                            onChange={(event) => setPaymentAmount(event.target.value)}
                            className={inputClass}
                          />
                        </Field>
                        <div className="flex flex-wrap gap-3">
                          <button type="submit" disabled={savingPayment} className={primaryButton}>
                            {savingPayment ? "Recording..." : "Save payment"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentInvoice(null)}
                            className={secondaryButton}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </section>
                )}

                {/* CUSTOMERS */}
                {activeTab === "customers" && (
                  <section className="space-y-5">
                    <PageHeading
                      title="Customers"
                      description="Manage your customers and their contact information."
                      action={
                        <button
                          type="button"
                          onClick={() => openCustomerForm()}
                          className={primaryButton}
                        >
                          <Plus size={17} />
                          Add customer
                        </button>
                      }
                    />

                    <Feedback type="success">{customerMessage}</Feedback>
                    {!showCustomerForm && <Feedback>{customerError}</Feedback>}

                    {showCustomerForm && (
                      <form
                        onSubmit={saveCustomer}
                        className="space-y-5 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {editingCustomer ? "Edit customer" : "New customer"}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomerForm(false);
                              setCustomerError("");
                            }}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            aria-label="Close customer form"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <Feedback>{customerError}</Feedback>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label="Full name *">
                            <input
                              required
                              name="name"
                              value={customerForm.name}
                              onChange={handleCustomerChange}
                              placeholder="e.g. John Smith"
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Company">
                            <input
                              name="company"
                              value={customerForm.company}
                              onChange={handleCustomerChange}
                              placeholder="Company name"
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Email address">
                            <input
                              type="email"
                              name="email"
                              value={customerForm.email}
                              onChange={handleCustomerChange}
                              placeholder="john@example.com"
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Phone number">
                            <input
                              type="tel"
                              name="phone"
                              value={customerForm.phone}
                              onChange={handleCustomerChange}
                              placeholder="+27 ..."
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Address">
                            <input
                              name="address"
                              value={customerForm.address}
                              onChange={handleCustomerChange}
                              placeholder="Street address"
                              className={inputClass}
                            />
                          </Field>
                          <Field label="City">
                            <input
                              name="city"
                              value={customerForm.city}
                              onChange={handleCustomerChange}
                              placeholder="e.g. Bloemfontein"
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Notes" className="sm:col-span-2">
                            <textarea
                              name="notes"
                              value={customerForm.notes}
                              onChange={handleCustomerChange}
                              rows={3}
                              placeholder="Additional information about this customer..."
                              className={inputClass}
                            />
                          </Field>
                        </div>

                        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                          <button type="submit" disabled={customerSaving} className={primaryButton}>
                            {customerSaving
                              ? "Saving..."
                              : editingCustomer
                                ? "Save changes"
                                : "Add customer"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCustomerForm(false)}
                            className={secondaryButton}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="rounded-2xl border border-blue-100 bg-white p-3 sm:p-4">
                      <div className="relative">
                        <Search
                          size={18}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="search"
                          value={customerSearch}
                          onChange={(event) => setCustomerSearch(event.target.value)}
                          placeholder="Search customers..."
                          aria-label="Search customers"
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>

                    {filteredCustomers.length > 0 ? (
                      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
                        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
                          <p className="text-sm text-slate-500">
                            {filteredCustomers.length} customer{filteredCustomers.length === 1 ? "" : "s"}
                          </p>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {filteredCustomers.map((customer) => (
                            <article
                              key={customer.id}
                              className="flex min-w-0 flex-col gap-4 p-4 transition hover:bg-blue-50/30 sm:p-5 lg:flex-row lg:items-center lg:justify-between"
                            >
                              <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                                  {customer.name?.trim()?.charAt(0)?.toUpperCase() || "C"}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <h3 className="break-words font-semibold text-slate-900">
                                    {customer.name}
                                  </h3>
                                  <p className="mt-0.5 break-words text-sm text-slate-500">
                                    {customer.company || "Individual customer"}
                                  </p>

                                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                                    {customer.email && (
                                      <p className="break-all">{customer.email}</p>
                                    )}
                                    {customer.phone && (
                                      <p className="break-words">{customer.phone}</p>
                                    )}
                                    {(customer.city || customer.address) && (
                                      <p className="break-words">
                                        {[customer.address, customer.city].filter(Boolean).join(", ")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
                                <button
                                  type="button"
                                  onClick={() => openCustomerForm(customer)}
                                  className={secondaryButton}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteCustomer(customer)}
                                  disabled={customerDeletingId === customer.id}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                >
                                  {customerDeletingId === customer.id ? (
                                    <LoaderCircle size={15} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={15} />
                                  )}
                                  Delete
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <EmptyState
                        title={customerSearch ? "No matching customers" : "No customers yet"}
                        description={
                          customerSearch
                            ? "Try a different search term."
                            : "Add your first customer to organise contact details and make invoicing easier."
                        }
                        action={customerSearch ? undefined : "Add your first customer"}
                        onAction={() => openCustomerForm()}
                      />
                    )}
                  </section>
                )}
                {activeTab === "performance" && (
  <BusinessPerformance
  data={records || {}}
  businessId={context?.business?.id}
  userId={context?.user?.id}
/>
)}
{activeTab === "expenses" && (
  <Expenses
    businessId={context?.business?.id}
    userId={context?.user?.id}
  />
)}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
