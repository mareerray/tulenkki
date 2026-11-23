import os
import math
import requests
import secrets
from datetime import date
from uuid import UUID

import psycopg
from dotenv import load_dotenv
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from psycopg.rows import dict_row

load_dotenv() # Load environment variables from .env file

app = Flask(__name__)

# Only these websites may call the API from a browser
allowed_origins = [
    origin.strip() # reads the CORS_ORIGINS environment variable, splits it by commas, and removes whitespace, if it's not set, defaults to http://localhost:5173
    for origin in os.environ.get(
        "CORS_ORIGINS", "http://localhost:5173"
    ).split(",")
    if origin.strip() # skips empty entries
]
CORS(app, origins=allowed_origins)

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]

@app.before_request
def protect_walk_routes():
    # Allow browser CORS preflight requests.
    if request.method == "OPTIONS":
        return None

    # Protect /walks and everything below /walks/.
    if not (
        request.path == "/walks"
        or request.path.startswith("/walks/")
    ):
        return None

    authorization = request.headers.get("Authorization", "")
    parts = authorization.split()

    if (
        len(parts) != 2
        or parts[0].lower() != "bearer"
    ):
        return {"error": "Sign-in required"}, 401

    token = parts[1]

    try:
        response = requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}",
            },
            timeout=10,
        )
    except requests.RequestException:
        return {
            "error": "Authentication service unavailable. Try again."
        }, 503

    if response.status_code in (401, 403):
        return {"error": "Invalid or expired access token"}, 401

    if response.status_code != 200:
        return {
            "error": "Authentication service unavailable. Try again."
        }, 503

    try:
        user = response.json()
    except ValueError:
        return {"error": "Invalid authentication response"}, 503

    if not isinstance(user, dict) or not user.get("id"):
        return {"error": "Invalid authentication response"}, 503

    g.user_id = user["id"]
    return None

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
                WHERE user_id = %s
                ORDER BY walk_date DESC, id DESC
                """, 
                (g.user_id,),
            )
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

# -------------- Data Validation Helper Before POST and PUT ---------------
def validate_walk(data, require_all_fields=False):
    if not isinstance(data, dict):
        return None, "Request body must be a JSON object"

    required_fields = (
        ("walk_date", "minutes", "distance_km", "notes")
        if require_all_fields
        else ("walk_date", "minutes")
    )

    missing_fields = [
        field for field in required_fields if field not in data
    ]

    if missing_fields:
        return None, f"Missing fields: {', '.join(missing_fields)}"

    walk_date = data.get("walk_date")
    minutes = data.get("minutes")
    distance_km = data.get("distance_km")
    notes = data.get("notes")

    # Validate the date and enforce YYYY-MM-DD.
    if not isinstance(walk_date, str):
        return None, "walk_date must be a string in YYYY-MM-DD format"

    try:
        parsed_date = date.fromisoformat(walk_date)
    except ValueError:
        return None, "walk_date must be a valid date in YYYY-MM-DD format"

    if parsed_date.isoformat() != walk_date:
        return None, "walk_date must use YYYY-MM-DD format"

    # Accept integers or integer strings, but not floats or booleans.
    if type(minutes) not in (int, str):
        return None, "minutes must be a whole number"

    try:
        minutes = int(minutes)
    except ValueError:
        return None, "minutes must be a whole number"

    if minutes <= 0:
        return None, "minutes must be greater than 0"

    # Distance is optional, but must be a finite, non-negative number.
    if distance_km is not None:
        if type(distance_km) not in (int, float, str):
            return None, "distance_km must be a number or null"

        try:
            distance_km = float(distance_km)
        except (ValueError, OverflowError):
            return None, "distance_km must be a number"

        if not math.isfinite(distance_km):
            return None, "distance_km must be a finite number"

        if distance_km < 0:
            return None, "distance_km cannot be negative"

    if notes is not None and not isinstance(notes, str):
        return None, "notes must be text or null"

    return {
        "walk_date": parsed_date.isoformat(),
        "minutes": minutes,
        "distance_km": distance_km,
        "notes": notes,
    }, None

# --------------- POST /walks ---------------
@app.post("/walks")
def create_walk():
    data, error = validate_walk(request.get_json(silent=True))

    if error is not None:
        return {"error": error}, 400

    walk_date = data["walk_date"]
    minutes = data["minutes"]
    distance_km = data["distance_km"]
    notes = data["notes"]

    with psycopg.connect(
        os.environ["DATABASE_URL"],
        row_factory=dict_row,
    ) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO walks (user_id, walk_date, minutes, distance_km, notes)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, walk_date, minutes, distance_km, notes
                """,
                (g.user_id, walk_date, minutes, distance_km, notes),
            )
            row = cur.fetchone()

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

