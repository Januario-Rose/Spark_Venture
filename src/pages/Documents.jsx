import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Upload,
  FileText,
  Download,
  RefreshCw,
  ShieldCheck,
  Clock3,
  AlertCircle,
  CheckCircle2,
  XCircle,
  LoaderCircle,
} from "lucide-react";

const BUCKET = "business-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const categories = [
  "CIPC Registration Certificate",
  "Identity Document",
  "Proof of Address",
  "Tax Clearance",
  "B-BBEE Certificate",
  "Bank Confirmation",
  "Other",
];

const statusDetails = {
  uploaded: {
    label: "Uploaded",
    className: "bg-slate-100 text-slate-700",
    Icon: Clock3,
  },
  pending_review: {
    label: "Pending review",
    className: "bg-amber-100 text-amber-800",
    Icon: Clock3,
  },
  under_review: {
    label: "Under review",
    className: "bg-blue-100 text-blue-800",
    Icon: RefreshCw,
  },
  verified: {
    label: "Verified",
    className: "bg-emerald-100 text-emerald-800",
    Icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800",
    Icon: XCircle,
  },
  action_required: {
    label: "Action required",
    className: "bg-orange-100 text-orange-800",
    Icon: AlertCircle,
  },
};

function StatusBadge({ status }) {
  const details = statusDetails[status] || statusDetails.pending_review;
  const Icon = details.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${details.className}`}
    >
      <Icon size={14} />
      {details.label}
    </span>
  );
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Documents() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [category, setCategory] = useState(categories[0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const loadDocuments = useCallback(async (currentUser, currentBusiness) => {
    if (!currentUser || !currentBusiness) {
      setDocuments([]);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", currentUser.id)
      .eq("business_id", currentBusiness.id)
      .order("created_at", { ascending: false });

    if (queryError) throw queryError;

    setDocuments(data || []);
  }, []);

  useEffect(() => {
    let active = true;

    async function initialise() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!currentUser) {
          if (active) {
            setError("Please sign in to manage your documents.");
          }
          return;
        }

        const { data: currentBusiness, error: businessError } =
          await supabase
            .from("businesses")
            .select("*")
            .eq("user_id", currentUser.id)
            .maybeSingle();

        if (businessError) throw businessError;

        if (!active) return;

        setUser(currentUser);
        setBusiness(currentBusiness);

        if (!currentBusiness) {
          setDocuments([]);
          return;
        }

        await loadDocuments(currentUser, currentBusiness);
      } catch (err) {
        if (active) {
          setError(err.message || "Could not load your documents.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initialise();

    return () => {
      active = false;
    };
  }, [loadDocuments]);

  useEffect(() => {
    if (!user || !business) return;

    const channel = supabase
      .channel(`documents-live-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          try {
            await loadDocuments(user, business);
          } catch (err) {
            setError(err.message || "Could not refresh document statuses.");
          }
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      setRealtimeConnected(false);
    };
  }, [user, business, loadDocuments]);

  async function handleUpload(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!user || !business) {
      setError("Create your business profile before uploading documents.");
      return;
    }

    if (!selectedFile) {
      setError("Please choose a file first.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("The maximum file size is 10 MB.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Upload a PDF, JPG, or PNG file.");
      return;
    }

    setUploading(true);

    let storagePath = null;

    try {
      const safeName = selectedFile.name
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(-120);

      storagePath =
        `${user.id}/${business.id}/${crypto.randomUUID()}-${safeName}`;

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });

      if (storageError) throw storageError;

      const { error: insertError } = await supabase
        .from("documents")
        .insert({
          business_id: business.id,
          user_id: user.id,
          name: selectedFile.name,
          category,
          file_url: storagePath,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          uploaded_by: user.email || user.id,
          verification_status: "pending_review",
        });

      if (insertError) throw insertError;

      setSelectedFile(null);
      event.target.reset();

      await loadDocuments(user, business);
      setSuccess(
        "Document uploaded successfully. It is now awaiting review."
      );
    } catch (err) {
      // Remove the uploaded file if its database record could not be saved.
      if (storagePath) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }

      setError(err.message || "Document upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(document) {
    setError("");
    setDownloadingId(document.id);

    try {
      const path = document.file_url;

      // New uploads store a private Storage path in file_url.
      // Existing records may contain older public or signed URLs.
      if (!path || /^https?:\/\//i.test(path)) {
        if (!path) throw new Error("No file location is saved.");

        window.open(path, "_blank", "noopener,noreferrer");
        return;
      }

      const { data, error: urlError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60);

      if (urlError) throw urlError;

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message || "Could not open this document.");
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-600">
        <LoaderCircle className="animate-spin" size={22} />
        Loading documents...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F0F7FF]">
    <Sidebar />

    <div className="flex min-w-0 flex-1 flex-col">
      <Header />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-blue-700">
            <ShieldCheck size={18} />
            Document management and KYC
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Documents
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Upload your business documents and follow their verification
            progress in one place.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              realtimeConnected ? "bg-emerald-500" : "bg-amber-400"
            }`}
          />
          {realtimeConnected ? "Live updates connected" : "Connecting to updates"}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {success}
        </div>
      )}

      {!business ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <FileText className="mx-auto mb-4 text-slate-400" size={38} />
          <h2 className="text-lg font-semibold text-slate-900">
            Set up your business first
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Once you have created a business profile, you can upload
            documents and track their verification status here.
          </p>
          <a
            href="/business-profile"
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create business profile
          </a>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: "Total documents",
                count: documents.length,
                color: "text-slate-900",
              },
              {
                label: "Awaiting review",
                count: documents.filter((d) =>
                  ["uploaded", "pending_review", "under_review"].includes(
                    d.verification_status
                  )
                ).length,
                color: "text-amber-700",
              },
              {
                label: "Verified",
                count: documents.filter(
                  (d) => d.verification_status === "verified"
                ).length,
                color: "text-emerald-700",
              },
              {
                label: "Action required",
                count: documents.filter((d) =>
                  ["rejected", "action_required"].includes(
                    d.verification_status
                  )
                ).length,
                color: "text-red-700",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
              >
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className={`mt-2 text-2xl font-bold ${item.color}`}>
                  {item.count}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Upload a document
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Accepted formats: PDF, JPG and PNG. Maximum size: 10 MB.
              </p>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="document-category"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Document type
                  </label>
                  <select
                    id="document-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="document-file"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Select file
                  </label>
                  <input
                    id="document-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(event) =>
                      setSelectedFile(event.target.files?.[0] || null)
                    }
                    className="block w-full rounded-xl border border-slate-300 bg-white text-sm file:mr-4 file:border-0 file:bg-blue-50 file:px-4 file:py-3 file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              {selectedFile && (
                <p className="text-sm text-slate-500">
                  Selected: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}

              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <Upload size={18} />
                )}
                {uploading ? "Uploading..." : "Upload document"}
              </button>
            </form>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Your documents
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review progress updates as authorised reviewers process
                your submissions.
              </p>
            </div>

            {documents.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <FileText
                  className="mx-auto mb-3 text-slate-300"
                  size={40}
                />
                <h3 className="font-semibold text-slate-800">
                  No documents yet
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Uploaded documents will appear here with their review status.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                        <FileText size={22} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-slate-900">
                          {document.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {document.category || "Uncategorised"} · Uploaded{" "}
                          {formatDate(document.created_at)}
                        </p>
                        {document.file_size != null && (
                          <p className="mt-1 text-xs text-slate-400">
                            {(document.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                        {document.review_notes && (
                          <p className="mt-2 text-sm text-orange-800">
                            Reviewer note: {document.review_notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <StatusBadge status={document.verification_status} />
                      <button
                        type="button"
                        onClick={() => handleDownload(document)}
                        disabled={downloadingId === document.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Download size={16} />
                        {downloadingId === document.id
                          ? "Opening..."
                          : "View"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
      </main>
    </div>
  </div>
);
}
