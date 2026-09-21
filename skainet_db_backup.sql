--
-- PostgreSQL database dump
--

\restrict 6A93KvmSXAhOvtlfUCqk8sQT9tsMqpCtPXkxu2trSBEAs25uI870WaNOs0lWUiY

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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
-- Name: Alert; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Alert" (
    id text NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    severity text DEFAULT 'WARNING'::text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "orderId" text,
    "jewelerName" text NOT NULL
);


ALTER TABLE public."Alert" OWNER TO postgres;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "actorId" text NOT NULL,
    "actorRole" text,
    action text NOT NULL,
    module text NOT NULL,
    details text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

--
-- Name: Batch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Batch" (
    id text NOT NULL,
    "entryWeight" double precision NOT NULL,
    "exitWeight" double precision NOT NULL,
    "ringsCount" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Batch" OWNER TO postgres;

--
-- Name: ClientOrder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ClientOrder" (
    id text NOT NULL,
    "shortId" text NOT NULL,
    "clientName" text NOT NULL,
    email text,
    phone text,
    design text NOT NULL,
    "estimatedWeight" double precision NOT NULL,
    status text DEFAULT 'En Espera'::text NOT NULL,
    "stepIndex" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ClientOrder" OWNER TO postgres;

--
-- Name: KardexMovement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."KardexMovement" (
    id text NOT NULL,
    "materialId" text NOT NULL,
    type text NOT NULL,
    quantity double precision NOT NULL,
    "originProvider" text,
    "workOrderId" text,
    observations text,
    "responsibleId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."KardexMovement" OWNER TO postgres;

--
-- Name: Machine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Machine" (
    id text NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'LASER'::text NOT NULL,
    status text DEFAULT 'OPERATIONAL'::text NOT NULL,
    "cycleCount" integer DEFAULT 0 NOT NULL,
    "maintenanceThreshold" integer DEFAULT 500 NOT NULL,
    "lastMaintenance" timestamp(3) without time zone
);


ALTER TABLE public."Machine" OWNER TO postgres;

--
-- Name: Material; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Material" (
    id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    unit text NOT NULL,
    stock double precision DEFAULT 0 NOT NULL,
    "minStock" double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'Activo'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Material" OWNER TO postgres;

--
-- Name: PhaseTimeLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PhaseTimeLog" (
    id text NOT NULL,
    "workOrderId" text NOT NULL,
    "jewelerId" text NOT NULL,
    phase text NOT NULL,
    action text NOT NULL,
    "durationSeconds" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PhaseTimeLog" OWNER TO postgres;

--
-- Name: Ring; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Ring" (
    id text NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'PENDIENTE'::text NOT NULL,
    "securePin" text DEFAULT '0000'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "batchId" text NOT NULL
);


ALTER TABLE public."Ring" OWNER TO postgres;

--
-- Name: TripleWeightLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TripleWeightLog" (
    id text NOT NULL,
    "workOrderId" text NOT NULL,
    "jewelerId" text NOT NULL,
    phase text NOT NULL,
    weight1 double precision NOT NULL,
    weight2 double precision NOT NULL,
    weight3 double precision NOT NULL,
    "lossPercentage" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TripleWeightLog" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'Fuera de Turno'::text NOT NULL,
    password text NOT NULL,
    phone text,
    "lastLogin" timestamp(3) without time zone,
    history text DEFAULT '[]'::jsonb NOT NULL,
    "securityQuestions" text DEFAULT '[]'::jsonb NOT NULL,
    "accountStatus" text DEFAULT 'Activo'::text NOT NULL,
    "documentType" text,
    email text,
    "failedAttempts" integer DEFAULT 0 NOT NULL,
    "lockoutUntil" timestamp(3) without time zone,
    "mustChangePassword" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: WorkOrder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WorkOrder" (
    id text NOT NULL,
    "ringId" text NOT NULL,
    "ringName" text NOT NULL,
    "receiverId" text NOT NULL,
    "executorId" text NOT NULL,
    "totalWeight" double precision NOT NULL,
    status text DEFAULT 'OPEN'::text NOT NULL,
    "startTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endTime" timestamp(3) without time zone,
    "durationMinutes" integer,
    loss double precision,
    "isAnomaly" boolean DEFAULT false NOT NULL,
    explanation text,
    weights text NOT NULL,
    "providedPin" text NOT NULL
);


