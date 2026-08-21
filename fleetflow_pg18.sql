--
-- PostgreSQL database dump
--

\restrict lYhpWV7CMB5GEwIddh6nrdI1XsTH70iF2cKxDyOQVgU7lmnSbQyg8YZt7PsicJW

-- Dumped from database version 18.6 (Debian 18.6-1.pgdg13+2)
-- Dumped by pg_dump version 18.6 (Debian 18.6-1.pgdg13+2)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    username character varying,
    module character varying NOT NULL,
    action character varying NOT NULL,
    details text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: driver_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.driver_assignments (
    id integer NOT NULL,
    driver_id integer NOT NULL,
    vehicle_id integer NOT NULL,
    trip_id integer NOT NULL,
    assignment_date date NOT NULL,
    release_date date,
    status character varying,
    remarks character varying
);


--
-- Name: driver_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.driver_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: driver_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.driver_assignments_id_seq OWNED BY public.driver_assignments.id;


--
-- Name: driver_attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.driver_attendance (
    id integer NOT NULL,
    driver_id integer NOT NULL,
    date date NOT NULL,
    attendance_status character varying NOT NULL,
    check_in_time time without time zone,
    check_out_time time without time zone
);


--
-- Name: driver_attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.driver_attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: driver_attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.driver_attendance_id_seq OWNED BY public.driver_attendance.id;


--
-- Name: drivers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drivers (
    id integer NOT NULL,
    license_number character varying NOT NULL,
    phone character varying NOT NULL,
    email character varying NOT NULL,
    status character varying,
    name character varying NOT NULL
);


--
-- Name: drivers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.drivers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: drivers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.drivers_id_seq OWNED BY public.drivers.id;


--
-- Name: fuel_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_records (
    id integer NOT NULL,
    vehicle_id integer NOT NULL,
    fuel_date date NOT NULL,
    liters double precision NOT NULL,
    cost double precision NOT NULL,
    odometer integer NOT NULL,
    fuel_station character varying NOT NULL
);


--
-- Name: fuel_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fuel_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fuel_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fuel_records_id_seq OWNED BY public.fuel_records.id;


--
-- Name: maintenance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance (
    id integer NOT NULL,
    vehicle_id integer NOT NULL,
    status character varying,
    maintenance_category character varying NOT NULL,
    service_date date,
    next_service_date date,
    service_cost double precision,
    service_provider character varying,
    notes character varying,
    created_at timestamp with time zone DEFAULT now(),
    is_active integer
);


--
-- Name: maintenance_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_alerts (
    id integer NOT NULL,
    vehicle_id integer NOT NULL,
    maintenance_id integer NOT NULL,
    alert_message character varying NOT NULL,
    alert_type character varying NOT NULL,
    alert_status character varying DEFAULT 'Pending'::character varying NOT NULL,
    generated_date date NOT NULL,
    next_service_date date NOT NULL
);


--
-- Name: maintenance_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.maintenance_alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: maintenance_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.maintenance_alerts_id_seq OWNED BY public.maintenance_alerts.id;


--
-- Name: maintenance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.maintenance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: maintenance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.maintenance_id_seq OWNED BY public.maintenance.id;


--
-- Name: shipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipments (
    id integer NOT NULL,
    tracking_id character varying NOT NULL,
    origin character varying NOT NULL,
    destination character varying NOT NULL,
    status character varying,
    sender_name character varying NOT NULL,
    receiver_name character varying NOT NULL,
    current_location character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    pickup_date timestamp without time zone,
    delivery_date timestamp without time zone
);


--
-- Name: shipments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shipments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shipments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shipments_id_seq OWNED BY public.shipments.id;


--
-- Name: trips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trips (
    id integer NOT NULL,
    shipment_id integer NOT NULL,
    vehicle_id integer NOT NULL,
    driver_id integer NOT NULL,
    start_location character varying NOT NULL,
    end_location character varying NOT NULL,
    departure_time timestamp without time zone,
    expected_arrival timestamp without time zone,
    status character varying,
    current_latitude character varying,
    current_longitude character varying,
    destination_latitude character varying,
    destination_longitude character varying,
    created_at timestamp without time zone,
    actual_arrival timestamp without time zone,
    distance double precision
);


--
-- Name: trips_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trips_id_seq OWNED BY public.trips.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    role character varying
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id integer NOT NULL,
    vehicle_number character varying NOT NULL,
    vehicle_type character varying NOT NULL,
    capacity character varying,
    status character varying
);


