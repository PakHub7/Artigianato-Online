const express = require("express");
// const { Pool } = require("pg");
const path = require("path");
const bcrypt = require("bcrypt");

const { getBalance } = require("./utils/payments");
const { login, register } = require("./utils/database");

const app = express();
const port = 3000;

// parametro utili per l'hashing della password (motivo per cui ho messo la libreria bcrypt)
// viene generata una stringa di dati di lunghezza fissa (l'hash)
// che è estremamente difficile da invertire per ottenere la password originale
const SALT_ROUNDS = 10;

app.use(express.json());

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
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await login(username, password);

  if (result.success) {
    return res.json({ success: true, user: result.user });
  }

  switch (result.reason) {
    case "not_found":
      return res
        .status(401)
        .json({ success: false, message: "Utente non trovato" });
    case "wrong_password":
      return res
        .status(401)
        .json({ success: false, message: "Password errata" });
    default:
      return res
        .status(500)
        .json({ success: false, message: "Errore interno del server" });
  }
});

app.post("/api/register", async (req, res) => {
  const { username, password, email } = req.body;
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
