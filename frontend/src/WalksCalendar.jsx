import { useEffect, useState } from "react";
import "./WalksCalendar.css";

// Use the same API address as WalksList.jsx.
// const API_URL = "http://127.0.0.1:5001";
const API_URL = "http://192.168.0.28:5001"; // testing on the phone 

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function WalksCalendar() {
    const [visibleMonth, setVisibleMonth] = useState(
        () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );
    const [selectedDate, setSelectedDate] = useState(
        () => toDateKey(new Date())
    );

    const [walks, setWalks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadWalks() {
            try {
                const response = await fetch(`${API_URL}/walks`, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Could not load walks (${response.status})`);
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

    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();

    // Convert Sunday-first numbering to Monday-first.
    const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cellCount = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;

    const today = toDateKey(new Date());
    const selectedWalks = walks.filter(
        (walk) => walk.walk_date === selectedDate
    );

    const monthLabel = visibleMonth.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
    });

    function changeMonth(direction) {
        const nextMonth = new Date(year, month + direction, 1);

        setVisibleMonth(nextMonth);
        setSelectedDate(toDateKey(nextMonth));
    }

    if (loading) return <p role="status">Loading calendar…</p>;
    if (error) return <p role="alert">{error}</p>;

    return (
        <div className="walk-calendar">
            <div className="calendar-navigation">
                <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    aria-label="Previous month"
                >
                    ‹
                </button>

                <h3 aria-live="polite">{monthLabel}</h3>

                <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    aria-label="Next month"
                >
                    ›
                </button>
            </div>

            <div className="calendar-grid">
                {WEEKDAYS.map((day) => (
                    <span className="calendar-weekday" key={day}>
                        {day}
                    </span>
                ))}

                {Array.from({ length: cellCount }, (_, index) => {
                    const day = index - firstDayOffset + 1;

                    if (day < 1 || day > daysInMonth) {
                        return <span key={`empty-${index}`} aria-hidden="true" />;
                    }

                    const dateKey = toDateKey(new Date(year, month, day));
                    const count = walks.filter(
                        (walk) => walk.walk_date === dateKey
                    ).length;

                    return (
                        <button
                            key={dateKey}
                            type="button"
                            className="calendar-day"
                            onClick={() => setSelectedDate(dateKey)}
                            aria-pressed={selectedDate === dateKey}
                            aria-current={dateKey === today ? "date" : undefined}
                            aria-label={`${formatDate(dateKey)}, ${count} ${count === 1 ? "walk" : "walks"
                                }`}
                        >
                            <span>{day}</span>

                            {count > 0 && (
                                <span className="calendar-dot" aria-hidden="true" />
                            )}
                        </button>
                    );
                })}
            </div>

            <p className="calendar-legend">
                <span className="calendar-dot" aria-hidden="true" />
                Walk recorded
            </p>

            <section
                className="calendar-details"
                aria-labelledby="selected-date-heading"
            >
                <h3 id="selected-date-heading">{formatDate(selectedDate)}</h3>

                {selectedWalks.length === 0 ? (
                    <p>No walks recorded for this day.</p>
                ) : (
                    <ul>
                        {selectedWalks.map((walk) => (
                            <li key={walk.id}>
                                <strong>{walk.minutes} min</strong>
                                {walk.distance_km !== null &&
                                    ` · ${walk.distance_km} km`}
                                {walk.notes && <p>{walk.notes}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}