--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vehicles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehicles_id_seq OWNED BY public.vehicles.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: driver_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_assignments ALTER COLUMN id SET DEFAULT nextval('public.driver_assignments_id_seq'::regclass);


--
-- Name: driver_attendance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_attendance ALTER COLUMN id SET DEFAULT nextval('public.driver_attendance_id_seq'::regclass);


--
-- Name: drivers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers ALTER COLUMN id SET DEFAULT nextval('public.drivers_id_seq'::regclass);


--
-- Name: fuel_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_records ALTER COLUMN id SET DEFAULT nextval('public.fuel_records_id_seq'::regclass);


--
-- Name: maintenance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance ALTER COLUMN id SET DEFAULT nextval('public.maintenance_id_seq'::regclass);


--
-- Name: maintenance_alerts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_alerts ALTER COLUMN id SET DEFAULT nextval('public.maintenance_alerts_id_seq'::regclass);


--
-- Name: shipments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments ALTER COLUMN id SET DEFAULT nextval('public.shipments_id_seq'::regclass);


--
-- Name: trips id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips ALTER COLUMN id SET DEFAULT nextval('public.trips_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vehicles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN id SET DEFAULT nextval('public.vehicles_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alembic_version (version_num) FROM stdin;
90c3bda347a8
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, username, module, action, details, created_at) FROM stdin;
1	\N	\N	Vehicle	CREATE	Vehicle KA01AC1267 (ID: 5) was created.	2026-08-09 06:55:56.682906+00
2	\N	\N	Vehicle	UPDATE	Vehicle ID 5 updated. Vehicle number: KA01AC1267 -> KA01AC1267. Status: Available -> Available.	2026-08-09 06:57:19.712037+00
3	\N	\N	Driver	CREATE	Driver Ashok (ID: 6) was created.	2026-08-09 07:04:04.233106+00
4	3	Admin	Vehicle	CREATE	Vehicle KA01NEW1234 (ID: 6) was created.	2026-08-09 07:51:50.962821+00
5	3	Admin	Driver	CREATE	Driver Rahul (ID: 7) was created.	2026-08-09 07:57:06.460834+00
6	3	Admin	Driver	DELETE	Driver Rahul (ID: 7) was deleted.	2026-08-09 08:01:47.13692+00
7	3	Admin	Driver Assignment	CREATE	Driver ID 6 was assigned to Vehicle ID 6 for Trip ID 9. Assignment ID: 3.	2026-08-09 08:17:36.426117+00
8	3	Admin	Maintenance	CREATE	Maintenance record ID 5 was created for Vehicle ID 6. Category: MaintenanceCategory.OIL_CHANGE.	2026-08-09 08:39:00.215499+00
9	3	Admin	Fuel	CREATE	Fuel record ID 5 was created for Vehicle ID 6. Liters: 20.0, Cost: 2690.0.	2026-08-09 08:53:05.027176+00
10	3	Admin	Driver Attendance	CREATE	Attendance record ID 2 was created for Driver ID 6. Date: 2026-08-09, Status: Present.	2026-08-09 08:57:45.463321+00
11	3	Admin	Trip	CREATE	Trip ID 11 was created. Driver ID: 2, Vehicle ID: 5, Shipment ID: 10.	2026-08-10 16:17:24.048139+00
12	3	Admin	Trip	CREATE	Trip ID 12 was created. Driver ID: 2, Vehicle ID: 5, Shipment ID: 10.	2026-08-10 16:17:25.666694+00
13	3	Admin	Trip	CREATE	Trip ID 13 was created. Driver ID: 2, Vehicle ID: 5, Shipment ID: 10.	2026-08-10 16:17:26.40304+00
14	3	Admin	Trip	CREATE	Trip ID 14 was created. Driver ID: 2, Vehicle ID: 5, Shipment ID: 10.	2026-08-10 16:17:26.619595+00
15	3	Admin	Trip	DELETE	Trip ID 11 was deleted. Driver ID: 2, Vehicle ID: 5, Shipment ID: 10.	2026-08-10 16:17:38.402274+00
16	3	Admin	Trip	DELETE	Trip ID 12 was deleted. Driver ID: 2, Vehicle ID: 5, Shipment ID: 10.	2026-08-10 16:17:42.114693+00
17	3	Admin	Trip	DELETE	Trip ID 13 was deleted. Driver ID: 2, Vehicle ID: 5, Shipment ID: 10.	2026-08-10 16:17:45.453551+00
18	3	Admin	Vehicle	CREATE	Vehicle KL14AC1245 (ID: 7) was created.	2026-08-11 16:30:56.956715+00
19	3	Admin	Driver	CREATE	Driver Sreerag (ID: 8) was created.	2026-08-11 16:44:18.432823+00
20	3	Admin	Driver Assignment	RELEASE	Driver Assignment ID 2 was released. Driver ID: 1, Vehicle ID: 4.	2026-08-11 16:44:28.420208+00
21	3	Admin	Shipment	CREATE	Shipment TRK2004 (ID: 15) was created.	2026-08-12 13:51:33.869713+00
22	3	Admin	Trip	CREATE	Trip ID 15 was created. Driver ID: 8, Vehicle ID: 7, Shipment ID: 15.	2026-08-12 13:55:54.527365+00
23	3	Admin	Driver Assignment	CREATE	Driver ID 8 was assigned to Vehicle ID 5 for Trip ID 15. Assignment ID: 4.	2026-08-12 14:07:13.301953+00
24	3	Admin	Driver Assignment	CREATE	Driver ID 8 was assigned to Vehicle ID 5 for Trip ID 15. Assignment ID: 5.	2026-08-12 14:07:13.302306+00
25	3	Admin	Driver Attendance	CREATE	Attendance record ID 3 was created for Driver ID 8. Date: 2026-08-12, Status: Absent.	2026-08-12 14:12:01.427501+00
26	3	Admin	Fuel	CREATE	Fuel record ID 6 was created for Vehicle ID 7. Liters: 15.0, Cost: 1350.0.	2026-08-13 03:52:16.278717+00
27	3	Admin	Maintenance	CREATE	Maintenance record ID 6 was created for Vehicle ID 7. Category: MaintenanceCategory.TYRE_REPLACEMENT.	2026-08-13 03:55:18.631529+00
28	3	Admin	Maintenance	DELETE	Maintenance record ID 2 for Vehicle ID 1 was archived.	2026-08-13 03:55:33.377169+00
\.


