--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12
-- Dumped by pg_dump version 15.12

-- Started on 2025-06-24 10:17:08

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- TOC entry 221 (class 1259 OID 16654)
-- Name: immagini; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.immagini (
    idimm integer NOT NULL,
    idprod integer NOT NULL,
    img character varying(2000)
);


ALTER TABLE public.immagini OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16653)
-- Name: immagini_idimm_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.immagini_idimm_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.immagini_idimm_seq OWNER TO postgres;

--
-- TOC entry 3370 (class 0 OID 0)
-- Dependencies: 220
-- Name: immagini_idimm_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.immagini_idimm_seq OWNED BY public.immagini.idimm;


--
-- TOC entry 219 (class 1259 OID 16455)
-- Name: ordini; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ordini (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    data_creazione timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    stato character varying(20) DEFAULT 'in lavorazione'::character varying,
    id_prodotto integer,
    quantita integer DEFAULT 1 NOT NULL,
    venditore_id integer,
    id_pagamento integer,
    CONSTRAINT ordini_stato_check CHECK (((stato)::text = ANY ((ARRAY['in lavorazione'::character varying, 'spedito'::character varying, 'completato'::character varying, 'annullato'::character varying])::text[])))
);


ALTER TABLE public.ordini OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16454)
-- Name: ordini_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ordini_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ordini_id_seq OWNER TO postgres;

--
-- TOC entry 3371 (class 0 OID 0)
-- Dependencies: 218
-- Name: ordini_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ordini_id_seq OWNED BY public.ordini.id;


--
-- TOC entry 217 (class 1259 OID 16433)
-- Name: prodotti; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prodotti (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    descrizione text,
    prezzo numeric(10,2) NOT NULL,
    disponibilita integer NOT NULL,
    artigiano_id integer NOT NULL,
    data_pubblicazione timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    categoria character varying(20),
    CONSTRAINT prodotti_disponibilita_check CHECK ((disponibilita >= 0)),
    CONSTRAINT prodotti_prezzo_check CHECK ((prezzo >= (0)::numeric))
);


ALTER TABLE public.prodotti OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 16432)
-- Name: prodotti_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prodotti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.prodotti_id_seq OWNER TO postgres;

--
-- TOC entry 3372 (class 0 OID 0)
-- Dependencies: 216
-- Name: prodotti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prodotti_id_seq OWNED BY public.prodotti.id;


