#!/usr/bin/env sh
set -eu

COMPOSE_CMD="${COMPOSE_CMD:-podman-compose}"
DB_SERVICE="${DB_SERVICE:-postgres}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-quan_ly_san_bong}"
SQL_FILE_IN_CONTAINER="${SQL_FILE_IN_CONTAINER:-/docker-entrypoint-initdb.d/01-database.sql}"

cd "$(dirname "$0")"

if ! command -v "$COMPOSE_CMD" >/dev/null 2>&1; then
    echo "Error: $COMPOSE_CMD is not installed or not in PATH." >&2
    exit 1
fi

echo "Starting PostgreSQL service..."
"$COMPOSE_CMD" up -d "$DB_SERVICE"

echo "Waiting for PostgreSQL to be ready..."
i=0
until "$COMPOSE_CMD" exec -T "$DB_SERVICE" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "$i" -ge 30 ]; then
        echo "Error: PostgreSQL did not become ready in time." >&2
        "$COMPOSE_CMD" logs --tail=80 "$DB_SERVICE" >&2 || true
        exit 1
    fi
    sleep 2
done

echo "Running database migration from $SQL_FILE_IN_CONTAINER..."
"$COMPOSE_CMD" exec -T "$DB_SERVICE" psql \
    -v ON_ERROR_STOP=1 \
    -U "$DB_USER" \
    -f "$SQL_FILE_IN_CONTAINER"

echo "Migration completed."