--
-- Data for Name: driver_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.driver_assignments (id, driver_id, vehicle_id, trip_id, assignment_date, release_date, status, remarks) FROM stdin;
3	6	6	9	2026-08-07	\N	Assigned	Morning Delivery
2	1	4	9	2026-08-07	\N	Released	Morning Delivery
4	8	5	15	2026-08-13	\N	Assigned	NIL
\.


--
-- Data for Name: driver_attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.driver_attendance (id, driver_id, date, attendance_status, check_in_time, check_out_time) FROM stdin;
1	1	2026-08-01	Present	09:00:00	18:00:00
2	6	2026-08-09	Present	08:55:18.238	11:45:18.238
3	8	2026-08-12	Absent	08:30:00	18:30:00
\.


--
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.drivers (id, license_number, phone, email, status, name) FROM stdin;
2	DL123456789	9876543210	arjun123@gmail.com	Available	Arjun Kumar
5	DL 89765240	9870097210	arun100@gmail.com	On Trip	Arun S
6	DL120987654	9076543280	ashok21@gmail.com	Assigned	Ashok
1	DL12345678	9876543210	rahul@example.com	Available	Rahul Sharma
8	DL96331096	6933019655	sree@gmail.com	Assigned	Sreerag
\.


--
-- Data for Name: fuel_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fuel_records (id, vehicle_id, fuel_date, liters, cost, odometer, fuel_station) FROM stdin;
1	1	2026-07-19	35.5	3200	15200	Indian Oil
2	1	2026-07-28	45	4200	15450	Indian Oil
4	2	2026-08-06	15	2500	15000	Bharath Petroleum
5	6	2026-08-09	20	2690	15020	Indian Oil
6	7	2026-08-12	15	1350	14500	Bharath Petroleum
\.


