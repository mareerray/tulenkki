import { useState } from "react";
import "./WeeklyWalkChart.css";

function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getMonday(date) {
    const monday = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    const offset = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - offset);

    return monday;
}

function formatShortDate(date) {
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function WeeklyWalkChart({ walks }) {
    const [weekStart, setWeekStart] = useState(
        () => getMonday(new Date())
    );

    const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(
            weekStart.getFullYear(),
            weekStart.getMonth(),
            weekStart.getDate() + index
        );

        const dateKey = toDateKey(date);

        const minutes = walks
            .filter((walk) => walk.walk_date === dateKey)
            .reduce((total, walk) => total + Number(walk.minutes), 0);

        return {
            date,
            dateKey,
            minutes,
            label: date.toLocaleDateString("en-GB", {
                weekday: "short",
            }),
        };
    });

    const totalMinutes = days.reduce(
        (total, day) => total + day.minutes,
        0
    );

    // Round the scale up to a multiple of 10.
    // Keep a usable scale even when the week has no walks.
    const scaleMax = Math.max(
        30,
        Math.ceil(Math.max(...days.map((day) => day.minutes)) / 10) * 10
    );

    const weekEnd = days[6].date;

    function changeWeek(direction) {
        setWeekStart(
            (current) =>
                new Date(
                    current.getFullYear(),
                    current.getMonth(),
                    current.getDate() + direction * 7
                )
        );
    }

    return (
        <section
            className="weekly-chart"
            aria-labelledby="weekly-chart-heading"
        >
            <div className="weekly-chart-header">
                <div>
                    <h3 id="weekly-chart-heading">Weekly walking time</h3>
                    <p>Total minutes recorded each day</p>
                </div>

                <button
                    className="weekly-chart-today"
                    type="button"
                    onClick={() => setWeekStart(getMonday(new Date()))}
                >
                    This week
                </button>
            </div>

            <div className="weekly-chart-navigation">
                <button
                    type="button"
                    onClick={() => changeWeek(-1)}
                    aria-label="Previous week"
                >
                    ‹
                </button>

                <p aria-live="polite">
                    {formatShortDate(weekStart)} – {formatShortDate(weekEnd)}
                </p>

                <button
                    type="button"
                    onClick={() => changeWeek(1)}
                    aria-label="Next week"
                >
                    ›
                </button>
            </div>

            <p className="weekly-chart-summary" role="status">
                {totalMinutes > 0
                    ? `${totalMinutes} minutes recorded this week.`
                    : "No walking minutes recorded this week."}
            </p>

            <p className="weekly-chart-scale">
                Scale: 0–{scaleMax} minutes
            </p>

            <div className="weekly-chart-bars">
                {days.map((day) => (
                    <div className="weekly-chart-column" key={day.dateKey}>
                        <span className="weekly-chart-value">
                            <span className="chart-sr-only">
                                {formatShortDate(day.date)}:{" "}
                            </span>
                            {day.minutes}
                            <span className="chart-sr-only"> minutes</span>
                        </span>

                        <div className="weekly-chart-track" aria-hidden="true">
                            <div
                                className="weekly-chart-bar"
                                style={{
                                    height: `${(day.minutes / scaleMax) * 100}%`,
                                }}
                            />
                        </div>

                        <span className="weekly-chart-day" aria-hidden="true">
                            {day.label}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}