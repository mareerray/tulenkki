import { useRef, useState } from "react";
import "./App.css";
import AddWalkForm from "./AddWalkForm";
import WalksList from "./WalksList";
import WalksCalendar from "./WalksCalendar";

function WalkingLogo() {
  return (
    <header className="app-header">
      <img
        className="app-logo"
        src="/tulenkki-logo.png"
        alt=""
      />

      <div>
        <h1>Tulenkki</h1>
        <p className="app-tagline">Your gentle walking journal</p>
      </div>
    </header>
  );
}

export default function App() {
  const dialogRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [view, setView] = useState("list"); // "list" or "calendar"

  function openAddWalk() {
    setNotice("");
    dialogRef.current.showModal();
  }

  function closeAddWalk() {
    dialogRef.current.close();
  }

  function handleWalkAdded() {
    setRefreshKey((current) => current + 1);
    setNotice("Walk saved!");
    closeAddWalk();
  }

  return (
    <main>
      <WalkingLogo />

      <p className="page-notice" role="status">
        {notice}
      </p>

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
        </div>

        {view === "list" ? (
          <WalksList key={`list-${refreshKey}`} />
        ) : (
          <WalksCalendar key={`calendar-${refreshKey}`} />
        )}
      </section>

      {/* Floating Add Walk Button */}
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
      
      {/* Add Walk Dialog */}
      <dialog
        id="add-walk-dialog"
        className="walk-dialog"
        ref={dialogRef}
        aria-labelledby="add-walk-heading"
      >
        <div className="dialog-header">
          <h2 id="add-walk-heading">Add a walk</h2>

          <button
            className="dialog-close"
            type="button"
            onClick={closeAddWalk}
            aria-label="Close add walk form"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <AddWalkForm onWalkAdded={handleWalkAdded} />
      </dialog>
    </main>
  );
}