--
-- Data for Name: maintenance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenance (id, vehicle_id, status, maintenance_category, service_date, next_service_date, service_cost, service_provider, notes, created_at, is_active) FROM stdin;
3	1	Scheduled	Engine Service	2026-08-10	2026-11-10	3500	ABC Motors	Regular engine maintenance	2026-07-27 15:07:46.124485+00	0
4	1	Scheduled	Oil Change	2026-08-04	2026-08-05	3500	Toyota Service	Routine service	2026-08-04 06:33:37.250024+00	1
5	6	Scheduled	Oil Change	2026-08-09	2026-08-12	2500	Toyota Service	Routine service	2026-08-09 08:39:00.215499+00	1
6	7	Scheduled	Tyre Replacement	2026-08-17	2026-12-30	3000	Toyota Service	Routine service	2026-08-13 03:55:18.631529+00	1
2	1	string	Engine Service	2026-08-10	2026-11-10	2500	Toyota Service Center	Regular service	2026-07-27 15:06:21.716564+00	0
\.


--
-- Data for Name: maintenance_alerts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenance_alerts (id, vehicle_id, maintenance_id, alert_message, alert_type, alert_status, generated_date, next_service_date) FROM stdin;
2	1	2	Engine service is scheduled for this vehicle	Scheduled Maintenance	Completed	2026-08-10	2026-11-10
3	1	3	Engine service is scheduled for this vehicle	Scheduled Maintenance	Completed	2026-08-10	2026-11-10
5	6	5	Oil change service is due soon	Service Due	Completed	2026-08-10	2026-08-12
9	6	5	Maintenance service is due soon	Service Due	Completed	2026-08-10	2026-08-12
4	1	4	Oil change service is due soon	Service Due	Completed	2026-08-10	2026-08-05
6	1	2	Maintenance service is scheduled	Scheduled Maintenance	Completed	2026-08-10	2026-11-10
7	1	3	Maintenance service is scheduled	Scheduled Maintenance	Completed	2026-08-10	2026-11-10
8	1	4	Maintenance service is due	Overdue	Completed	2026-08-10	2026-08-05
\.


--
-- Data for Name: shipments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shipments (id, tracking_id, origin, destination, status, sender_name, receiver_name, current_location, created_at, pickup_date, delivery_date) FROM stdin;
9	TRK1001	Bangalore	Mangalore	Created	Amazon Warehouse	John Smith	Bangalore	2026-08-05 13:43:28.449184	\N	\N
10	TRK1005	Bangalore	Mangalore	Created	Amazon	Ahisha	Warehouse	2026-08-05 15:15:22.970598	\N	\N
5	TRK1002	Mangalore	Bangalore	In Transit	Rahul	Amit	Warehouse	2026-08-05 20:47:32.259149	\N	\N
15	TRK2004	Mysuru	Bangalore	Assigned	Amazon Warehouse	Ganesh	Warehouse	2026-08-12 13:51:33.882969	\N	\N
\.


--
-- Data for Name: trips; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trips (id, shipment_id, vehicle_id, driver_id, start_location, end_location, departure_time, expected_arrival, status, current_latitude, current_longitude, destination_latitude, destination_longitude, created_at, actual_arrival, distance) FROM stdin;
15	15	7	8	Mysuru	Bengaluru	2026-08-13 19:25:00	2026-08-15 09:30:00	Delivered	12.97647	77.59003	12.9767936	77.590082	\N	\N	\N
9	9	2	1	Mangalore	Kasaragod	2026-08-06 21:52:00	2026-08-07 21:52:00	Delivered	12.50007	74.98963	12.50	74.99	2026-08-05 16:22:57.461709	\N	0
14	10	5	2	Mangalore	Bangalore	2026-08-10 21:46:00	2026-08-11 21:47:00	Delivered	12.97647	77.59003	12.9767936	77.590082	2026-08-10 16:17:28.288776	\N	0
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password, role) FROM stdin;
1	amisha	amisha@gmail.com	$2b$12$ZYoA0KO43823mfhv5gu.o.wYBauQFLZg1.PbI95NU/bCy4nO1uOuC	admin
2	Amisha	ami123@gmail.com	$2b$12$HLMSEGN6VoGZsnQUy6FcJ.oIslQp3yWDF37YhgBB.IiXNHyfSi7JK	user
3	Admin	admin123@gmail.com	$2b$12$1/9ClWYJw4SC5D1YWmb2ye3l52BTc4jf0ghUzpU/0HTcJsOdPb83C	admin
4	Ahisha	ahisha@gmail.com	$2b$12$YlhMEl/8M1I5JS3zualGEemQHnBb.mo/VdUWtmssDDVXCroxcl.CK	user
7	Manager	manager@fleetflow.com	$2b$12$V53EEUnIwUkNHKdnJcnVSOHQT8zno3I1wHU9D67.vlMsgzMZ1pI4m	manager
8	testadmin	testadmin@gmail.com	$2b$12$9psaBYzY3TR.ETNuwVQ90e.V24QbMc..nNmhsJ4gtv5HbMIxEbZ4q	admin
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles (id, vehicle_number, vehicle_type, capacity, status) FROM stdin;
2	KA19AB1234	Truck	5000	Available
1	KA01AB1234	Truck	5000	Maintenance
6	KA01NEW1234	Truck	5000	Maintenance
4	KL14AB1234	Tata Ace	1200	Available
5	KA01AC1267	Truck	900	In Transit
7	KL14AC1245	Truck	3000	Maintenance
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 28, true);


