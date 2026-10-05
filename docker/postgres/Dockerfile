ARG POSTGRES_IMAGE
FROM ${POSTGRES_IMAGE}

COPY database/schema.sql /docker-entrypoint-initdb.d/01_schema.sql
