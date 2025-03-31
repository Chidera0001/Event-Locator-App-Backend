--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: event_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_categories (
    event_id uuid NOT NULL,
    category_id uuid NOT NULL
);


ALTER TABLE public.event_categories OWNER TO postgres;

--
-- Name: event_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    event_id uuid,
    user_id uuid,
    rating integer,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT event_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.event_reviews OWNER TO postgres;

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    location public.geography(Point,4326),
    address character varying(255),
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    creator_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'active'::character varying,
    CONSTRAINT events_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'cancelled'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorites (
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    event_id uuid,
    user_id uuid,
    rating integer,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: user_category_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_category_preferences (
    id integer NOT NULL,
    user_id integer,
    category_id integer
);


ALTER TABLE public.user_category_preferences OWNER TO postgres;

--
-- Name: user_category_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_category_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_category_preferences_id_seq OWNER TO postgres;

--
-- Name: user_category_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_category_preferences_id_seq OWNED BY public.user_category_preferences.id;


--
-- Name: user_favorite_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_favorite_events (
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_favorite_events OWNER TO postgres;

--
-- Name: user_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_locations (
    id integer NOT NULL,
    user_id integer,
    location public.geography(Point,4326) NOT NULL,
    address text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_locations OWNER TO postgres;

--
-- Name: user_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_locations_id_seq OWNER TO postgres;

--
-- Name: user_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_locations_id_seq OWNED BY public.user_locations.id;


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_preferences (
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    notification_radius integer DEFAULT 10000,
    email_notifications boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_preferences OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    preferred_language character varying(10) DEFAULT 'en'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    role character varying(20) DEFAULT 'user'::character varying,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying, 'moderator'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: user_category_preferences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_category_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_category_preferences_id_seq'::regclass);


--
-- Name: user_locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_locations ALTER COLUMN id SET DEFAULT nextval('public.user_locations_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, created_at) FROM stdin;
\.


--
-- Data for Name: event_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_categories (event_id, category_id) FROM stdin;
\.


--
-- Data for Name: event_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_reviews (id, event_id, user_id, rating, comment, created_at) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, title, description, location, address, start_date, end_date, creator_id, created_at, updated_at, status) FROM stdin;
841bd636-4c26-406d-85e1-03325a9edd2e	Test Event	Test Description	0101000020E61000001FF64201DB7B52C0B610E4A0845D4440	123 Test St	2024-04-01 12:00:00+02	2024-04-01 14:00:00+02	37154005-2267-4d59-addc-f6d1202aaa13	2025-03-31 17:35:52.471889+02	2025-03-31 17:35:52.471889+02	active
d66aa720-af0b-422a-8480-935a4bc32c88	Test Event	Test Description	0101000020E61000001FF64201DB7B52C0B610E4A0845D4440	123 Test St	2024-04-01 12:00:00+02	2024-04-01 14:00:00+02	37154005-2267-4d59-addc-f6d1202aaa13	2025-03-31 22:03:49.76544+02	2025-03-31 22:03:49.76544+02	active
185e7578-6e56-4c42-a8bc-0cf025024d30	Test Event	Test Description	0101000020E61000001FF64201DB7B52C0B610E4A0845D4440	123 Test St	2024-04-01 12:00:00+02	2024-04-01 14:00:00+02	37154005-2267-4d59-addc-f6d1202aaa13	2025-03-31 22:04:27.104087+02	2025-03-31 22:04:27.104087+02	active
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorites (user_id, event_id, created_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, name, executed_at) FROM stdin;
1	add_event_status	2025-03-31 22:34:25.72618
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, event_id, user_id, rating, comment, created_at) FROM stdin;
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: user_category_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_category_preferences (id, user_id, category_id) FROM stdin;
\.


--
-- Data for Name: user_favorite_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_favorite_events (user_id, event_id, created_at) FROM stdin;
\.


--
-- Data for Name: user_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_locations (id, user_id, location, address, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_preferences (user_id, category_id, notification_radius, email_notifications, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, preferred_language, created_at, updated_at, role) FROM stdin;
37154005-2267-4d59-addc-f6d1202aaa13	johndoe	john@example.com	$2b$10$sY2cuYQrhqVX4HIoFMYIheYFO6wkQz8VEuX.HIibK363nfUTA1y76	en	2025-03-31 17:23:47.820494+02	2025-03-31 17:23:47.820494+02	user
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 1, true);


--
-- Name: user_category_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_category_preferences_id_seq', 1, false);


--
-- Name: user_locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_locations_id_seq', 1, false);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: event_categories event_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_categories
    ADD CONSTRAINT event_categories_pkey PRIMARY KEY (event_id, category_id);


--
-- Name: event_reviews event_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_reviews
    ADD CONSTRAINT event_reviews_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (user_id, event_id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: user_category_preferences user_category_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_category_preferences
    ADD CONSTRAINT user_category_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_category_preferences user_category_preferences_user_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_category_preferences
    ADD CONSTRAINT user_category_preferences_user_id_category_id_key UNIQUE (user_id, category_id);


--
-- Name: user_favorite_events user_favorite_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorite_events
    ADD CONSTRAINT user_favorite_events_pkey PRIMARY KEY (user_id, event_id);


--
-- Name: user_locations user_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_locations
    ADD CONSTRAINT user_locations_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id, category_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_user_category_preferences_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_category_preferences_user_id ON public.user_category_preferences USING btree (user_id);


--
-- Name: idx_user_locations; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_locations ON public.user_locations USING gist (location);


--
-- Name: event_categories event_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_categories
    ADD CONSTRAINT event_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: event_categories event_categories_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_categories
    ADD CONSTRAINT event_categories_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_reviews event_reviews_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_reviews
    ADD CONSTRAINT event_reviews_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_reviews event_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_reviews
    ADD CONSTRAINT event_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: events events_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_favorite_events user_favorite_events_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorite_events
    ADD CONSTRAINT user_favorite_events_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: user_favorite_events user_favorite_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorite_events
    ADD CONSTRAINT user_favorite_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

