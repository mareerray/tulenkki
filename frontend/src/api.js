import { supabase } from "./supabaseClient";

const API_URL = import.meta.env.VITE_API_URL || "";

export async function apiFetch(path, options = {}) {
    const { data, error } = await supabase.auth.getSession();

    // getSession() gives us the current session, refreshing it if necessary. Here we use it only to retrieve the token; Flask remains responsible for verifying it and deciding whether access is allowed

    if (error) {
        throw error;
    }

    if (!data.session) {
        throw new Error("Please sign in to continue.");
    }

    const headers = new Headers(options.headers);
    headers.set(
        "Authorization",
        `Bearer ${data.session.access_token}`
    );

    return fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });
}