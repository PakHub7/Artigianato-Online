const express = require("express");
// const { Pool } = require("pg");
const path = require("path");
const bcrypt = require("bcrypt");

const { getBalance } = require("./utils/payments");
const {
  login,
  register,
  getProducts,
  getProduct,
  getProductImage,
} = require("./utils/database");

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

// SEZIONE UTENTI
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await login(username, password);

  if (result.success) {
    return res.status(200).json({ success: true, user: result.user });
  }

  switch (result.message) {
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
  const result = await register(username, password, email);

  if (result.success) {
    return res.status(200).json({ success: true, user: result.user });
  } else if (result.message === "user_already_exists") {
    return res.status(401).json({
      success: false,
      message: "Un utente con questo username è già esistente",
    });
  } else {
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

// SEZIONE PRODOTTI
app.get("/api/products", async (req, res) => {
  /* Esempio richiesta API
    GET /api/products?categoria=abbigliamento&prezzo_min=50&disponibilita=100&limit=10
    req.query sarà { categoria: 'abbigliamento', prezzo_min: '50', disponibilita: '100', limit: '10' }

    risultato completo con successo:
    {
      "success": true,
      "products": [
        { "id": 1, "nome": "Prodotto A", "prezzo": 10.00 },
        { "id": 2, "nome": "Prodotto B", "prezzo": 25.50 }
      ]
    }

    risultato fallimentare:
    {
      "success": false,
      "message": "product_not_found"
    }

    errore server interno:
    {
      "success": false,
      "message": "Errore interno del server"
    }
  */
  try {
    const products = await getProducts(req);
    if (products.success) {
      return res.status(200).json({ success: true, products: products }); // products contiene l'array dei prodotti
    } else {
      return res
        .status(404)
        .json({ success: false, message: products.message }); // TODO: decidere se tenere result.message oppure scrivere un messaggio in tutte le req
    }
  } catch (error) {
    console.error("Errore durante il recupero dei prodotti:", error);
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

// SEZIONE DI TEST (DA RIMUOVERE IN SEGUITO)
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
