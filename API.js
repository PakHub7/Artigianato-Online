const express = require("express");
// const { Pool } = require("pg");
const path = require("path");
const bcrypt = require("bcrypt");

const { getBalance } = require("./utils/payments");
const {
  login,
  register,
  getUser,
  updateUser,
  getProducts,
  getProduct,
  getProductImage,
  addProductImage,
  deleteProductImage,
  updateUser,
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
  if (!username || !password || !email) {
    return res.status(400).json({
      success: false,
      message: "Username, password ed email sono obbligatori",
    });
  }

  try {
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
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

app.post("/api/register", async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({
      success: false,
      message: "Username, password ed email sono obbligatori",
    });
  }

  try {
    const result = await register(username, password, email);

    if (result.success) {
      return res.status(201).json({ success: true, user: result.user });
    } else if (result.message === "user_already_exists") {
      return res.status(409).json({
        success: false,
        message: "Un utente con questo username è già esistente",
      });
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Errore interno del server" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

app.get("/api/user/:username", async (req, res) => {
  try {
    const regex = /[!@#$%^&*()\-+={}[\]:;"'<>,.?\/|\\]/;
    const username = req.query.username;

    if (regex.test(username)) {
      return res
        .status(400)
        .json({ success: false, message: "Sono presenti caratteri speciali" });
    }

    result = await getUser(username);

    if (result.success) {
      return res.status(200).json({ success: true, user: result.user });
    } else if (result.message === "not_found") {
      return res
        .status(401)
        .json({ success: false, message: "Utente non trovato" });
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Errore interno del server" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

app.post("/api/user/update", async (req, res) => {
  try {
    const { id, username, password, telefono, indirizzo } = req.body;
    const result = await updateUser(
      id,
      username,
      password,
      telefono,
      indirizzo,
    );

    if (result.success) {
      return res.status(200).json({ success: true, user: result.user });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Utente non trovato" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

// SEZIONE IMMAGINI
app.get("/api/product/:id/image", async (req, res) => {
  // es. /api/product/123/image?max=10
  try {
    const id = req.params.id;
    const max = parseInt(req.query.max) || 0;
    const result = await getProductImage(id, max);
    if (result.success) {
      return res.status(200).json({ success: 200, images: result.images });
    }
    return res
      .status(404)
      .json({ success: false, message: "Prodotto non trovato" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

app.get("/api/product/image/add");

app.get("/api/product/image/:id/delete");

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
    const filters = req.query;
    const products = await getProducts(filters);
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

app.get("/api/products/:id", async (req, res) => {
  try {
    const id = req.params.id; // Estrazione ID prodotto dai parametri della query
    // req.params.id con path/:id (esempio: path/123) è utile in questo caso perché serve solo il parametro id, ovvero un parametro specifico
    // req.query invece è utile nel caso dei filtri (path?filtro1=A&filtro2=B) poiché sono facoltativi ed è così più facile gestirli

    if (isNaN(id) || parseInt(id) <= 0) {
      return req
        .status(400)
        .json({ success: false, message: "ID prodotto non valido" });
    }

    const result = await getProduct(id);

    if (result.success) {
      return res.status(200).json({ success: true, product: result.product });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Prodotto non trovato" });
    }
  } catch (error) {
    console.error("Errore durante il recupero del prodotto: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

app.post("/api/product/add", async (req, res) => {
  const { nome, categoria, descrizione, prezzo, disponibilita, idVenditore } =
    req.body;

  const result = await addProduct(
    nome,
    categoria,
    descrizione,
    prezzo,
    disponibilita,
    idVenditore,
  );

  if (result.success) {
    return res.status(200).json(result);
  } else if (result.message === "product_already_exists") {
    return res.status(409).json(result);
  } else {
    return res.status(500).json(result);
  }
});

//Api inerente a deleteProduct
app.post("/api/product/delete", async (req, res) => {
  const { id } = req.body;

  try {
    const result = await deleteProduct(id);

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Prodotto non trovato" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

//api inerente a updateProduct
app.post("/api/product/update", async (req, res) => {
  const { id, descrizione, prezzo, disponibilita } = req.body;

  try {
    const result = await updateProduct(id, params);

    if (result.success) {
      return res.status(200).json({ success: true, product: result.product });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Prodotto non trovato" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

//SEZIONE ORDINI

app.get("api/orders", async (req, res) => {
  try {
    const { id, ruolo } = req.query;
    //aggiungere controllo variabili

    const result = await showOrder(id, ruolo);

    if (result.success) {
      return res.status(200).json({ success: true, product: result.product });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Ordini non trovati" });
    }
  } catch (error) {
    console.error("Errore durante il recupero degli ordini: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

/*-----------------------------------------------------------------------------------------------------------------*/
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
