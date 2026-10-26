
import { useState, useEffect, useCallback } from "react";
import {
  Building2, Users, FileText, CreditCard, CheckSquare, ChevronRight,
  Plus, CheckCircle2, Circle, AlertCircle, Upload, Download, Trash2,
  Loader2, MapPin, Phone, Mail, TrendingUp, X, Bell, RefreshCw
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const BUCKET = "business-documents";

const initialForms = {
  business: {
    business_name: "",
    company_type: "",
    industry: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    province: "",
    founded_year: "",
  },
  cipc: { company_name: "", company_type: "Private Company (Pty Ltd)" },
  employee: {
    full_name: "",
    email: "",
    position: "",
    department: "",
    start_date: "",
    salary: "",
  },
  payment: {
    description: "",
    reference: "",
    related_to: "other",
    amount: "",
  },
  task: { title: "", description: "", category: "business_growth" },
};

const statusColors = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  uploaded: "bg-blue-100 text-blue-700",
  pending_review: "bg-yellow-100 text-yellow-800",
  under_review: "bg-yellow-100 text-yellow-800",
  action_required: "bg-orange-100 text-orange-800",
  approved: "bg-green-100 text-green-700",
  verified: "bg-green-100 text-green-700",
  active: "bg-green-100 text-green-700",
  paid: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-800",
  inactive: "bg-gray-100 text-gray-700",
};

const tabs = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "cipc", label: "CIPC Registration", icon: FileText },
  { id: "employees", label: "Employees", icon: Users },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "tasks", label: "Growth Tasks", icon: CheckSquare },
];

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", required = false, options, placeholder }) {
  const classes =
    "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {options ? (
        <select
          name={name}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          className={classes}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          placeholder={placeholder || ""}
          min={type === "number" ? "0" : undefined}
          className={classes}
        />
      )}
    </label>
  );
}

function EmptyState({ children }) {
  return <p className="py-10 text-center text-sm text-gray-400">{children}</p>;
}

