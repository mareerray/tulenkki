import os

import psycopg
from dotenv import load_dotenv
from flask import Flask
from psycopg.rows import dict_row

load_dotenv() # Load environment variables from .env file

app = Flask(__name__)


@app.get("/health")
def health():
    return {"status": "ok", "app": "Tulenkki"}

# --------------- GET /walks ---------------
@app.get("/walks")
def get_walks():
    with psycopg.connect( # opens a database connection using psycopg
        os.environ["DATABASE_URL"], # reads the connection string from the environment variable
        row_factory=dict_row, # dict_row lets us access fields by name, such as row["minutes"]
    ) as conn: # The cursor executes SQL, and fetchall() retrieves its results
        with conn.cursor() as cur:   # The with blocks close the cursor and connection afterward—even if an exception occurs
            cur.execute("""
                SELECT id, walk_date, minutes, distance_km, notes
                FROM walks
                ORDER BY walk_date DESC, id DESC
            """)
            rows = cur.fetchall() 

    walks = [ # prepares the data for JSON serialization by converting datetime and decimal types to strings and floats
        {
            "id": row["id"],
            "walk_date": row["walk_date"].isoformat(),
            "minutes": row["minutes"],
            "distance_km": (
                float(row["distance_km"])
                if row["distance_km"] is not None
                else None
            ),
            "notes": row["notes"],
        }
        for row in rows
    ]

    return {"walks": walks}

from datetime import date
from flask import request

# --------------- POST /walks ---------------
@app.post("/walks")
def create_walk():
    data = request.get_json(silent=True) or {}

    walk_date = data.get("walk_date")
    minutes = data.get("minutes")
    distance_km = data.get("distance_km")
    notes = data.get("notes")

    if not walk_date or minutes is None:
        return {"error": "walk_date and minutes are required"}, 400

    try:
        date.fromisoformat(walk_date)
    except ValueError:
        return {"error": "walk_date must use YYYY-MM-DD format"}, 400

    try:
        minutes = int(minutes)
    except (TypeError, ValueError):
        return {"error": "minutes must be a whole number"}, 400

    if minutes <= 0:
        return {"error": "minutes must be greater than 0"}, 400

    if distance_km is not None:
        try:
            distance_km = float(distance_km)
        except (TypeError, ValueError):
            return {"error": "distance_km must be a number"}, 400

        if distance_km < 0:
            return {"error": "distance_km cannot be negative"}, 400

    with psycopg.connect(
        os.environ["DATABASE_URL"],
        row_factory=dict_row,
    ) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO walks (walk_date, minutes, distance_km, notes)
                VALUES (%s, %s, %s, %s)
                RETURNING id, walk_date, minutes, distance_km, notes
                """,
                (walk_date, minutes, distance_km, notes),
            )
            row = cur.fetchone()
        conn.commit()

    return {
        "walk": {
            "id": row["id"],
            "walk_date": row["walk_date"].isoformat(),
            "minutes": row["minutes"],
            "distance_km": (
                float(row["distance_km"])
                if row["distance_km"] is not None
                else None
            ),
            "notes": row["notes"],
        }
    }, 201