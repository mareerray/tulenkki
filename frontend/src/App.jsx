import { useRef, useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { FiLogOut } from "react-icons/fi";
import { WelcomeDialog, AboutPage } from "./AppInfo";
import Login from "./Login";
import AddWalkForm from "./AddWalkForm";
import WalksList from "./WalksList";
import WalksCalendar from "./WalksCalendar";
import WalksAnalytics from "./WalksAnalytics";
import Footer from "./Footer";
import "./App.css";

function WalkingLogo() {
  return (
    <div className="walking-logo">
      <img
        className="app-logo"
        src="/tulenkki-logo.png"
        alt=""
      />

      <div className="walking-logo-text">
        <h1>Tulenkki</h1>
        <p className="app-tagline">Your gentle walking journal</p>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const dialogRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [view, setView] = useState("list"); // "list" or "calendar"
  const [editingWalk, setEditingWalk] = useState(null);
  const [formKey, setFormKey] = useState(0); // To reset the form when editing a walk

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  function openAddWalk() {
    setNotice("");
    setEditingWalk(null); // Clear any walk being edited
    setFormKey((current) => current + 1); // Reset the form
    dialogRef.current.showModal();
  }

  function handleEdit(walk) {
    setNotice("");
    setEditingWalk(walk);
    setFormKey((current) => current + 1); // Reset the form
    dialogRef.current.showModal();
  }

  function closeAddWalk() {
    dialogRef.current.close();
  }

  function handleWalkAdded() {
    setRefreshKey((current) => current + 1);
    setNotice(editingWalk ? "Walk updated!" : "Walk saved!");
    closeAddWalk();
  }

  async function handleSignOut() {
      const { error } = await supabase.auth.signOut();

      if (error) {
          setNotice("Could not sign out. Please try again.");
          return;
      }

      if (session?.user?.id) {
          sessionStorage.removeItem(
              `tulenkki-welcome-${session.user.id}`
          );
      }

      setSession(null);
  }

  const demoEmail = import.meta.env.VITE_DEMO_EMAIL;

  const isDemo = Boolean(
    session?.user?.email &&
    demoEmail &&
    session.user.email.toLowerCase() === demoEmail.toLowerCase()
  );

  if (checkingSession) {
    return <main><p>Loading...</p></main>;
  }

  if (!session) {
    return (
      <main>
        <WalkingLogo />
        <Login />
      </main>
    );
  }

  return (
    <>
      <main>
        <WelcomeDialog
          key={session.user.id}
          userId={session.user.id}
          isDemo={isDemo}
        />
        <header className="app-header">
          <div className="app-header-inner">
            <WalkingLogo />
            <button
              className="sign-out-icon-button"
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <FiLogOut aria-hidden="true" />
            </button>
          </div>
        </header>

        <p className="page-notice" role="status">
          {notice}
        </p>
        {view === "about" ? (
          <AboutPage onBack={() => setView("list")} />
        ) : (
          <section aria-labelledby="walks-heading">
            <h2 id="walks-heading">My walks</h2>

            {/* View switcher */}
            <div className="walk-view-switch" role="group" aria-label="Walk view">
              <button
                type="button"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                List
              </button>

              <button
                type="button"
                aria-pressed={view === "calendar"}
                onClick={() => setView("calendar")}
              >
                Calendar
              </button>

              <button
                type="button"
                aria-pressed={view === "analytics"}
                onClick={() => setView("analytics")}
              >
                Analytics
              </button>
            </div>

            {/* View content */}
            {/* && means “render this component only when its condition is true.” */}
            {view === "list" && (
              <WalksList key={`list-${refreshKey}`}
                onEdit={handleEdit} />
            )}

            {view === "calendar" && (
              <WalksCalendar key={`calendar-${refreshKey}`} />
            )}

            {view === "analytics" && (
              <WalksAnalytics key={`analytics-${refreshKey}`} />
            )}
          </section>
        )}

        {view !== "about" && (
          <button
            className="add-walk-fab"
            type="button"
            onClick={openAddWalk}
            aria-label="Add a walk"
            aria-haspopup="dialog"
            aria-controls="add-walk-dialog"
          >
            <span aria-hidden="true">+</span>
          </button>
        )}

        {/* Add Walk Dialog */}
        <dialog
          id="add-walk-dialog"
          className="walk-dialog"
          ref={dialogRef}
          aria-labelledby="add-walk-heading"
        >
          <div className="dialog-header">
            <h2 id="add-walk-heading">
              {editingWalk ? "Edit a walk" : "Add a walk"}
            </h2>

            <button
              className="dialog-close"
              type="button"
              onClick={closeAddWalk}
              aria-label="Close walk form"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <AddWalkForm
            key={formKey}
            walk={editingWalk}
            onWalkAdded={handleWalkAdded} />
        </dialog>
      </main>
      <Footer 
        linkedinUrl="https://www.linkedin.com/in/mayuree-reunsati" 
        onAbout={() => {
          setView("about");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </>
  );
}