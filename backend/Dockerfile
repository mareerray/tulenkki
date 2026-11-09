FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-8000} app:app"]


# Here is what each part does:

# FROM: a small Linux image with Python already installed.

# WORKDIR: the folder inside the container where your code lives.

# COPY requirements.txt, then RUN pip install: installs packages first. Docker caches this step, so rebuilds are fast when only app.py changes.

# COPY app.py: adds your code.

# PYTHONUNBUFFERED: makes logs show up immediately.

# CMD: starts Gunicorn on the port given by the PORT variable, or 8000 if none is set. Hosting platforms like Koyeb often set PORT for you.