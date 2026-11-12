# Tulenkki

<img
  src="./frontend/public/tulenkki-logo.png"
  alt="Tulenkki logo"
  width="240"
/>

A personal walking journal for recording walks, following a walking-and-rest
routine, and reviewing progress over time.

**Live app:** https://tulenkki.vercel.app

Sign-in is required, and the app is set up for a single user. The backend is
hosted on a free plan, so the first request after a quiet period can take
about a minute.

I built Tulenkki to practise Python, Flask, PostgreSQL, REST APIs, CRUD
operations, and Docker-based development and cloud deployment. It is also an app I use
for my own walking routine.


## Features

- Sign in with email and password (Supabase Auth).
- Protected API: Flask verifies the access token on every request.- Add, view, edit, and delete walks.
- Record the walk date, duration in whole minutes, optional distance, and notes.
- Browse walks in a list and calendar.
- View walking progress through analytics.
- Follow an eight-day routine: six walking days and two rest days.
- Use a responsive interface on desktop and mobile.
- Try the app with a demo account.
- Show a welcome introduction after signing in.
- Display the average minutes per walk as a whole number.
- Use subtle page-transition animations between navigation tabs.
- Keep the page layout stable while switching between views.

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React, Vite, CSS |
| Backend | Python, Flask, Gunicorn |
| Database | PostgreSQL (Supabase) |
| Authentication | Supabase Auth |
| Containers | Docker |
| Hosting | Vercel (frontend), Render (backend) |
| Version control | Git, GitHub |

## Architecture

```text
Browser (React on Vercel)
      ↓ HTTPS + access token
Flask API in Docker on Render
      ↓ Parameterized SQL
PostgreSQL on Supabase
```

During local development:

- React runs through Vite, normally on port 5173.
- Flask runs on port 5001.
- PostgreSQL runs in a Docker container on port 5432.
- Vite proxies requests beginning with `/walks` to Flask.

Flask handles request validation and database operations.
React displays the data and provides forms for creating and editing walks.

## Getting started

These instructions use macOS/Linux shell commands.

### Prerequisites

- Git
- Python 3 and support for virtual environments
- Node.js and npm
- Docker, with the Docker engine running
- Available local ports: 5432, 5001, and 5173

### 1. Clone the repository

```bash
git clone [https://github.com/mareerray/tulenkki.git](https://github.com/mareerray/tulenkki.git)
cd tulenkki
```

### 2. Create the local PostgreSQL container

This is a first-time setup command.

Replace `CHANGE_ME_LOCAL_PASSWORD` with a local development password.
Use the same password in the backend configuration below.

```bash
docker run --name tulenkki-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=CHANGE_ME_LOCAL_PASSWORD \
  -e POSTGRES_DB=tulenkki \
  -p 127.0.0.1:5432:5432 \
  -v tulenkki-data:/var/lib/postgresql \
  -d postgres:18
```

Check that PostgreSQL is ready:

```bash
docker exec tulenkki-db pg_isready -U postgres -d tulenkki
```

If it is still starting, wait briefly and run the check again.

The named volume `tulenkki-data` stores the database separately from
the running container. Do not delete that volume if you want to retain
your records.

If the container already exists, start it instead of creating it again:

```bash
docker start tulenkki-db
```

### 3. Create the tables

From the project root, run this once against a new, empty database:

```bash
docker exec -i tulenkki-db psql \
  -U postgres \
  -d tulenkki \
  -v ON_ERROR_STOP=1 \
  < database/schema.sql
```

The schema creates:

- `walks`
- `routine_settings`

The schema does not include personal walking records.

### 4. Set up Flask

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Create `backend/.env`:

```dotenv
DATABASE_URL=postgresql://postgres:CHANGE_ME_LOCAL_PASSWORD@127.0.0.1:5432/tulenkki
```

Use the password chosen when creating the database container.
Special characters in a connection URL password may need URL encoding.

Do not commit `.env` or real credentials.

Start Flask:

```bash
python -m flask --app app run --port 5001 --no-debug
```

Check the API:

```bash
curl http://127.0.0.1:5001/health
```

Expected response:

```json
{"app":"Tulenkki","status":"ok"}
```

### 5. Start React

In another terminal, from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally:

```text
http://localhost:5173
```

Keep both Flask and Vite running while using the app locally.

### Mobile testing

To make Vite accessible on the local network:

```bash
npm run dev -- --host
```

Connect the phone and computer to the same trusted Wi-Fi network.
Open the Network URL printed by Vite on the phone.

API calls use relative `/walks` paths and are forwarded by Vite to Flask.
Flask can remain bound to localhost when using this proxy.

These commands run development servers, not a production deployment.

## Database design

### walks

| Column | Type | Purpose |
|--------|------|---------|
| id | INTEGER, identity primary key | Unique walk identifier |
| walk_date | DATE | Date of the walk |
| minutes | INTEGER | Duration in whole minutes; must be greater than zero |
| distance_km | NUMERIC(7,3), nullable | Optional non-negative distance |
| notes | TEXT, nullable | Optional notes |

An unknown distance is stored as `NULL`, not zero.

### routine_settings