--
-- TOC entry 215 (class 1259 OID 16411)
-- Name: utenti; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utenti (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    ruolo character varying(20) NOT NULL,
    indirizzo character varying(50),
    telefono bigint,
    CONSTRAINT utenti_ruolo_check CHECK (((ruolo)::text = ANY ((ARRAY['cliente'::character varying, 'artigiano'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.utenti OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 16410)
-- Name: utenti_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utenti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.utenti_id_seq OWNER TO postgres;

--
-- TOC entry 3373 (class 0 OID 0)
-- Dependencies: 214
-- Name: utenti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utenti_id_seq OWNED BY public.utenti.id;


--
-- TOC entry 3195 (class 2604 OID 16657)
-- Name: immagini idimm; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immagini ALTER COLUMN idimm SET DEFAULT nextval('public.immagini_idimm_seq'::regclass);


--
-- TOC entry 3191 (class 2604 OID 16458)
-- Name: ordini id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordini ALTER COLUMN id SET DEFAULT nextval('public.ordini_id_seq'::regclass);


--
-- TOC entry 3189 (class 2604 OID 16436)
-- Name: prodotti id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prodotti ALTER COLUMN id SET DEFAULT nextval('public.prodotti_id_seq'::regclass);


--
-- TOC entry 3188 (class 2604 OID 16414)
-- Name: utenti id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utenti ALTER COLUMN id SET DEFAULT nextval('public.utenti_id_seq'::regclass);


--
-- TOC entry 3364 (class 0 OID 16654)
-- Dependencies: 221
-- Data for Name: immagini; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.immagini (idimm, idprod, img) FROM stdin;
1	1	test.jpg
2	3	test.jpg
3	5	test.jpg
4	7	test.jpg
5	9	test.jpg
6	11	test.jpg
7	45	test.jpg
\.


--
-- TOC entry 3362 (class 0 OID 16455)
-- Dependencies: 219
-- Data for Name: ordini; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ordini (id, cliente_id, data_creazione, stato, id_prodotto, quantita, venditore_id, id_pagamento) FROM stdin;
1	19	2025-06-23 14:52:22.382919	in lavorazione	6	3	\N	\N
2	19	2025-06-23 14:52:22.382919	in lavorazione	16	2	\N	\N
3	19	2025-06-23 14:56:04.9727	in lavorazione	20	1	\N	\N
4	19	2025-06-23 14:57:01.875831	in lavorazione	23	1	\N	\N
5	19	2025-06-23 14:57:01.875831	in lavorazione	8	1	\N	\N
6	19	2025-06-23 15:52:38.789778	in lavorazione	4	2	\N	\N
7	19	2025-06-23 15:52:38.789778	in lavorazione	2	1	\N	\N
8	19	2025-06-23 15:52:38.789778	in lavorazione	14	3	\N	\N
9	19	2025-06-23 15:52:38.789778	in lavorazione	1	1	\N	\N
10	19	2025-06-23 16:49:02.180869	in lavorazione	7	1	\N	\N
11	19	2025-06-23 16:49:43.812908	in lavorazione	11	1	\N	\N
12	19	2025-06-23 16:50:03.597688	in lavorazione	13	1	\N	\N
13	19	2025-06-23 16:51:10.221155	in lavorazione	12	1	\N	\N
14	19	2025-06-23 16:51:58.384145	in lavorazione	17	1	\N	\N
15	19	2025-06-23 16:52:18.446483	in lavorazione	5	1	\N	\N
16	19	2025-06-23 16:52:58.208734	in lavorazione	24	1	\N	\N
17	19	2025-06-23 17:18:32.413319	in lavorazione	10	1	\N	\N
18	22	2025-06-23 17:18:56.411353	in lavorazione	26	1	22	\N
19	22	2025-06-23 17:19:25.895036	in lavorazione	27	1	22	\N
33	22	2025-06-23 22:25:26.094717	in lavorazione	19	1	22	\N
34	22	2025-06-23 22:25:26.772233	in lavorazione	19	1	22	\N
\.


--
-- TOC entry 3360 (class 0 OID 16433)
-- Dependencies: 217
-- Data for Name: prodotti; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prodotti (id, nome, descrizione, prezzo, disponibilita, artigiano_id, data_pubblicazione, categoria) FROM stdin;
18	Brocca in ceramica	Brocca rustica smaltata bianca.	40.00	6	7	2025-06-19 16:37:55.488688	cucina
25	Gemelli eleganti	Gemelli per camicia in argento.	70.00	5	8	2025-06-19 16:37:55.488688	accessori
28	Spilla floreale	Spilla d argento con motivo floreale.	35.00	7	8	2025-06-19 16:37:55.488688	gioielli
29	Anello doppio	Anello a doppia fascia in argento.	65.00	6	8	2025-06-19 16:37:55.488688	gioielli
30	Cavigliera sottile	Cavigliera decorativa in argento.	40.00	8	8	2025-06-19 16:37:55.488688	gioielli
31	Cornice "boh"	Cornice di stile indefinito.	20.00	10	15	2025-06-19 16:37:55.488688	decorazione
32	Oggetto misterioso	Oggetto di funzione ignota.	99.00	1	15	2025-06-19 16:37:55.488688	altro
33	Tavola bohémienne	Tavola in legno decorata a caso.	75.00	3	15	2025-06-19 16:37:55.488688	arredamento
34	Lampada boh	Lampada stravagante in legno.	88.00	2	15	2025-06-19 16:37:55.488688	illuminazione
35	Sgabello incerto	Sgabello di design incerto.	55.00	4	15	2025-06-19 16:37:55.488688	arredamento
36	Cassetta della fantasia	Scatola portaoggetti decorata a mano.	32.00	7	15	2025-06-19 16:37:55.488688	decorazione
38	Mobile boh	Mobiletto artigianale indefinito.	110.00	1	15	2025-06-19 16:37:55.488688	arredamento
39	Decorazione casuale	Oggetto decorativo senza scopo.	18.00	9	15	2025-06-19 16:37:55.488688	altro
40	Cornice confusa	Cornice con forme astratte.	27.00	6	15	2025-06-19 16:37:55.488688	decorazione
3	Cornice artigianale	Cornice in legno decorata a mano.	40.00	0	6	2025-06-19 16:37:55.488688	decorazione
9	Portapenne	Portapenne da scrivania in legno di olivo.	15.00	0	6	2025-06-19 16:37:55.488688	ufficio
15	Lampada ceramica	Lampada con base in ceramica decorata.	90.00	0	7	2025-06-19 16:37:55.488688	illuminazione
21	Collana d argento	Collana artigianale in argento puro.	110.00	0	8	2025-06-19 16:37:55.488688	gioielli
22	Anello inciso	Anello in argento con incisione personalizzata.	60.00	0	8	2025-06-19 16:37:55.488688	gioielli
37	Maschera artistica	Maschera tribale senza contesto.	60.00	0	15	2025-06-19 16:37:55.488688	decorazione
4	Mensola sospesa	Mensola in legno per libri o piante.	60.00	4	6	2025-06-19 16:37:55.488688	arredamento
2	Tavolino rustico	Tavolino in legno massello perfetto per salotti.	250.00	1	6	2025-06-19 16:37:55.488688	arredamento
14	Ciotola in ceramica	Ciotola rustica smaltata.	28.00	7	7	2025-06-19 16:37:55.488688	cucina
45	Giallo	Giallo molto bello	1.00	90	19	2025-06-20 21:39:04.128005	elettronica
1	Scultura in legno	Scultura realizzata a mano con legno di ulivo.	120.00	4	6	2025-06-19 16:37:55.488688	scultura
7	Specchio con cornice	Specchio decorativo con cornice intagliata.	95.00	2	6	2025-06-19 16:37:55.488688	decorazione
11	Vaso in ceramica blu	Vaso decorato con motivi floreali.	55.00	5	7	2025-06-19 16:37:55.488688	ceramica
6	Lampada in legno	Lampada artigianale con base in rovere.	85.00	1	6	2025-06-19 16:37:55.488688	illuminazione
16	Piatto da parete	Piatto artistico da esposizione.	35.00	5	7	2025-06-19 16:37:55.488688	decorazione
20	Scultura da tavolo	Piccola scultura astratta in ceramica.	70.00	3	7	2025-06-19 16:37:55.488688	scultura
23	Bracciale martellato	Bracciale in argento lavorato a mano.	85.00	5	8	2025-06-19 16:37:55.488688	gioielli
8	Sedia in legno	Sedia comoda in legno chiaro.	130.00	4	6	2025-06-19 16:37:55.488688	arredamento
13	Piastrelle artistiche	Set da 4 piastrelle colorate.	45.00	7	7	2025-06-19 16:37:55.488688	decorazione
12	Tazza dipinta a mano	Tazza in ceramica smaltata a mano.	18.00	11	7	2025-06-19 16:37:55.488688	cucina
17	Set di tazzine	Set da 4 tazzine color pastello.	60.00	4	7	2025-06-19 16:37:55.488688	cucina
5	Tagliere da cucina	Tagliere robusto in legno di acacia.	30.00	19	6	2025-06-19 16:37:55.488688	cucina
24	Orecchini pendenti	Orecchini lunghi in argento.	45.00	7	8	2025-06-19 16:37:55.488688	gioielli
10	Portachiavi da parete	Piccolo appendi-chiavi da ingresso.	22.00	9	6	2025-06-19 16:37:55.488688	decorazione
26	Ciondolo simbolico	Ciondolo con simbolo di infinito.	50.00	8	8	2025-06-19 16:37:55.488688	gioielli
27	Portachiavi d arte	Portachiavi in metallo cesellato.	25.00	9	8	2025-06-19 16:37:55.488688	accessori
19	Portaincenso	Portaincenso decorato in ceramica.	16.00	7	7	2025-06-19 16:37:55.488688	decorazione
\.


--
-- TOC entry 3358 (class 0 OID 16411)
-- Dependencies: 215
-- Data for Name: utenti; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utenti (id, username, email, password_hash, ruolo, indirizzo, telefono) FROM stdin;
1	pippo	pippo@gmail.com	pippo42	cliente	\N	\N
2	tio	tio@gmail.com	$2b$10$MhNxmkEv.xZ.lKOyWqDN6ezwezeYm3kcLqep2YHAJfPGlaH/yQuaq	cliente	\N	1231231231
4	admin1	admin@artigianato.it	$2a$10$xJwL5v6JKoYX7h7F2WZsE.5L5JYvD6Q3nR9VzXcJk1tLdN1JZwZQW	admin	Via Roma 1, Milano	\N
5	admin2	staff@artigianato.it	$2a$10$8eA7b9cD2fE3gH4iJ5kLmN6oP7qR8sT9uV0wX1yZ2A3B4C5D6E7F	admin	\N	\N
6	mastro_legno	legno@artigiano.it	$2a$10$H2h3j4k5L6m7N8o9P0qR1S2t3U4v5W6x7Y8z9A0B1C2D3E4F5G6H	artigiano	Via Dante 10, Firenze	\N
7	ceramista_aura	ceramica@artigiano.it	$2a$10$QwErTyUiOpAsDfGhJkLzXcVbNmQwErTyUiOpAsDfGhJkLzXcVbNm	artigiano	Piazza Duomo 5, Orvieto	\N
8	argento_vivo	argento@artigiano.it	$2a$10$MnBvCxZqWeRtYuIoPlKjUvHnJmBvCxZqWeRtYuIoPlKjUvHnJm	artigiano	Calle Grande 22, Venezia	\N
9	cliente1	mario.rossi@email.com	$2a$10$AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz	cliente	Viale Europa 15, Roma	\N
10	cliente2	laura.bianchi@email.com	$2a$10$ZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlKkJjIiHhGgFfEeDdCcBbAa	cliente	Corso Italia 33, Napoli	\N
11	cliente3	paolo.verdi@email.com	$2a$10$1q2w3e4r5t6y7u8i9o0pA1s2d3f4g5h6j7k8l9m0n1b2v3c4x5z6	cliente	\N	\N
12	oms	oms@gmail.com	$2b$10$JP3lG4qfwWjdv1x2CMINqeZjfWqrkWr.tv2i3MNOJrt229MIu.dz.	cliente	\N	123344567789
13	sipuli	sipuli@gmail.com	$2b$10$/vMnQaxfQuG/2ciNK7HesOdCseDweuhG/gKKrWWPL9ajqUHMxYip2	cliente	\N	123456789999
14	omsis	omsis@gmail.com	$2b$10$4ZPDSq4Jij.UmuR5qKLnGOAlTF8iu.lNv7wM52UOMCl5tv/oOA6Tm	cliente	\N	123543531
15	boh	boh@gmail.com	$2b$10$ENys5Tbk1Hi/M.BXkqLGiO8882LiFAeb5Mcyh4FVcRAp5kiukgGVW	artigiano	boh	1234567890
16	s	s@gmail	$2b$10$0x9YR2fz7Y6aTa8dRytx.eGk25aq8KbFr6TLMAtwaSd7Eawb9qUZG	cliente	\N	1234567890
17	gatto	gatto@gmail.com	$2b$10$ejJYa275WRo2IwJw3IV7k.LjiWg/v9UxIoLNtdCuZX7RPLZNP/zdO	artigiano	casaesso	987654321
18	pio	pio@gmail.com	$2b$10$irAQuMVeFad.aX5uZCTVfeDc/ESrYqV3jaz7ACQLR897kWgKsUOg6	artigiano	web	\N
19	user	user@gmail.com	$2b$10$NYTfY9iurBCWYpu8sTiekOejdycxWkEdKFTHzHO1oOanzxCMEuWWC	artigiano	casaRusso	\N
3	cana	cane@gmail.com	$2b$10$rDlYlYbJNzXJk4k.Tspre..Gf7PeZ23cWyCz6vD92gtrlQRllpJq6	cliente		1234567890
20	ciao	ciao@gmail.com	$2b$10$IHYS7DewdtW1sWQLp9eNaOlsAg.pEmnVTKg2h3Gxs.H3NhsXw58NK	cliente	\N	\N
21	pas	pas@gmail.com	$2b$10$CxEqh4gelQLjXcUq35mc9uThfDOQmtYFuZnSixC5cFLCxmY6TBW2.	cliente	\N	\N
22	qwerty	qwerty@qwerty.com	$2b$10$nECCEB49cwNxLFHUolXR.edMLazzcrPgrr78SwtZDE.0P7NzenDy6	artigiano	wetry	\N
\.


--
-- TOC entry 3374 (class 0 OID 0)
-- Dependencies: 220
-- Name: immagini_idimm_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.immagini_idimm_seq', 22, true);


--
-- TOC entry 3375 (class 0 OID 0)
-- Dependencies: 218
-- Name: ordini_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ordini_id_seq', 34, true);


--
-- TOC entry 3376 (class 0 OID 0)
-- Dependencies: 216
-- Name: prodotti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prodotti_id_seq', 96, true);


--
-- TOC entry 3377 (class 0 OID 0)
-- Dependencies: 214
-- Name: utenti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utenti_id_seq', 22, true);


--
-- TOC entry 3209 (class 2606 OID 16661)
-- Name: immagini immagini_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immagini
    ADD CONSTRAINT immagini_pkey PRIMARY KEY (idimm, idprod);


--
-- TOC entry 3207 (class 2606 OID 16463)
-- Name: ordini ordini_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordini
    ADD CONSTRAINT ordini_pkey PRIMARY KEY (id);


--
-- TOC entry 3205 (class 2606 OID 16443)
-- Name: prodotti prodotti_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prodotti
    ADD CONSTRAINT prodotti_pkey PRIMARY KEY (id);


--
-- TOC entry 3201 (class 2606 OID 16422)
-- Name: utenti utenti_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utenti
    ADD CONSTRAINT utenti_email_key UNIQUE (email);


--
-- TOC entry 3203 (class 2606 OID 16420)
-- Name: utenti utenti_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utenti
    ADD CONSTRAINT utenti_pkey PRIMARY KEY (id);


--
-- TOC entry 3211 (class 2606 OID 24844)
-- Name: ordini fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordini
    ADD CONSTRAINT fk FOREIGN KEY (venditore_id) REFERENCES public.utenti(id);


--
-- TOC entry 3214 (class 2606 OID 16662)
-- Name: immagini immagini_idprod_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immagini
    ADD CONSTRAINT immagini_idprod_fkey FOREIGN KEY (idprod) REFERENCES public.prodotti(id);


--
-- TOC entry 3212 (class 2606 OID 16464)
-- Name: ordini ordini_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordini
    ADD CONSTRAINT ordini_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.utenti(id) ON DELETE CASCADE;


--
-- TOC entry 3213 (class 2606 OID 16672)
-- Name: ordini ordini_idprodotto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordini
    ADD CONSTRAINT ordini_idprodotto_fkey FOREIGN KEY (id_prodotto) REFERENCES public.prodotti(id);


--
-- TOC entry 3210 (class 2606 OID 16444)
-- Name: prodotti prodotti_artigiano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prodotti
    ADD CONSTRAINT prodotti_artigiano_id_fkey FOREIGN KEY (artigiano_id) REFERENCES public.utenti(id) ON DELETE CASCADE;


-- Completed on 2025-06-24 10:17:09

--
-- PostgreSQL database dump complete
--

