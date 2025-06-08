const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const bcrypt = require("bcrypt");

const { getBalance } = require("./utils/payments");

const app = express();
const port = 3000;

// parametro utili per l'hashing della password (motivo per cui ho messo la libreria bcrypt)
// viene generata una stringa di dati di lunghezza fissa (l'hash)
// che è estremamente difficile da invertire per ottenere la password originale
const SALT_ROUNDS = 10;

app.use(express.json());

// Configura la connessione al tuo server PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mia_app_db",
  password: "PizzaPANiN0",
  port: 5432,
});

// Servi la pagina HTML
app.use(express.static(path.join(__dirname)));

// Endpoint per ottenere i dati
app.get("/api/dati", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM utenti" + "");
    res.json(result.rows);
  } catch (err) {
    console.error("Errore nella query", err);
    res.status(500).json({ errore: "Errore durante la query" });
  }
});

// TODO: spostare il core delle funzioni nel modulo database.js in ./utils
app.get("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM utenti WHERE username = $1",
      [username],
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Utente non trovato" });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);

    if (match) {
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      res.status(401).json({ success: false, message: "Password errata" });
    }
  } catch (err) {
    console.error("Errore nel login: ", err);
    res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

app.post("/api/register", async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username e password sono obbligatori",
    });
  }

  try {
    // Verifica che l'utente non esista già
    const existing = await pool.query(
      "SELECT * FROM utenti WHERE username = $1",
      [username],
    );
    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "Username già in uso" });
    }

    // Crea hash della password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Inserisce il nuovo utente
    await pool.query(
      "INSERT INTO utenti (username, password_hash, email) VALUES ($1, $2, $3)",
      [username, password_hash, email || null],
    );

    res.json({ success: true, message: "Registrazione avvenuta con successo" });
  } catch (err) {
    console.error("Errore nella registrazione:", err);
    res.status(500).json({ success: false, message: "Errore del server" });
  }
});

app.get("/api/test/stripe/balance", async (req, res) => {
  getBalance()
    .then((balance) => {
      // console.log("Saldo: ", balance);
      const available = balance.available.find((b) => b.currency === "eur");
      console.log("Available: €", (available.amount / 100).toFixed(2));
    })
    .catch((err) => {
      console.log("Errore nel recupero del saldo: ", err);
    });

  /*
  Saldo:  {
    object: 'balance',
    available: [ { amount: 0, currency: 'eur', source_types: [Object] } ],
    connect_reserved: [ { amount: 0, currency: 'eur' } ],
    livemode: false,
    pending: [ { amount: 0, currency: 'eur', source_types: [Object] } ],
    refund_and_dispute_prefunding: { available: [ [Object] ], pending: [ [Object] ] }
  }
  */
});

app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});
