const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const { getBalance } = require("./utils/payments");

const app = express();
const port = 3000;

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