ALTER TABLE public."WorkOrder" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Alert; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Alert" (id, type, message, severity, "timestamp", "orderId", "jewelerName") FROM stdin;
ALT-101	WEIGHT	PÉRDIDA CRÍTICA: Se detectó merma de 0.12g (0.8%) en la pieza Anillo 3 (Lote B-101).	CRITICAL	2026-09-14 13:16:03.436	ORD-103	Plata
ALT-102	TIME	TIEMPO EXCEDIDO: El joyero lleva 125 min con la pieza Anillo 1 (Lote B-101).	WARNING	2026-09-13 13:16:03.436	ORD-101	Ramiro
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, "actorId", "actorRole", action, module, details, "createdAt") FROM stdin;
\.


--
-- Data for Name: Batch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Batch" (id, "entryWeight", "exitWeight", "ringsCount", "createdAt") FROM stdin;
B-101	250	242.5	5	2026-09-16 15:16:03.444
B-102	180	176.8	3	2026-09-16 15:16:03.45
\.


--
-- Data for Name: ClientOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ClientOrder" (id, "shortId", "clientName", email, phone, design, "estimatedWeight", status, "stepIndex", "createdAt") FROM stdin;
e0d9aaef-74b8-43cd-8930-aa73065dbba8	9845	Marcela Gómez	marcela@example.com	+573001234567	Anillo de Compromiso Oro Blanco 18k	8.5	En Espera	0	2026-09-16 15:16:03.459
b26efefc-1005-4e93-9c36-d5a921e3c7cb	4312	Andrés Felipe	andres@example.com	+573007654321	Argollas de Matrimonio Clásicas	14.2	En Proceso	2	2026-09-16 15:16:03.459
5b529725-8ddb-446b-8e22-988eb0e1bb41	6459	Prueba local 20260916101906	prueba.local@example.test	\N	Anillo de prueba de conexión	1.25	En Espera	0	2026-09-16 15:19:08.198
\.


--
-- Data for Name: KardexMovement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."KardexMovement" (id, "materialId", type, quantity, "originProvider", "workOrderId", observations, "responsibleId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Machine; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Machine" (id, name, type, status, "cycleCount", "maintenanceThreshold", "lastMaintenance") FROM stdin;
M-01	Láser de Marcado Fibra	LASER	OPERATIONAL	420	500	2026-09-16 15:16:03.461
M-02	Impresora 3D Chitubox	PRINTER	OPERATIONAL	85	100	2026-09-16 15:16:03.461
M-03	Estación Rhino 8	CAD	OPERATIONAL	0	1000	2026-09-16 15:16:03.461
\.


--
-- Data for Name: Material; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Material" (id, name, category, unit, stock, "minStock", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: PhaseTimeLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PhaseTimeLog" (id, "workOrderId", "jewelerId", phase, action, "durationSeconds", "createdAt") FROM stdin;
\.


--
-- Data for Name: Ring; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Ring" (id, name, status, "securePin", "createdAt", "batchId") FROM stdin;
B-101-R1	Anillo 1	COMPLETED	1111	2026-09-16 15:16:03.444	B-101
B-101-R2	Anillo 2	COMPLETED	2222	2026-09-16 15:16:03.444	B-101
B-101-R3	Anillo 3	COMPLETED	3333	2026-09-16 15:16:03.444	B-101
B-101-R4	Anillo 4	COMPLETED	4444	2026-09-16 15:16:03.444	B-101
B-101-R5	Anillo 5	COMPLETED	5555	2026-09-16 15:16:03.444	B-101
B-102-R1	Anillo 1	COMPLETED	6666	2026-09-16 15:16:03.45	B-102
B-102-R2	Anillo 2	COMPLETED	7777	2026-09-16 15:16:03.45	B-102
B-102-R3	Anillo 3	PENDING	8888	2026-09-16 15:16:03.45	B-102
\.


--
-- Data for Name: TripleWeightLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TripleWeightLog" (id, "workOrderId", "jewelerId", phase, weight1, weight2, weight3, "lossPercentage", "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, role, status, password, phone, "lastLogin", history, "securityQuestions", "accountStatus", "documentType", email, "failedAttempts", "lockoutUntil", "mustChangePassword") FROM stdin;
1000000000	Super Administrador (Dueño)	Super Administrador	Disponible	admin	+573000000000	\N	[]	[]	Activo	CC	admin@skainet.com	0	\N	f
4	Danna Administradora	Administrador	Disponible	123	+573000000001	\N	[]	[]	Activo	CC	danna@skainet.com	0	\N	t
1	Ramiro Joyero	Joyero	Fuera de Turno	123	+573000000002	\N	[]	[]	Activo	CC	ramiro@skainet.com	0	\N	t
\.