| Column | Type | Purpose |
|--------|------|---------|
| id | INTEGER, primary key | Single settings record with ID 1 |
| cycle_start_date | DATE | Start date of the walking routine |
| walking_days | INTEGER | Walking days per cycle; defaults to 6 |
| rest_days | INTEGER | Rest days per cycle; defaults to 2 |
| daily_goal_minutes | INTEGER | Daily target; defaults to 20 |

The schema permits at most one routine-settings row.
It does not insert that row automatically.

## API endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /health | Check API availability |
| GET | /walks | Retrieve walks, newest first |
| POST | /walks | Create a walk |
| PUT | /walks/<id> | Update a walk |
| DELETE | /walks/<id> | Delete a walk |

### Create a walk

POST requires `walk_date` and `minutes`.

```json
{
  "walk_date": "2026-11-05",
  "minutes": 25,
  "distance_km": 2.1,
  "notes": "Example walk"
}
```

Distance and notes are optional.

### Update a walk

PUT requires all four editable fields:

- `walk_date`
- `minutes`
- `distance_km`
- `notes`

Set optional fields explicitly to `null` to clear them.

```json
{
  "walk_date": "2026-11-05",
  "minutes": 30,
  "distance_km": null,
  "notes": "Updated example"
}
```

### Validation

- The request body must be a JSON object.
- Dates must be valid and use `YYYY-MM-DD`.
- Minutes must be a positive whole number.
- Distance must be finite and non-negative, or `null`.
- Notes must be text or `null`.
- PUT and DELETE return 404 when the walk does not exist.

## Deployment

- **Frontend:** Vercel, built from the `frontend` folder.
- **Backend:** Render web service built from `backend/Dockerfile`, running Gunicorn.
- **Database and auth:** Supabase.

### Environment variables

Backend (Render):

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ALLOWED_USER_ID`
- `CORS_ORIGINS` (comma-separated list of allowed frontend addresses)

Frontend (Vercel):

- `VITE_API_URL` (the backend address, without a trailing slash)
- Supabase URL and anon key for the client

Do not commit real values. Set them in each host's dashboard.

## Manual testing

Core CRUD has been tested locally through the API and React interface.

A typical test flow:

1. Create a temporary walk.
2. Confirm it appears in the list.
3. Edit its minutes and notes.
4. Refresh the page and confirm the changes remain.
5. Delete the temporary walk.
6. Refresh again and confirm it is gone.

Invalid-input checks include decimal minutes, invalid dates,
non-finite distances, and request bodies that are not JSON objects.

Use temporary records rather than personal walking history for testing.

## Database backups

Create a local backup outside the repository:

```bash
mkdir -p "$HOME/tulenkki-backups"

docker exec tulenkki-db pg_dump \
  -U postgres \
  -d tulenkki \
  --no-owner \
  --no-privileges \
  > "$HOME/tulenkki-backups/tulenkki-$(date +%F-%H%M%S).sql"
```

A basic restore test has been completed using a separate database:
the dump restored without errors, and row counts matched the original.

Backups contain personal records and should not be committed to Git.

A backup on the same computer does not protect against losing that
computer. Keep an additional private copy elsewhere.

## Project status and limitations

- Core CRUD works locally and in production.
- Sign-in and token checks are implemented.
- The frontend and backend are deployed.
- The API allows one configured user only.
- The free backend sleeps when idle, so the first load is slow.
- Local development against the hosted backend needs `localhost:5173` in `CORS_ORIGINS`.

### Routine configuration

The cycle view currently uses constants in
`frontend/src/WalksList.jsx`:

- Start date: 16 October 2026
- Walking days: 6
- Rest days: 2
- Total cycle length: 8 days

The database includes a `routine_settings` table, but the cycle view
does not read it yet. Connecting the cycle view to database settings
is a planned improvement.

## Learning notes

This project has helped me practise:

- Connecting Flask to PostgreSQL using Psycopg.
- Designing tables with identity columns and database constraints.
- Writing parameterized SQL queries.
- Sharing validation logic between Create and Update endpoints.
- Connecting React forms to REST endpoints.
- Handling errors and refreshing the interface after changes.
- Debugging API requests with curl and browser developer tools.
- Testing the app on a phone through the local network.
- Exporting a database and testing a restore.
- Writing a Dockerfile and running Flask with Gunicorn.
- Using environment variables for secrets, and finding the quotes bug in Docker env files.
- Configuring CORS and debugging blocked requests.
- Deploying a full-stack app across Vercel, Render and Supabase.

## Screenshots

| Sign in | Welcome |
|---------|------------|
| <img src="./docs/screenshots/tulenkki.vercel.app_signin.png" alt="Tulenkki sign-in page" width="400"/> | <img src="./docs/screenshots/tulenkki.vercel.app_welcome.png" alt="Calendar view of walks" width="400" /> |

| Add walk | Walks list |
|----------|----------|
| <img src="./docs/screenshots/tulenkki.vercel.app_addwalk.png" alt="Form for adding a walk" width="400" /> | <img src="./docs/screenshots/tulenkki.vercel.app_list.png" alt="List of recorded walks" width="400"/> |

| Calendar | Analytics |
|-----------|----------|
| <img src="./docs/screenshots/tulenkki.vercel.app_calendar.png" alt="Form for adding a walk" width="400" /> | <img src="./docs/screenshots/tulenkki.vercel.app_analytics.png" alt="Walking progress analytics" width="400" /> |

## Author

Created by Mayuree Reunsati.