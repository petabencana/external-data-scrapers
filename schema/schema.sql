-- Create 'public' SCHEMA
CREATE SCHEMA IF NOT EXISTS public
    AUTHORIZATION postgres;

COMMENT ON SCHEMA public
    IS 'standard public schema';

GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT ALL ON SCHEMA public TO postgres;


-- Create sequence for primary key id on earthquakes_reports
CREATE SEQUENCE IF NOT EXISTS public.earthquakes_reports_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.earthquakes_reports_id_seq
    OWNER TO postgres;


-- Create table for earthquakes_reports
CREATE TABLE earthquakes_reports
(
    id integer NOT NULL DEFAULT nextval('earthquakes_reports_id_seq'::regclass),
    date date,
    datetime timestamp with time zone,
    zone text,
    potential text,
    feltarea text,
    shakemap text,
    coordinate character(100),
    "time" time without time zone,
    latitude character(100),
    longitude character(100),
    depth character(100),
    magnitude real,
    measuredatetime integer,
    CONSTRAINT gempabumi_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)

ALTER TABLE IF EXISTS public.earthquakes_reports
    OWNER to postgres;