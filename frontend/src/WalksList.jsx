import { useEffect, useState } from "react";
import { GiRunningShoe } from "react-icons/gi";
import { FaMugHot } from "react-icons/fa";
import "./WalksList.css";

// const API_URL = "http://127.0.0.1:5001";
const API_URL = "http://192.168.0.28:5001"; // testing on the phone 

const DAY_MS = 24 * 60 * 60 * 1000;
const ROUTINE_START = Date.UTC(2026, 9, 16);
const CYCLE_LENGTH = 8;
const WALK_DAYS = 6;

function getTodayNumber() {
    const today = new Date();

    return (
        Date.UTC(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        ) / DAY_MS
    );
}

function dateKey(dayNumber) {
    return new Date(dayNumber * DAY_MS).toISOString().slice(0, 10);
}

function formatDay(dayNumber) {
    return new Date(dayNumber * DAY_MS).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
    });
}

const startDay = ROUTINE_START / DAY_MS;

function getCurrentCycle() {
    return Math.max(
        0,
        Math.floor((getTodayNumber() - startDay) / CYCLE_LENGTH)
    );
}

export default function WalksList() {
    const [walks, setWalks] = useState([]);
    const [cycleIndex, setCycleIndex] = useState(getCurrentCycle);
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

    const todayNumber = getTodayNumber();
    const currentCycle = getCurrentCycle();
    const cycleStart = startDay + cycleIndex * CYCLE_LENGTH;

    const days = Array.from({ length: CYCLE_LENGTH }, (_, index) => {
        const dayNumber = cycleStart + index;
        const key = dateKey(dayNumber);

        return {
            dayNumber,
            date: key,
            cycleDay: index + 1,
            isWalkDay: index < WALK_DAYS,
            walks: walks.filter((walk) => walk.walk_date === key),
        };
    });

    const recordedWalkDays = days.filter(
        (day) => day.isWalkDay && day.walks.length > 0
    ).length;

    if (loading) {
        return <p role="status">Loading your cycle…</p>;
    }

    if (error) {
        return <p role="alert">{error}</p>;
    }

    return (
        <div className="cycle-view">
            <nav className="cycle-navigation" aria-label="Walk cycles">
                <button
                    type="button"
                    onClick={() => setCycleIndex((current) => current - 1)}
                    disabled={cycleIndex === 0}
                >
                    Previous
                </button>

                <div className="cycle-title" aria-live="polite">
                    <h3>Cycle {cycleIndex + 1}</h3>
                    <p>
                        {formatDay(cycleStart)} –{" "}
                        {formatDay(cycleStart + CYCLE_LENGTH - 1)}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setCycleIndex((current) => current + 1)}
                    disabled={cycleIndex >= currentCycle}
                >
                    Next
                </button>
            </nav>

            <p className="cycle-summary">
                {recordedWalkDays} of 6 scheduled walking days have a walk recorded.
            </p>

            <ol className="cycle-days">
                {days.map((day) => (
                    <li
                        className={`cycle-day ${day.isWalkDay ? "cycle-day-walk" : "cycle-day-rest"
                            }`}
                        key={day.date}
                        aria-current={
                            day.dayNumber === todayNumber ? "date" : undefined
                        }
                    >

                        <span className="cycle-day-number">
                            Day {day.cycleDay}
                        </span>

                        <div className="cycle-day-content">
                            <div className="cycle-day-heading">
                                <h4>
                                    <time dateTime={day.date}>
                                        {formatDay(day.dayNumber)}
                                    </time>
                                </h4>


                            </div>

                            {day.walks.length > 0 ? (
                                <div className="cycle-walk-records">
                                    {day.walks.map((walk) => (
                                        <div className="cycle-walk-record" key={walk.id}>
                                            <p>
                                                <strong>{walk.minutes} min</strong>
                                                {walk.distance_km !== null &&
                                                    ` · ${walk.distance_km} km`}
                                            </p>

                                            {walk.notes && (
                                                <p className="cycle-walk-notes">{walk.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="cycle-day-status">
                                    {!day.isWalkDay
                                        ? "Planned rest"
                                        : day.dayNumber > todayNumber
                                            ? "Upcoming"
                                            : "No walk recorded"}
                                </p>
                            )}
                        </div>

                        <div className="cycle-day-icon">
                            {day.isWalkDay ? (
                                <GiRunningShoe aria-label="Scheduled walking day" role="img" />
                            ) : (
                                <FaMugHot aria-label="Scheduled rest day" role="img" />
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}