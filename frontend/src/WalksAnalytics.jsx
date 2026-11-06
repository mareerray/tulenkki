import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import WeeklyWalkChart from "./WeeklyWalkChart";
import "./WalksAnalytics.css";

export default function WalksAnalytics() {
    const [walks, setWalks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadWalks() {
            try {
                const response = await apiFetch("/walks", {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Could not load analytics (${response.status})`);
                }

                const data = await response.json();
                setWalks(data.walks);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadWalks();

        return () => controller.abort();
    }, []);

    if (loading) {
        return <p role="status">Loading analytics…</p>;
    }

    if (error) {
        return <p role="alert">{error}</p>;
    }

    if (walks.length === 0) {
        return (
            <div className="analytics-empty">
                <h3>Your progress starts with one walk</h3>
                <p>Add a walk using the + button to see your statistics here.</p>
            </div>
        );
    }

    const totalWalks = walks.length;

    const totalMinutes = walks.reduce(
        (total, walk) => total + Number(walk.minutes),
        0
    );

    const walksWithDistance = walks.filter(
        (walk) => walk.distance_km !== null
    );

    const totalDistance = walksWithDistance.reduce(
        (total, walk) => total + Number(walk.distance_km),
        0
    );

    const averageMinutes = totalMinutes / totalWalks;

    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    const walkingTime =
        hours > 0
            ? `${hours} hr ${remainingMinutes} min`
            : `${remainingMinutes} min`;

    return (
        <div className="walk-analytics">
            <div className="analytics-heading">
                <h3>Your walking progress</h3>
                <p>All recorded walks · All time</p>
            </div>

            <dl className="analytics-grid">
                <div className="analytics-card">
                    <dt>Total walks</dt>
                    <dd>{totalWalks}</dd>
                    <p>Each saved walk counts once.</p>
                </div>

                <div className="analytics-card">
                    <dt>Walking time</dt>
                    <dd>{walkingTime}</dd>
                    <p>Total time spent walking.</p>
                </div>

                <div className="analytics-card">
                    <dt>Recorded distance</dt>
                    <dd>
                        {walksWithDistance.length > 0
                            ? `${totalDistance.toFixed(1)} km`
                            : "Not recorded"}
                    </dd>
                    <p>
                        Distance entered for {walksWithDistance.length} of {totalWalks}{" "}
                        walks.
                    </p>
                </div>

                <div className="analytics-card">
                    <dt>Average duration</dt>
                    <dd>{averageMinutes.toFixed(1)} min</dd>
                    <p>Average time per walk.</p>
                </div>
            </dl>
            <WeeklyWalkChart walks={walks} />
        </div>
    );
}