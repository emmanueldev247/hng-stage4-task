#!/bin/sh
set -eu

psqlq() { psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$1" -At -c "$2"; }

# 1) create databases if missing
if ! psqlq postgres "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB_USERS}'" | grep -q 1; then
  createdb -U "$POSTGRES_USER" "${POSTGRES_DB_USERS}"
fi
if ! psqlq postgres "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB_TEMPLATES}'" | grep -q 1; then
  createdb -U "$POSTGRES_USER" "${POSTGRES_DB_TEMPLATES}"
fi

# 2) create roles if missing
if ! psqlq postgres "SELECT 1 FROM pg_roles WHERE rolname='${USERS_DB_USER}'" | grep -q 1; then
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres \
    -c "CREATE ROLE ${USERS_DB_USER} LOGIN PASSWORD '${USERS_DB_PASSWORD}'"
fi
if ! psqlq postgres "SELECT 1 FROM pg_roles WHERE rolname='${TEMPLATES_DB_USER}'" | grep -q 1; then
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres \
    -c "CREATE ROLE ${TEMPLATES_DB_USER} LOGIN PASSWORD '${TEMPLATES_DB_PASSWORD}'"
fi

# ▶ Ensure DB ownership by service users
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres \
  -c "ALTER DATABASE ${POSTGRES_DB_USERS} OWNER TO ${USERS_DB_USER};"
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres \
  -c "ALTER DATABASE ${POSTGRES_DB_TEMPLATES} OWNER TO ${TEMPLATES_DB_USER};"

# 3) grants for users_db
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB_USERS" <<SQL
-- ▶ Make the service user own the public schema (or at least grant CREATE)
ALTER SCHEMA public OWNER TO ${USERS_DB_USER};
GRANT USAGE, CREATE ON SCHEMA public TO ${USERS_DB_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${USERS_DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${USERS_DB_USER};
SQL

# 4) grants for templates_db
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB_TEMPLATES" <<SQL
-- ▶ Make the service user own the public schema (or at least grant CREATE)
ALTER SCHEMA public OWNER TO ${TEMPLATES_DB_USER};
GRANT USAGE, CREATE ON SCHEMA public TO ${TEMPLATES_DB_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${TEMPLATES_DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${TEMPLATES_DB_USER};
SQL