# -------------- PUT /walks/<id> ---------------
@app.put("/walks/<int:walk_id>")
def update_walk(walk_id):
    data, error = validate_walk(
        request.get_json(silent=True),
        require_all_fields=True,
    )

    if error is not None:
        return {"error": error}, 400

    walk_date = data["walk_date"]
    minutes = data["minutes"]
    distance_km = data["distance_km"]
    notes = data["notes"]

    with psycopg.connect(
        os.environ["DATABASE_URL"],
        row_factory=dict_row,
    ) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE walks
                SET walk_date = %s, minutes = %s, distance_km = %s, notes = %s
                WHERE id = %s AND user_id = %s
                RETURNING id, walk_date, minutes, distance_km, notes;
                """,
                (walk_date, minutes, distance_km, notes, walk_id, g.user_id),
            )
            row = cur.fetchone()

    if row is None:
        return jsonify({"error": "Walk not found"}), 404

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
    }, 200

# -------------- DELETE /walks/<id> ---------------
@app.delete("/walks/<int:walk_id>")
def delete_walk(walk_id):
    with psycopg.connect(
        os.environ["DATABASE_URL"],
        row_factory=dict_row,
    ) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                DELETE FROM walks
                WHERE id = %s AND user_id = %s
                RETURNING id;
                """,
                (walk_id, g.user_id),
            )
            deleted = cur.fetchone()

    if deleted is None:
        return jsonify({"error": "Walk not found"}), 404

    return jsonify({"message": "Walk deleted"}), 200


# --------------- SabaiMai read-only integration ---------------

@app.get("/integrations/sabaimai/walks")
def get_sabaimai_walks():
    expected_key = os.environ.get("SABAIMAI_INTEGRATION_KEY", "")

    if not expected_key:
        return {"error": "Walking integration is unavailable"}, 503

    provided_key = request.headers.get("X-API-Key", "")

    if not provided_key or not secrets.compare_digest(
        provided_key.encode("utf-8"),
        expected_key.encode("utf-8"),
    ):
        return {"error": "Invalid integration key"}, 401

    account = request.args.get("account", "owner")

    account_env_names = {
        "owner": "SABAIMAI_WALKS_OWNER_ID",
        "demo": "SABAIMAI_WALKS_DEMO_ID",
    }

    env_name = account_env_names.get(account)

    if env_name is None:
        return {"error": "Invalid walking account"}, 400

    selected_id = os.environ.get(env_name, "")

    try:
        selected_uuid = UUID(selected_id)
    except ValueError:
        return {"error": "Walking integration is unavailable"}, 503

    if account == "demo":
        personal_id = os.environ.get("SABAIMAI_WALKS_OWNER_ID", "")

        try:
            personal_uuid = UUID(personal_id)
        except ValueError:
            return {"error": "Walking integration is unavailable"}, 503

        if selected_uuid == personal_uuid:
            return {"error": "Walking integration accounts must be separate"}, 503

    try:
        with psycopg.connect(
            os.environ["DATABASE_URL"],
            row_factory=dict_row,
        ) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, walk_date, minutes, distance_km
                    FROM walks
                    WHERE user_id = %s
                    ORDER BY walk_date DESC, id DESC
                    """,
                    (selected_uuid,),
                )
                rows = cur.fetchall()

    except psycopg.Error:
        app.logger.exception("Walking integration database request failed")
        return {"error": "Walking data is temporarily unavailable"}, 503

    walks = [
        {
            "id": row["id"],
            "walk_date": row["walk_date"].isoformat(),
            "minutes": row["minutes"],
            "distance_km": (
                float(row["distance_km"])
                if row["distance_km"] is not None
                else None
            ),
        }
        for row in rows
    ]

    response = jsonify({"walks": walks})
    response.headers["Cache-Control"] = "no-store"
    return response