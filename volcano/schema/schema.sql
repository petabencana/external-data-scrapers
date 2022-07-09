-- SEQUENCE: public.lastest_vona_id

-- DROP SEQUENCE IF EXISTS public.lastest_vona_id;

CREATE SEQUENCE IF NOT EXISTS public.lastest_vona_id
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1
    OWNED BY lastest_vona.id;

ALTER SEQUENCE public.lastest_vona_id
    OWNER TO postgres;

-- SEQUENCE: public.list-volcano

-- DROP SEQUENCE IF EXISTS public."list-volcano";

CREATE SEQUENCE IF NOT EXISTS public."list-volcano"
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1
    OWNED BY list_volcano.id;

ALTER SEQUENCE public."list-volcano"
    OWNER TO postgres;

-- Table: public.lastest_eruption

-- DROP TABLE IF EXISTS public.lastest_eruption;

CREATE TABLE IF NOT EXISTS public.lastest_eruption
(
    id integer NOT NULL DEFAULT nextval('lastest_vona_id'::regclass),
    volcano_code text COLLATE pg_catalog."default",
    volcano_name character varying(1000) COLLATE pg_catalog."default",
    latitude numeric,
    longitude numeric,
    elevation integer,
    local_date date,
    local_time time without time zone,
    local_datetime date,
    time_zone text COLLATE pg_catalog."default",
    photo_ text COLLATE pg_catalog."default",
    activity_level text COLLATE pg_catalog."default",
    visual text COLLATE pg_catalog."default",
    instrumental text COLLATE pg_catalog."default",
    reporter text COLLATE pg_catalog."default",
    share_url text COLLATE pg_catalog."default",
    share_description text COLLATE pg_catalog."default",
    share_photo text COLLATE pg_catalog."default",
    iso_datetime timestamp with time zone,
    measuredatetime bigint,
    CONSTRAINT lastest_vona_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.lastest_eruption
    OWNER to postgres;

-- Table: public.list_volcano

-- DROP TABLE IF EXISTS public.list_volcano;

CREATE TABLE IF NOT EXISTS public.list_volcano
(
    id integer NOT NULL DEFAULT nextval('"list-volcano"'::regclass),
    volcano_code text COLLATE pg_catalog."default",
    volcano_name text COLLATE pg_catalog."default",
    volcano_description text COLLATE pg_catalog."default",
    volcano_status integer,
    coordinat_latitude numeric,
    coordinat_longitude numeric,
    report_noticenumber text COLLATE pg_catalog."default",
    report_date text COLLATE pg_catalog."default",
    report_made_by text COLLATE pg_catalog."default",
    visual_description text COLLATE pg_catalog."default",
    visual_others text COLLATE pg_catalog."default",
    visual_photo text COLLATE pg_catalog."default",
    climatology_description text COLLATE pg_catalog."default",
    earthquake_description text COLLATE pg_catalog."default",
    earthquake_chart text COLLATE pg_catalog."default",
    earthquake_recommendation text COLLATE pg_catalog."default",
    url text COLLATE pg_catalog."default",
    share_url text COLLATE pg_catalog."default",
    share_description text COLLATE pg_catalog."default",
    share_photo text COLLATE pg_catalog."default",
    measuredatetime integer,
    CONSTRAINT list_volcano_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.list_volcano
    OWNER to postgres;