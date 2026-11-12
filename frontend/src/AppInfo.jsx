import { useEffect, useRef } from "react";
import "./AppInfo.css";

export function WelcomeDialog({ userId, isDemo }) {
    const dialogRef = useRef(null);

    useEffect(() => {
        const storageKey = `tulenkki-welcome-${userId}`;
        const dialog = dialogRef.current;

        if (sessionStorage.getItem(storageKey) !== "seen") {
            dialog.showModal();
        }

        return () => {
            if (dialog.open) {
                dialog.close();
            }
        };
    }, [userId]);

    function markAsSeen() {
        sessionStorage.setItem(
            `tulenkki-welcome-${userId}`,
            "seen"
        );
    }

    function closeWelcome() {
        markAsSeen();
        dialogRef.current.close();
    }

    return (
        <dialog
            ref={dialogRef}
            className="info-dialog"
            aria-labelledby="welcome-heading"
            aria-describedby="welcome-description"
            onClose={markAsSeen}
        >
            <div className="info-dialog-header">
                <h2 id="welcome-heading">Welcome to Tulenkki</h2>

                <button
                    className="info-close"
                    type="button"
                    onClick={closeWelcome}
                    aria-label="Close welcome"
                >
                    <span aria-hidden="true">×</span>
                </button>
            </div>

            <p id="welcome-description">
                Your gentle walking journal. Record your walks,
                follow your routine, and see your progress.
            </p>

            <ol className="info-steps">
                <li>
                    Press <strong>+</strong> to add a walk.
                </li>
                <li>
                    Follow your cycle in <strong>List</strong>,
                    or browse dates in <strong>Calendar</strong>.
                </li>
                <li>
                    See your progress in <strong>Analytics</strong>.
                </li>
            </ol>

            <p>
                Your routine: six walking days, then two rest days.
            </p>

            {isDemo && (
                <aside className="info-demo-note">
                    <h3>You’re trying the demo</h3>
                    <p>
                        Explore the sample walks, or try adding,
                        editing, and deleting a record.
                        This account is shared, so please don’t
                        enter personal information.
                    </p>
                </aside>
            )}

            <p className="info-hint">
                You can find more help under “About Tulenkki”
                in the footer.
            </p>

            <button
                className="info-primary-button"
                type="button"
                onClick={closeWelcome}
                autoFocus
            >
                Let’s begin
            </button>
        </dialog>
    );
}

export function AboutPage({ onBack }) {
    return (
        <article className="about-page page-transition" aria-labelledby="about-heading">
            <button
                className="info-back-button"
                type="button"
                onClick={onBack}
            >
                ← Back to my walks
            </button>

            <h2 id="about-heading" tabIndex={-1} autoFocus>
                About Tulenkki
            </h2>

            <p className="about-intro">
                Your gentle walking journal.
            </p>

            <p>
                Tulenkki helps you record your walks, follow a
                walking-and-rest routine, and look back on your
                progress. It’s a personal journal, not a competition.
            </p>

            <section>
                <h3>Your walking routine</h3>
                <p>
                    The current routine starts on 16 October 2026.
                    Each cycle has six consecutive walking days,
                    followed by two rest days.
                </p>
                <p>
                    The schedule is a guide. A recorded walk
                    describes what you actually did.
                </p>
            </section>

            <section>
                <h3>Record a walk</h3>
                <p>
                    Press the + button and enter the date and
                    duration. Distance and notes are optional.
                    You can edit or delete records in List.
                </p>
            </section>

            <section>
                <h3>Explore your journal</h3>
                <ul className="about-features">
                    <li>
                        <strong>List:</strong> follow your eight-day
                        cycle and manage your recorded walks.
                    </li>
                    <li>
                        <strong>Calendar:</strong> select a date to
                        see its walks. Pink shoes mark scheduled
                        walking days with a recording. Muted shoes
                        mark scheduled walking days without one.
                    </li>
                    <li>
                        <strong>Analytics:</strong> review your
                        walking progress over time.
                    </li>
                </ul>
            </section>

            <section className="info-demo-note">
                <h3>About the demo</h3>
                <p>
                    Choose “Try demo” on the sign-in screen to
                    explore the app with sample data.
                </p>
                <p>
                    The demo account is shared. Records you add,
                    edit, or delete may be visible to other visitors.
                    Please use fictional notes and don’t enter
                    personal information.
                </p>
            </section>

            <section>
                <h3>Built by Mayuree Reunsati</h3>
                <p>
                    I built Tulenkki to practise full-stack
                    development with React, Python, Flask,
                    PostgreSQL, Supabase, and Docker.
                </p>
            </section>
        </article>
    );
}