const MyBusiness = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState("");
  const [form, setForm] = useState(initialForms.business);
  const [user, setUser] = useState(null);

  const completedTasks = tasks.filter((task) => task.is_completed).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!currentUser) {
        setUser(null);
        setBusiness(null);
        setError("Please log in to view your business.");
        return;
      }

      setUser(currentUser);

      const { data: biz, error: bizError } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      // A user without a business should still be able to create one.
      if (bizError) throw bizError;

      setBusiness(biz || null);

      if (!biz) {
        setRegistration(null);
        setEmployees([]);
        setDocuments([]);
        setPayments([]);
        setTasks([]);
        return;
      }

      const results = await Promise.all([
        supabase
          .from("business_registrations")
          .select("*")
          .eq("business_id", biz.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("employees")
          .select("*")
          .eq("business_id", biz.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("documents")
          .select("*")
          .eq("business_id", biz.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("payments")
          .select("*")
          .eq("business_id", biz.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("business_tasks")
          .select("*")
          .eq("business_id", biz.id)
          .order("created_at", { ascending: true }),
      ]);

      const labels = [
        "CIPC registration",
        "employees",
        "documents",
        "payments",
        "growth tasks",
      ];

      results.forEach((result, index) => {
        if (result.error) {
          throw new Error(`Could not load ${labels[index]}: ${result.error.message}`);
        }
      });

      setRegistration(results[0].data);
      setEmployees(results[1].data || []);
      setDocuments(results[2].data || []);
      setPayments(results[3].data || []);
      setTasks(results[4].data || []);
    } catch (err) {
      console.error("Business data loading error:", err);
      setError(err.message || "Failed to load business data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Realtime updates keep the displayed data fresh when database changes arrive.
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`my-business-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "businesses",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchAllData]);

  useEffect(() => {
    if (!business?.id) return;

    const channel = supabase
      .channel(`business-records-${business.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees", filter: `business_id=eq.${business.id}` },
        () => fetchAllData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents", filter: `business_id=eq.${business.id}` },
        () => fetchAllData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments", filter: `business_id=eq.${business.id}` },
        () => fetchAllData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "business_tasks", filter: `business_id=eq.${business.id}` },
        () => fetchAllData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "business_registrations", filter: `business_id=eq.${business.id}` },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business?.id, fetchAllData]);

  const notify = async (title, message, link = "/dashboard/my-business") => {
    if (!user?.id) return;

    // Notifications are optional; don't undo a successful action if the
    // notifications table or its policies aren't configured yet.
    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: user.id,
      title,
      message,
      type: "business_update",
      link,
      is_read: false,
    });

    if (notificationError) {
      console.warn("Could not create notification:", notificationError.message);
    }
  };

  const openForm = (type) => {
    setError("");
    setNotice("");
    setForm({ ...(initialForms[type] || {}) });
    setModal(type);
  };

  const changeForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (!user) {
      setError("Please log in before making changes.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (modal === "business") {
        const payload = {
          user_id: user.id,
          ...form,
          founded_year: form.founded_year ? Number(form.founded_year) : null,
        };

        const { error: insertError } = await supabase
          .from("businesses")
          .insert(payload);

        if (insertError) throw insertError;

        await notify("Business profile created", "Your business profile has been created.");
        setModal("");
        setNotice("Business profile created successfully.");
        await fetchAllData();
        return;
      }

      if (!business?.id) throw new Error("Create your business profile first.");

      if (modal === "cipc") {
        const { error: insertError } = await supabase
          .from("business_registrations")
          .insert({
            business_id: business.id,
            company_name: form.company_name,
            company_type: form.company_type,
            status: "draft",
            payment_status: "pending",
          });

        if (insertError) throw insertError;
        await notify("CIPC application started", "Your CIPC registration draft has been created.");
      }

      if (modal === "employee") {
        const { error: insertError } = await supabase.from("employees").insert({
          business_id: business.id,
          full_name: form.full_name,
          email: form.email || null,
          position: form.position,
          department: form.department || null,
          start_date: form.start_date || null,
          salary: form.salary === "" ? null : Number(form.salary),
          employment_status: "active",
        });

        if (insertError) throw insertError;
        await notify("Employee added", `${form.full_name} was added to your team.`);
      }

      if (modal === "payment") {
        const { error: insertError } = await supabase.from("payments").insert({
          business_id: business.id,
          description: form.description,
          reference: form.reference || null,
          related_to: form.related_to || "other",
          amount: Number(form.amount),
          status: "pending",
        });

        if (insertError) throw insertError;
        await notify("Payment recorded", `Payment record created: ${form.description}.`);
      }

      if (modal === "task") {
        const { error: insertError } = await supabase.from("business_tasks").insert({
          business_id: business.id,
          title: form.title,
          description: form.description || null,
          category: form.category || "business_growth",
          is_completed: false,
        });

        if (insertError) throw insertError;
        await notify("Growth task added", `New task: ${form.title}.`);
      }

      setModal("");
      setNotice("Your changes have been saved.");
      await fetchAllData();
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (taskId, currentStatus) => {
    const nextStatus = !currentStatus;
    const completedAt = nextStatus ? new Date().toISOString() : null;

    // Optimistic update makes the checkbox respond immediately.
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId
          ? { ...task, is_completed: nextStatus, completed_at: completedAt }
          : task
      )
    );

    const { error: updateError } = await supabase
      .from("business_tasks")
      .update({ is_completed: nextStatus, completed_at: completedAt })
      .eq("id", taskId);

    if (updateError) {
      setError(updateError.message);
      await fetchAllData();
      return;
    }

    const task = tasks.find((item) => item.id === taskId);
    await notify(
      nextStatus ? "Growth task completed" : "Growth task reopened",
      task?.title || "A growth task was updated."
    );
  };

  const downloadDocument = async (doc) => {
    setError("");
    try {
      if (!doc.file_url) throw new Error("This document does not have a stored file path.");

      // Also support records that already contain a public/external URL.
      if (/^https?:\/\//i.test(doc.file_url)) {
        window.open(doc.file_url, "_blank", "noopener,noreferrer");
        return;
      }

      const { data, error: urlError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.file_url, 60);

      if (urlError) throw urlError;
      if (!data?.signedUrl) throw new Error("Could not create a download link.");

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message || "Could not download this document.");
    }
  };

  const deleteDocument = async (doc) => {
    if (!window.confirm(`Delete "${doc.name}"? This action cannot be undone.`)) return;

    setError("");
    try {
      if (doc.file_url && !/^https?:\/\//i.test(doc.file_url)) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET)
          .remove([doc.file_url]);

        if (storageError) throw storageError;
      }

      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id)
        .eq("business_id", business.id);

      if (deleteError) throw deleteError;

      setDocuments((previous) => previous.filter((item) => item.id !== doc.id));
      setNotice("Document deleted successfully.");
      await notify("Document deleted", `${doc.name} was deleted.`);
    } catch (err) {
      setError(err.message || "Could not delete the document.");
    }
  };

  const statusBadge = (status) => (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        statusColors[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {String(status || "unknown").replaceAll("_", " ")}
    </span>
  );

  const renderModal = () => {
    if (!modal) return null;

    const titles = {
      business: "Create Business Profile",
      cipc: "Start CIPC Registration",
      employee: "Add Employee",
      payment: "Record Payment",
      task: "Add Growth Task",
    };

    let fields = [];

    if (modal === "business") {
      fields = [
        ["Business Name", "business_name", "text", true],
        ["Company Type", "company_type", "select", true, [
          { value: "Sole Proprietor", label: "Sole Proprietor" },
          { value: "Private Company (Pty Ltd)", label: "Private Company (Pty Ltd)" },
          { value: "Partnership", label: "Partnership" },
          { value: "Non-Profit Company", label: "Non-Profit Company" },
          { value: "Other", label: "Other" },
        ]],
        ["Industry", "industry", "text", false],
        ["Phone", "phone", "tel", false],
        ["Email", "email", "email", false],
        ["Address", "address", "text", false],
        ["City", "city", "text", false],
        ["Province", "province", "text", false],
        ["Founded Year", "founded_year", "number", false],
      ];
    } else if (modal === "cipc") {
      fields = [
        ["Company Name", "company_name", "text", true],
        ["Company Type", "company_type", "select", true, [
          { value: "Private Company (Pty Ltd)", label: "Private Company (Pty Ltd)" },
          { value: "Non-Profit Company", label: "Non-Profit Company" },
          { value: "Other", label: "Other" },
        ]],
      ];
    } else if (modal === "employee") {
      fields = [
        ["Full Name", "full_name", "text", true],
        ["Email", "email", "email", false],
        ["Position", "position", "text", true],
        ["Department", "department", "text", false],
        ["Start Date", "start_date", "date", false],
        ["Salary (ZAR)", "salary", "number", false],
      ];
    } else if (modal === "payment") {
      fields = [
        ["Description", "description", "text", true],
        ["Reference", "reference", "text", false],
        ["Related To", "related_to", "select", true, [
          { value: "cipc_registration", label: "CIPC Registration" },
          { value: "documents", label: "Documents" },
          { value: "employees", label: "Employees" },
          { value: "other", label: "Other" },
        ]],
        ["Amount (ZAR)", "amount", "number", true],
      ];
    } else if (modal === "task") {
      fields = [
        ["Task Title", "title", "text", true],
        ["Category", "category", "select", true, [
          { value: "business_growth", label: "Business Growth" },
          { value: "compliance", label: "Compliance" },
          { value: "finance", label: "Finance" },
          { value: "marketing", label: "Marketing" },
          { value: "other", label: "Other" },
        ]],
      ];
    }

    return (
      <Modal title={titles[modal]} onClose={() => !saving && setModal("")}>
        <form onSubmit={submitForm} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map(([label, name, type, required, options]) => (
              <Field
                key={name}
                label={label}
                name={name}
                type={type === "select" ? "text" : type}
                value={form[name]}
                onChange={changeForm}
                required={required}
                options={options}
              />
            ))}
          </div>

          {modal === "task" && (
            <label className="block text-sm font-medium text-gray-700">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={changeForm}
                rows={3}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModal("")}
              disabled={saving}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F0F7FF]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {loading && (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500">Loading your business...</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">{error}</div>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {!loading && notice && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="flex-1">{notice}</span>
              <button onClick={() => setNotice("")} aria-label="Dismiss message">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {!loading && (
            <div className="space-y-6">
              {/* Keep the original page header position and blue theme. */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {business?.business_name || "My Business"}
                  </h1>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Manage your business registration, team, documents and growth tasks
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {business && statusBadge(business.status || "active")}
                  <button
                    onClick={fetchAllData}
                    title="Refresh business data"
                    className="rounded-xl border border-blue-100 bg-white p-2.5 text-blue-600 hover:bg-blue-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Tabs stay visible even when a user has not created a business. */}
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="scrollbar-hide flex overflow-x-auto border-b border-gray-100">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? "border-b-2 border-blue-600 bg-blue-50/50 text-blue-600"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-5 sm:p-6">
                  {!business ? (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-5 py-12 text-center">
                      <Building2 className="mx-auto mb-3 h-12 w-12 text-blue-400" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        Create your business profile
                      </h2>
                      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                        Your business details will appear here. Create a profile to start
                        managing your registration, employees, documents, payments and tasks.
                      </p>
                      <button
                        onClick={() => openForm("business")}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        Create Business Profile
                      </button>
                    </div>
                  ) : (
                    <>
                      {activeTab === "overview" && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-blue-700">CIPC Status</p>
                                <FileText className="h-5 w-5 text-blue-500" />
                              </div>
                              <p className="mt-2 text-xl font-bold capitalize text-blue-900">
                                {registration?.status?.replaceAll("_", " ") || "Not started"}
                              </p>
                            </div>

                            <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-emerald-700">Employees</p>
                                <Users className="h-5 w-5 text-emerald-500" />
                              </div>
                              <p className="mt-2 text-xl font-bold text-emerald-900">{employees.length}</p>
                            </div>

                            <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-violet-100/50 p-4">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-violet-700">Documents</p>
                                <FileText className="h-5 w-5 text-violet-500" />
                              </div>
                              <p className="mt-2 text-xl font-bold text-violet-900">{documents.length}</p>
                            </div>

                            <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-amber-100/50 p-4">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-amber-700">Growth Progress</p>
                                <TrendingUp className="h-5 w-5 text-amber-500" />
                              </div>
                              <p className="mt-2 text-xl font-bold text-amber-900">{progressPercent}%</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="rounded-xl border border-gray-100 bg-white p-5 lg:col-span-2">
                              <h3 className="mb-4 font-semibold text-gray-900">Business Details</h3>
                              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                                {[
                                  ["Registration Number", business.registration_number],
                                  ["Company Type", business.company_type],
                                  ["Industry", business.industry],
                                  ["Founded", business.founded_year],
                                ].map(([label, value]) => (
                                  <div key={label}>
                                    <p className="text-gray-500">{label}</p>
                                    <p className="font-medium text-gray-900">{value || "—"}</p>
                                  </div>
                                ))}
                                <div className="sm:col-span-2">
                                  <p className="text-gray-500">Address</p>
                                  <p className="flex items-center gap-1.5 font-medium text-gray-900">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    {[business.address, business.city, business.province].filter(Boolean).join(", ") || "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Phone</p>
                                  <p className="flex items-center gap-1.5 font-medium text-gray-900">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    {business.phone || "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Email</p>
                                  <p className="flex items-center gap-1.5 font-medium text-gray-900">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    {business.email || "—"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-white p-5">
                              <h3 className="mb-1 font-semibold text-gray-900">Growth Progress</h3>
                              <p className="mb-4 text-sm text-gray-500">
                                {completedTasks} of {totalTasks} tasks completed
                              </p>
                              <div className="mb-4 h-3 w-full rounded-full bg-gray-100">
                                <div
                                  className="h-3 rounded-full bg-blue-600 transition-all duration-500"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <div className="space-y-2">
                                {tasks.slice(0, 4).map((task) => (
                                  <button
                                    key={task.id}
                                    onClick={() => toggleTask(task.id, task.is_completed)}
                                    className="flex w-full items-center gap-2 text-left text-sm"
                                  >
                                    {task.is_completed
                                      ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                                      : <Circle className="h-4 w-4 shrink-0 text-gray-300" />}
                                    <span className={task.is_completed ? "text-gray-400 line-through" : "text-gray-700"}>
                                      {task.title}
                                    </span>
                                  </button>
                                ))}
                                {!tasks.length && <p className="text-sm text-gray-400">No tasks yet</p>}
                              </div>
                              <button
                                onClick={() => setActiveTab("tasks")}
                                className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                              >
                                View all tasks <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="rounded-xl border border-gray-100 bg-white p-5">
                              <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Recent Documents</h3>
                                <button onClick={() => setActiveTab("documents")} className="text-sm text-blue-600 hover:underline">View all</button>
                              </div>
                              <div className="space-y-3">
                                {documents.slice(0, 3).map((doc) => (
                                  <div key={doc.id} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-gray-50">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                                      <FileText className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium text-gray-900">{doc.name}</p>
                                      <p className="text-xs capitalize text-gray-500">{doc.category || "Document"}</p>
                                    </div>
                                    <button onClick={() => downloadDocument(doc)} title="Download document" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50">
                                      <Download className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                                {!documents.length && <EmptyState>No documents yet</EmptyState>}
                              </div>
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-white p-5">
                              <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Recent Payments</h3>
                                <button onClick={() => setActiveTab("payments")} className="text-sm text-blue-600 hover:underline">View all</button>
                              </div>
                              <div className="space-y-3">
                                {payments.slice(0, 3).map((pay) => (
                                  <div key={pay.id} className="flex items-center justify-between gap-3 rounded-lg p-2.5 hover:bg-gray-50">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-gray-900">{pay.description}</p>
                                      <p className="text-xs text-gray-500">{pay.reference || "No reference"}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-gray-900">R{Number(pay.amount || 0).toFixed(2)}</p>
                                      {statusBadge(pay.status)}
                                    </div>
                                  </div>
                                ))}
                                {!payments.length && <EmptyState>No payments yet</EmptyState>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === "cipc" && (
                        <div className="space-y-6">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">CIPC Registration</h3>
                              <p className="text-sm text-gray-500">Track and manage your company registration with CIPC</p>
                            </div>
                            <button onClick={() => openForm("cipc")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                              <Plus className="h-4 w-4" /> Start Registration
                            </button>
                          </div>

                          {registration ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                              <div className="space-y-4 rounded-xl bg-gray-50 p-5">
                                <div className="flex items-center justify-between gap-3">
                                  <h4 className="font-medium text-gray-900">Application Details</h4>
                                  {statusBadge(registration.status)}
                                </div>
                                {[
                                  ["Company Name", registration.company_name],
                                  ["Company Type", registration.company_type],
                                  ["Payment Status", registration.payment_status],
                                  ["Submitted", registration.submitted_at ? new Date(registration.submitted_at).toLocaleDateString() : "—"],
                                ].map(([label, value]) => (
                                  <div key={label} className="flex items-center justify-between gap-4 text-sm">
                                    <span className="text-gray-500">{label}</span>
                                    <span className="text-right font-medium text-gray-900">{value || "—"}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-3 rounded-xl bg-gray-50 p-5">
                                <h4 className="font-medium text-gray-900">Directors</h4>
                                {registration.directors?.length ? registration.directors.map((director, index) => (
                                  <div key={index} className="flex items-center gap-3 rounded-lg bg-white p-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                      {director.full_name?.charAt(0) || "D"}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{director.full_name}</p>
                                      <p className="text-xs text-gray-500">{director.role || "Director"}</p>
                                    </div>
                                  </div>
                                )) : <EmptyState>No director details recorded</EmptyState>}
                              </div>
                            </div>
                          ) : (
                            <EmptyState>No CIPC registration started yet. Use “Start Registration” to create a draft.</EmptyState>
                          )}
                        </div>
                      )}

                      {activeTab === "employees" && (
                        <div className="space-y-5">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Employees</h3>
                              <p className="text-sm text-gray-500">{employees.length} team member{employees.length !== 1 ? "s" : ""}</p>
                            </div>
                            <button onClick={() => openForm("employee")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                              <Plus className="h-4 w-4" /> Add Employee
                            </button>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-100 text-left text-gray-500">
                                  {["Name", "Position", "Department", "Start Date", "Status", "Salary"].map((heading) => (
                                    <th key={heading} className="pb-3 pr-4 font-medium">{heading}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {employees.map((emp) => (
                                  <tr key={emp.id} className="hover:bg-gray-50/50">
                                    <td className="py-3.5 pr-4">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">{emp.full_name?.charAt(0) || "?"}</div>
                                        <div>
                                          <p className="font-medium text-gray-900">{emp.full_name}</p>
                                          <p className="text-xs text-gray-500">{emp.email || "—"}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3.5 pr-4 text-gray-700">{emp.position || "—"}</td>
                                    <td className="py-3.5 pr-4 text-gray-700">{emp.department || "—"}</td>
                                    <td className="py-3.5 pr-4 text-gray-700">{emp.start_date ? new Date(emp.start_date).toLocaleDateString() : "—"}</td>
                                    <td className="py-3.5 pr-4">{statusBadge(emp.employment_status)}</td>
                                    <td className="py-3.5 font-medium text-gray-900">R{Number(emp.salary || 0).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {!employees.length && <EmptyState>No employees added yet</EmptyState>}
                          </div>
                        </div>
                      )}

                      {activeTab === "documents" && (
                        <div className="space-y-5">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                              <p className="text-sm text-gray-500">{documents.length} document{documents.length !== 1 ? "s" : ""}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => navigate("/dashboard/documents")}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                            >
                              <Upload className="h-4 w-4" /> Upload Document
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {documents.map((doc) => (
                              <div key={doc.id} className="group rounded-xl bg-gray-50 p-4 transition hover:bg-gray-100">
                                <div className="flex items-start justify-between">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div className="flex gap-1">
                                    <button onClick={() => downloadDocument(doc)} title="Download" className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-blue-600">
                                      <Download className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => deleteDocument(doc)} title="Delete" className="rounded-lg p-1.5 text-red-500 hover:bg-white">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                                <p className="mt-3 truncate text-sm font-medium text-gray-900">{doc.name}</p>
                                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-500">
                                  <span className="capitalize">{doc.category || "Document"}</span>
                                  <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}</span>
                                </div>
                                {doc.verification_status && <div className="mt-3">{statusBadge(doc.verification_status)}</div>}
                                {doc.review_notes && <p className="mt-2 text-xs text-gray-500">{doc.review_notes}</p>}
                              </div>
                            ))}
                          </div>
                          {!documents.length && <EmptyState>No documents uploaded yet. Use “Upload Document” to get started.</EmptyState>}
                        </div>
                      )}

                      {activeTab === "payments" && (
                        <div className="space-y-5">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Payments</h3>
                              <p className="text-sm text-gray-500">Track all business-related payments</p>
                            </div>
                            <button onClick={() => openForm("payment")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                              <Plus className="h-4 w-4" /> Record Payment
                            </button>
                          </div>

                          <div className="space-y-3">
                            {payments.map((pay) => (
                              <div key={pay.id} className="flex flex-col justify-between gap-3 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center">
                                <div>
                                  <p className="font-medium text-gray-900">{pay.description}</p>
                                  <p className="mt-0.5 text-xs text-gray-500">{pay.reference || "No reference"} · {(pay.related_to || "other").replaceAll("_", " ")}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  {statusBadge(pay.status)}
                                  <p className="min-w-[90px] text-right font-semibold text-gray-900">R{Number(pay.amount || 0).toFixed(2)}</p>
                                </div>
                              </div>
                            ))}
                            {!payments.length && <EmptyState>No payments recorded yet</EmptyState>}
                          </div>
                        </div>
                      )}

                      {activeTab === "tasks" && (
                        <div className="space-y-5">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Growth Tasks</h3>
                              <p className="text-sm text-gray-500">{completedTasks} of {totalTasks} completed ({progressPercent}%)</p>
                            </div>
                            <button onClick={() => openForm("task")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                              <Plus className="h-4 w-4" /> Add Custom Task
                            </button>
                          </div>

                          <div className="h-2.5 w-full rounded-full bg-gray-100">
                            <div className="h-2.5 rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                          </div>

                          <div className="space-y-2">
                            {tasks.map((task) => (
                              <div key={task.id} className={`flex items-center gap-3 rounded-xl border p-4 transition ${task.is_completed ? "border-green-100 bg-green-50/50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                                <button onClick={() => toggleTask(task.id, task.is_completed)} aria-label={task.is_completed ? "Mark task incomplete" : "Mark task complete"} className="shrink-0">
                                  {task.is_completed
                                    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    : <Circle className="h-5 w-5 text-gray-300 hover:text-blue-500" />}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm font-medium ${task.is_completed ? "text-gray-400 line-through" : "text-gray-900"}`}>{task.title}</p>
                                  {task.description && <p className="mt-0.5 text-xs text-gray-500">{task.description}</p>}
                                </div>
                                <span className="hidden text-xs capitalize text-gray-400 sm:block">{task.category?.replaceAll("_", " ")}</span>
                              </div>
                            ))}
                            {!tasks.length && <EmptyState>No tasks yet. Add a growth task to track your progress.</EmptyState>}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {renderModal()}
    </div>
  );
};

export default MyBusiness;
