import { useState } from "react";
import { apiFetch } from "./api";
import "./AddWalkForm.css";

export default function AddWalkForm({ onWalkAdded, walk = null }) {
    const isEditing = walk !== null;
    const [walkDate, setWalkDate] = useState(walk?.walk_date ?? "");
    const [minutes, setMinutes] = useState(walk ? String(walk.minutes) : "");
    const [distanceKm, setDistanceKm] = useState(walk?.distance_km == null ? "" : String(walk.distance_km));
    const [notes, setNotes] = useState(walk?.notes ?? "");
    const [status, setStatus] = useState(null);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setStatus(null);

        try {
            const url = isEditing ? `/walks/${walk.id}` : "/walks";

            const response = await apiFetch(url, {
                method: isEditing ? "PUT" : "POST",
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
                    step="0.001"
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
                {saving ? "Saving…" : isEditing ? "Save changes" : "Save walk"}
            </button>

            {status && (
                <p className="form-status" role="status">
                    {status}
                </p>
            )}
        </form>
    );
}
