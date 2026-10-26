
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function useBusinessProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load the business profile belonging to the logged-in user.
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setProfile(null);
        return null;
      }

      const { data, error: queryError } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (queryError) throw queryError;

      setProfile(data);
      return data;
    } catch (err) {
      const message =
        err?.message || "Unable to load business profile.";

      setError(message);
      setProfile(null);

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new profile or update the existing profile.
  const saveProfile = useCallback(async (formData) => {
    setSaving(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Please log in to save your business profile.");
      }

      // Never accept user_id from form input.
      const {
        user_id: ignoredUserId,
        id: ignoredId,
        created_at: ignoredCreatedAt,
        updated_at: ignoredUpdatedAt,
        ...editableFields
      } = formData;

      const payload = {
        ...editableFields,
        user_id: user.id,
      };

      const { data, error: saveError } = await supabase
        .from("business_profiles")
        .upsert(payload, {
          onConflict: "user_id",
        })
        .select("*")
        .single();

      if (saveError) throw saveError;

      setProfile(data);

      return { data, error: null };
    } catch (err) {
      const message =
        err?.message || "Unable to save business profile.";

      setError(message);

      return { data: null, error: message };
    } finally {
      setSaving(false);
    }
  }, []);

  // Delete the current user's business profile.
  const deleteProfile = useCallback(async () => {
    setSaving(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Please log in first.");
      }

      const { error: deleteError } = await supabase
        .from("business_profiles")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      setProfile(null);

      return { error: null };
    } catch (err) {
      const message =
        err?.message || "Unable to delete business profile.";

      setError(message);

      return { error: message };
    } finally {
      setSaving(false);
    }
  }, []);

  // Fetch the profile when the hook is first used.
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    saving,
    error,
    fetchProfile,
    saveProfile,
    deleteProfile,
  };
}
