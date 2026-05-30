#!/bin/bash
# Creates all M.E.D.I.C. databases at first boot.
# Runs automatically when PostgreSQL Docker container starts for the first time.
set -e

echo ">>> Creating M.E.D.I.C. databases..."

DATABASES=(
  "medic_patients"
  "medic_emr"
  "medic_appointments"
  "medic_telemedicine"
  "medic_pharmacy"
  "medic_analytics"
  "medic_notifications"
  "medic_ussd"
)

for db in "${DATABASES[@]}"; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE $db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
    GRANT ALL PRIVILEGES ON DATABASE $db TO $POSTGRES_USER;
EOSQL
  echo "  -> $db ready"
done

echo ">>> All databases created."
