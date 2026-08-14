# Dockerfile lives inside apps/api so Render (Root Directory = apps/api) and any
# other host auto-detect it, with the build context and Dockerfile in the same
# place — no cross-directory context gymnastics.
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
# Honor the $PORT injected by cloud hosts (Render/Railway/Fly), default to 8000 locally.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
