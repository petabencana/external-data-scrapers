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

-- Table: public.lastest_vona

-- DROP TABLE IF EXISTS public.lastest_vona;

CREATE TABLE IF NOT EXISTS public.lastest_vona
(
    id integer NOT NULL DEFAULT nextval('lastest_vona_id'::regclass),
    code_ga text COLLATE pg_catalog."default",
    nama_gunung_api character varying(1000) COLLATE pg_catalog."default",
    latitude numeric,
    longitude numeric,
    elevation integer,
    local_date date,
    local_time time without time zone,
    local_datetime date,
    time_zone text COLLATE pg_catalog."default",
    foto text COLLATE pg_catalog."default",
    tingkat_aktivitas text COLLATE pg_catalog."default",
    visual text COLLATE pg_catalog."default",
    instrumental text COLLATE pg_catalog."default",
    pelapor text COLLATE pg_catalog."default",
    url text COLLATE pg_catalog."default",
    description text COLLATE pg_catalog."default",
    photo text COLLATE pg_catalog."default",
    iso_datetime timestamp with time zone,
    measuredatetime bigint,
    CONSTRAINT lastest_vona_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.lastest_vona
    OWNER to postgres;

-- Table: public.list_volcano

-- DROP TABLE IF EXISTS public.list_volcano;

CREATE TABLE IF NOT EXISTS public.list_volcano
(
    id integer NOT NULL DEFAULT nextval('"list-volcano"'::regclass),
    gunung_code text COLLATE pg_catalog."default",
    gunung_nama text COLLATE pg_catalog."default",
    gunung_deskripsi text COLLATE pg_catalog."default",
    gunung_status integer,
    koordinat_latitude numeric,
    koordinat_longitude numeric,
    laporan_noticenumber text COLLATE pg_catalog."default",
    laporan_tanggal text COLLATE pg_catalog."default",
    laporan_dibuat_oleh text COLLATE pg_catalog."default",
    visual_deskripsi text COLLATE pg_catalog."default",
    visual_lainnya text COLLATE pg_catalog."default",
    visual_foto text COLLATE pg_catalog."default",
    klimatologi_deskripsi text COLLATE pg_catalog."default",
    gempa_deskripsi text COLLATE pg_catalog."default",
    gempa_grafik text COLLATE pg_catalog."default",
    gempa_rekomendasi text COLLATE pg_catalog."default",
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