
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  ImagePlus,
  LoaderCircle,
  Save,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import useBusinessProfile from "../hooks/useBusinessProfile";

const initialForm = {
  business_name: "",
  registration_number: "",
  industry: "",
  description: "",
  website: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  province: "",
  country: "South Africa",
  logo_url: "",
  founded_year: "",
  employee_count: "",
};

const inputClass =
  "mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "text-sm font-medium text-gray-700";

export default function BusinessProfile() {
  const navigate = useNavigate();

  const {
    profile,
    loading,
    saving,
    error,
    saveProfile,
  } = useBusinessProfile();

  const [form, setForm] = useState(initialForm);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Populate the form whenever the existing database profile loads.
  useEffect(() => {
    if (!profile) return;

    setForm({
      business_name: profile.business_name || "",
      registration_number: profile.registration_number || "",
      industry: profile.industry || "",
      description: profile.description || "",
      website: profile.website || "",
      phone: profile.phone || "",
      email: profile.email || "",
      address: profile.address || "",
      city: profile.city || "",
      province: profile.province || "",
      country: profile.country || "South Africa",
      logo_url: profile.logo_url || "",
      founded_year: profile.founded_year?.toString() || "",
      employee_count: profile.employee_count || "",
    });

    setLogoPreview(profile.logo_url || "");
    setLogoFile(null);
  }, [profile]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setFormError("");
    setMessage("");

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setFormError("Please upload a PNG, JPG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFormError("Your logo must be smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (userId) => {
    if (!logoFile) return form.logo_url;

    const extension = logoFile.name.split(".").pop()?.toLowerCase() || "png";
    const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("business-logos")
      .upload(filePath, logoFile, {
        upsert: false,
        contentType: logoFile.type,
      });

    if (uploadError) {
      throw new Error(`Logo upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from("business-logos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setMessage("");

    const businessName = form.business_name.trim();

    if (!businessName) {
      setFormError("Business name is required.");
      return;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError("Please enter a valid business email address.");
      return;
    }

    if (form.website) {
      try {
        new URL(
          /^https?:\/\//i.test(form.website)
            ? form.website
            : `https://${form.website}`
        );
      } catch {
        setFormError("Please enter a valid website URL.");
        return;
      }
    }

    let foundedYear = null;

    if (form.founded_year.trim()) {
      foundedYear = Number(form.founded_year);

      if (
        !Number.isInteger(foundedYear) ||
        foundedYear < 1000 ||
        foundedYear > 9999
      ) {
        setFormError("Please enter a valid four-digit founding year.");
        return;
      }
    }

    setUploading(Boolean(logoFile));

    try {
      // Always use the currently authenticated user's ID.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please sign in again to update your business profile.");
      }

      const logoUrl = await uploadLogo(user.id);

      const payload = {
        business_name: businessName,
        registration_number: form.registration_number.trim() || null,
        industry: form.industry.trim() || null,
        description: form.description.trim() || null,
        website: form.website.trim()
          ? (/^https?:\/\//i.test(form.website.trim())
              ? form.website.trim()
              : `https://${form.website.trim()}`)
          : null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        province: form.province.trim() || null,
        country: form.country.trim() || "South Africa",
        logo_url: logoUrl || null,
        founded_year: foundedYear,
        employee_count: form.employee_count || null,
      };

      // The hook upserts by user_id, updating an existing profile
      // or creating a new one when the user has no profile yet.
      const result = await saveProfile(payload);

      if (result?.error) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : result.error.message || "Could not save your business profile."
        );
      }

      setLogoFile(null);
      setMessage("Business profile saved successfully.");

      // Return to the dashboard after a successful save.
      window.setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 800);
    } catch (err) {
      setFormError(
        err.message || "Something went wrong while saving your profile."
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-sm text-gray-600">
          Loading your business profile...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <div className="mb-6">
          <p className="text-sm font-semibold text-blue-600">
            BUSINESS SETTINGS
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            {profile ? "Edit Business Profile" : "Set Up Your Business"}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {profile
              ? "Update your business information whenever it changes."
              : "Add your business details to personalise your dashboard."}
          </p>
        </div>

        {(formError || error) && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {formError || error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company logo */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  Company branding
                </h2>
                <p className="text-sm text-gray-500">
                  Add or replace your business logo.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Business logo preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="h-10 w-10 text-blue-500" />
                )}
              </div>

              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                  <ImagePlus className="h-4 w-4" />
                  Upload logo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoChange}
                    className="sr-only"
                  />
                </label>

                <p className="mt-2 text-xs text-gray-500">
                  PNG, JPG, or WebP. Maximum size: 2 MB.
                </p>
              </div>
            </div>
          </section>

          {/* Required and general business information */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 font-semibold text-gray-900">
              Business information
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="business_name" className={labelClass}>
                  Business name <span className="text-red-500">*</span>
                </label>
                <input
                  id="business_name"
                  name="business_name"
                  value={form.business_name}
                  onChange={handleChange}
                  required
                  autoComplete="organization"
                  className={inputClass}
                  placeholder="Enter your business name"
                />
              </div>

              <div>
                <label htmlFor="registration_number" className={labelClass}>
                  Registration number
                </label>
                <input
                  id="registration_number"
                  name="registration_number"
                  value={form.registration_number}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 2026/123456/07"
                />
              </div>

              <div>
                <label htmlFor="industry" className={labelClass}>
                  Industry
                </label>
                <input
                  id="industry"
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Retail"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className={labelClass}>
                  Business description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className={inputClass}
                  placeholder="Describe what your business does"
                />
              </div>

              <div>
                <label htmlFor="founded_year" className={labelClass}>
                  Year established
                </label>
                <input
                  id="founded_year"
                  name="founded_year"
                  type="number"
                  min="1000"
                  max="9999"
                  value={form.founded_year}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 2022"
                />
              </div>

              <div>
                <label htmlFor="employee_count" className={labelClass}>
                  Number of employees
                </label>
                <select
                  id="employee_count"
                  name="employee_count"
                  value={form.employee_count}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select a range</option>
                  <option value="1-5">1–5 employees</option>
                  <option value="6-10">6–10 employees</option>
                  <option value="11-50">11–50 employees</option>
                  <option value="51-200">51–200 employees</option>
                  <option value="201+">201+ employees</option>
                </select>
              </div>
            </div>
          </section>

          {/* Contact information */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 font-semibold text-gray-900">
              Contact information
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className={labelClass}>
                  Business email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className={inputClass}
                  placeholder="business@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  className={inputClass}
                  placeholder="+27 ..."
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="website" className={labelClass}>
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  value={form.website}
                  onChange={handleChange}
                  autoComplete="url"
                  className={inputClass}
                  placeholder="www.example.co.za"
                />
              </div>
            </div>
          </section>

          {/* Business address */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 font-semibold text-gray-900">
              Business address
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="address" className={labelClass}>
                  Street address
                </label>
                <input
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  autoComplete="street-address"
                  className={inputClass}
                  placeholder="Street address"
                />
              </div>

              <div>
                <label htmlFor="city" className={labelClass}>
                  City or town
                </label>
                <input
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  autoComplete="address-level2"
                  className={inputClass}
                  placeholder="e.g. Bloemfontein"
                />
              </div>

              <div>
                <label htmlFor="province" className={labelClass}>
                  Province
                </label>
                <select
                  id="province"
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select a province</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                  <option value="Free State">Free State</option>
                  <option value="Gauteng">Gauteng</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Limpopo">Limpopo</option>
                  <option value="Mpumalanga">Mpumalanga</option>
                  <option value="Northern Cape">Northern Cape</option>
                  <option value="North West">North West</option>
                  <option value="Western Cape">Western Cape</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="country" className={labelClass}>
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  autoComplete="country-name"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Form actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving || uploading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {uploading
                ? "Uploading logo..."
                : saving
                  ? "Saving..."
                  : profile
                    ? "Save Changes"
                    : "Create Business Profile"}
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Fields marked with <span className="text-red-500">*</span> are
            required.
          </p>
        </form>
      </div>
    </div>
  );
}
