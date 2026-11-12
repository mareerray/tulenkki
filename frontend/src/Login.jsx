import { useState } from "react";
import { supabase } from "./supabaseClient";

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD;
const REMEMBERED_EMAIL_KEY = "tulenkki-email";

export default function Login() {
    const [email, setEmail] = useState(
        () => localStorage.getItem(REMEMBERED_EMAIL_KEY) || ""
    );
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleEmailChange(event) {
        const newEmail = event.target.value;
        setEmail(newEmail);
        localStorage.setItem(REMEMBERED_EMAIL_KEY, newEmail);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            setError(error.message);
            return;
        }
    }

    async function handleDemoSignIn() {
        setError("");
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
        });

        setLoading(false);

        if (error) {
            setError(error.message);
        }
    }

    return (
        <section className="login-section">
            <h2>Welcome back</h2>
            <p className="login-subtitle">
                Sign in to continue your walking journal.
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        autoComplete="email"
                        required
                    />
                </label>

                <label>
                    Password
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </label>

                <button className="login-button" type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                </button>
            </form>

            <button
                className="login-demo-button"
                type="button"
                onClick={handleDemoSignIn}
                disabled={loading}
            >
                Try demo
            </button>

            {error && (
                <p className="login-error" role="alert">
                    {error}
                </p>
            )}
        </section>
    );
}