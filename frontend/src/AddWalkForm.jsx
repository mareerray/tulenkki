import { useState } from "react";
import "./AddWalkForm.css";

// const API_URL = "http://127.0.0.1:5001";
const API_URL = "http://192.168.0.28:5001"; // testing on the phone 

export default function AddWalkForm({ onWalkAdded }) {
    const [walkDate, setWalkDate] = useState("");
    const [minutes, setMinutes] = useState("");
    const [distanceKm, setDistanceKm] = useState("");
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState(null);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setStatus(null);

        try {
            const response = await fetch(`${API_URL}/walks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    walk_date: walkDate,
                    minutes: minutes,
                    distance_km: distanceKm === "" ? null : distanceKm,
                    notes: notes === "" ? null : notes,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Could not save the walk");
            }

            setStatus("Walk saved!");
            setWalkDate("");
            setMinutes("");
            setDistanceKm("");
            setNotes("");
            onWalkAdded();
        } catch (err) {
            setStatus(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className="add-walk-form" onSubmit={handleSubmit}>
            <label>
                Date
                <input
                    type="date"
                    value={walkDate}
                    onChange={(event) => setWalkDate(event.target.value)}
                    required
                />
            </label>

            <label>
                Minutes
                <input
                    type="number"
                    min="1"
                    value={minutes}
                    onChange={(event) => setMinutes(event.target.value)}
                    required
                />
            </label>

            <label>
                Distance (km)
                <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={distanceKm}
                    onChange={(event) => setDistanceKm(event.target.value)}
                />
            </label>

            <label>
                Notes
                <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows="3"
                />
            </label>

            <button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save walk"}
            </button>

            {status && (
                <p className="form-status" role="status">
                    {status}
                </p>
            )}
        </form>
    );
}
