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