--
-- Name: driver_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.driver_assignments_id_seq', 5, true);


--
-- Name: driver_attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.driver_attendance_id_seq', 3, true);


--
-- Name: drivers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.drivers_id_seq', 8, true);


--
-- Name: fuel_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fuel_records_id_seq', 6, true);


--
-- Name: maintenance_alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.maintenance_alerts_id_seq', 9, true);


--
-- Name: maintenance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.maintenance_id_seq', 6, true);


--
-- Name: shipments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shipments_id_seq', 15, true);


--
-- Name: trips_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trips_id_seq', 15, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: vehicles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vehicles_id_seq', 7, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: driver_assignments driver_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_assignments
    ADD CONSTRAINT driver_assignments_pkey PRIMARY KEY (id);


--
-- Name: driver_attendance driver_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_attendance
    ADD CONSTRAINT driver_attendance_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_email_key UNIQUE (email);


--
-- Name: drivers drivers_license_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_license_number_key UNIQUE (license_number);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- Name: fuel_records fuel_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_records
    ADD CONSTRAINT fuel_records_pkey PRIMARY KEY (id);


--
-- Name: maintenance_alerts maintenance_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_alerts
    ADD CONSTRAINT maintenance_alerts_pkey PRIMARY KEY (id);


--
-- Name: maintenance maintenance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance
    ADD CONSTRAINT maintenance_pkey PRIMARY KEY (id);


--
-- Name: shipments shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (id);


--
-- Name: shipments shipments_tracking_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_tracking_id_key UNIQUE (tracking_id);


--
-- Name: trips trips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_vehicle_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_vehicle_number_key UNIQUE (vehicle_number);


--
-- Name: ix_audit_logs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_id ON public.audit_logs USING btree (id);


--
-- Name: ix_driver_assignments_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_driver_assignments_id ON public.driver_assignments USING btree (id);


--
-- Name: ix_driver_attendance_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_driver_attendance_id ON public.driver_attendance USING btree (id);


--
-- Name: ix_drivers_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_drivers_id ON public.drivers USING btree (id);


--
-- Name: ix_fuel_records_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_fuel_records_id ON public.fuel_records USING btree (id);


--
-- Name: ix_maintenance_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_maintenance_id ON public.maintenance USING btree (id);


--
-- Name: ix_shipments_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shipments_id ON public.shipments USING btree (id);


--
-- Name: ix_trips_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_trips_id ON public.trips USING btree (id);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_vehicles_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vehicles_id ON public.vehicles USING btree (id);


--
-- Name: driver_assignments driver_assignments_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_assignments
    ADD CONSTRAINT driver_assignments_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: driver_assignments driver_assignments_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_assignments
    ADD CONSTRAINT driver_assignments_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;


--
-- Name: driver_assignments driver_assignments_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_assignments
    ADD CONSTRAINT driver_assignments_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- Name: driver_attendance driver_attendance_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_attendance
    ADD CONSTRAINT driver_attendance_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: fuel_records fuel_records_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_records
    ADD CONSTRAINT fuel_records_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- Name: maintenance_alerts maintenance_alerts_maintenance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_alerts
    ADD CONSTRAINT maintenance_alerts_maintenance_id_fkey FOREIGN KEY (maintenance_id) REFERENCES public.maintenance(id);


--
-- Name: maintenance_alerts maintenance_alerts_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_alerts
    ADD CONSTRAINT maintenance_alerts_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- Name: maintenance maintenance_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance
    ADD CONSTRAINT maintenance_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- Name: trips trips_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: trips trips_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id);


--
-- Name: trips trips_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict lYhpWV7CMB5GEwIddh6nrdI1XsTH70iF2cKxDyOQVgU7lmnSbQyg8YZt7PsicJW