--
-- Data for Name: WorkOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorkOrder" (id, "ringId", "ringName", "receiverId", "executorId", "totalWeight", status, "startTime", "endTime", "durationMinutes", loss, "isAnomaly", explanation, weights, "providedPin") FROM stdin;
ORD-101	B-101-R1	Anillo 1 (Lote B-101)	4	1	12.5	CLOSED	2026-09-13 12:16:03.452	2026-09-13 13:01:03.452	45	0.02	f	\N	{"anillo":10.2,"plastilina":1.5,"bolsa":0.8}	1111
ORD-102	B-101-R2	Anillo 2 (Lote B-101)	4	2	8.2	CLOSED	2026-09-13 13:16:03.452	2026-09-13 14:31:03.452	75	0.02	f	\N	{"anillo":6.1,"plastilina":1.2,"bolsa":0.9}	2222
ORD-103	B-101-R3	Anillo 3 (Lote B-101)	4	3	15	CLOSED	2026-09-14 11:16:03.452	2026-09-14 13:16:03.452	120	0.12	t	Porosidad alta en fundición requirió desbaste y pulido extra profundo	{"anillo":12.5,"plastilina":1.8,"bolsa":0.7}	3333
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
67bcf0ed-19f4-4c1c-a0be-d3c3869acaca	896d226f9f68d06ee41538b103a529c36f66c4f168a4952a84e6bc4e29fe7c16	2026-09-16 10:09:32.458927-05	20260626051254_init	\N	\N	2026-09-16 10:09:32.426634-05	1
\.


--
-- Name: Alert Alert_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Alert"
    ADD CONSTRAINT "Alert_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Batch Batch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Batch"
    ADD CONSTRAINT "Batch_pkey" PRIMARY KEY (id);


--
-- Name: ClientOrder ClientOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ClientOrder"
    ADD CONSTRAINT "ClientOrder_pkey" PRIMARY KEY (id);


--
-- Name: KardexMovement KardexMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."KardexMovement"
    ADD CONSTRAINT "KardexMovement_pkey" PRIMARY KEY (id);


--
-- Name: Machine Machine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Machine"
    ADD CONSTRAINT "Machine_pkey" PRIMARY KEY (id);


--
-- Name: Material Material_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Material"
    ADD CONSTRAINT "Material_pkey" PRIMARY KEY (id);


--
-- Name: PhaseTimeLog PhaseTimeLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PhaseTimeLog"
    ADD CONSTRAINT "PhaseTimeLog_pkey" PRIMARY KEY (id);


--
-- Name: Ring Ring_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ring"
    ADD CONSTRAINT "Ring_pkey" PRIMARY KEY (id);


--
-- Name: TripleWeightLog TripleWeightLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TripleWeightLog"
    ADD CONSTRAINT "TripleWeightLog_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WorkOrder WorkOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkOrder"
    ADD CONSTRAINT "WorkOrder_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ClientOrder_shortId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ClientOrder_shortId_key" ON public."ClientOrder" USING btree ("shortId");


--
-- Name: KardexMovement KardexMovement_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."KardexMovement"
    ADD CONSTRAINT "KardexMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."Material"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ring Ring_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ring"
    ADD CONSTRAINT "Ring_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."Batch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 6A93KvmSXAhOvtlfUCqk8sQT9tsMqpCtPXkxu2trSBEAs25uI870WaNOs0lWUiY

