import { useEffect, useState } from "react";

// const API_URL = "http://127.0.0.1:5001";
const API_URL = "http://192.168.0.28:5001"; // testing on the phone 
export default function WalksList() {
    const [walks, setWalks] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadWalks() {
            try {
                const response = await fetch(`${API_URL}/walks`);

                if (!response.ok) {
                    throw new Error(`Request failed: ${response.status}`);
                }

                const data = await response.json();
                setWalks(data.walks);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadWalks();
    }, []);

    if (loading) return <p>Loading walks…</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <section>
            {walks.length === 0 ? (
                <p>No walks saved yet.</p>
            ) : (
                <ul>
                    {walks.map((walk) => (
                        <li key={walk.id}>
                            <strong>{walk.walk_date}</strong> — {walk.minutes} min
                            {walk.distance_km !== null && ` — ${walk.distance_km} km`}
                            {walk.notes && <p>{walk.notes}</p>}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
