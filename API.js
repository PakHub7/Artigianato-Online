const express = require("express");
const cors = require("cors");
// const { Pool } = require("pg");
const path = require("path");
const bcrypt = require("bcrypt");

const { getOrderStatus, createCheckount } = require("./utils/payments");
const {
  login,
  register,
  getUser,
  updateUser,
  getProducts,
  getProduct,
  getProductImages,
  addProductImage,
  deleteProductImage,
} = require("./utils/database");

const app = express();
const port = 3000;

app.use(express.json());

// Servi la pagina HTML
app.use(express.static(path.join(__dirname)));
app.use(cors({ origin: "*" }));

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
      return res.status(200).json({ success: true, data: result.user });
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
  const {
    username,
    password,
    email,
    telefono,
    ruolo,
    indirizzo = null,
  } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({
      success: false,
      message: "Username, password ed email sono obbligatori",
    });
  }

  try {
    const result = await register(
      username,
      password,
      email,
      telefono,
      ruolo,
      indirizzo,
    );

    if (result.success) {
      return res.status(201).json({ success: true, data: result.user });
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
      return res.status(200).json({ success: true, data: result.user });
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
      return res.status(200).json({ success: true, data: result.user });
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
    const result = await getProductImages(id, max);
    if (result.success) {
      return res.status(200).json({ success: 200, data: result.images });
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

app.post("/api/product/:id/image/add", async (req, res) => {
  // TODO: prendere più id per risparmiare nelle req API
  try {
    const id = req.params.id;
    const images = req.body.images;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Lista di immagini non fornita o vuota nel corpo della richiesta.",
      });
    }
    const result = await addProductImage(id, images);
    if (result.success) {
      return res.status(200).json({ success: true, data: result.images });
    } else {
      if (result.message === "no_images_provided") {
        return res.status(400).json({
          success: false,
          message: "Nessuna immagine valida fornita.",
        });
      } else if (result.message === "no_rows_inserted") {
        return res.status(500).json({
          success: false,
          message: "Errore interno del server: nessuna riga inserita.",
        });
      } else {
        return res
          .status(500)
          .json({ success: false, message: "Errore interno del server." });
      }
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

app.delete("/api/product/image/:id/delete", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await deleteProductImage(id);
    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Immagine non trovata" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

// SEZIONE PRODOTTI
app.get("/api/products", async (req, res) => {
  try {
    const filters = req.query || null;
    const products = await getProducts(filters);
    if (products.success) {
      return res.status(200).json({ success: true, data: products.products }); // products contiene l'array dei prodotti
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
      return res.status(200).json({ success: true, data: result.product });
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

app.get("/api/search", async (req, res) => {
  try {
    const searchTerm = req.query.q;

    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Il termine di ricerca è obbligatorio",
      });
    }

    const result = await searchProducts(searchTerm);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } else if (result.message === "no_products_found") {
      return res.status(404).json({
        success: false,
        message: "Nessun prodotto trovato",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Errore interno del server",
      });
    }
  } catch (error) {
    console.error("Errore durante la ricerca:", error);
    return res.status(500).json({
      success: false,
      message: "Errore interno del server",
    });
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
app.delete("/api/product/delete", async (req, res) => {
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
      return res.status(200).json({ success: true, data: result.product });
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
      return res.status(200).json({ success: true, data: result.product });
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

// SEZIONE PAGAMENTI
// Endpoint per creare una sessione di checkout
// vero
app.post("/api/checkout", async (req, res) => {
  const { carrello, cliente_id } = req.body;
  try {
    const result = await createCheckount(carrello, cliente_id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Errore nel checkout" });
  }
});

// Endpoint per verificare lo stato di una sessione (feedback senza webhook)
app.get("/api/checkout/status/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await getOrderStatus(sessionId);
    if (result.success) {
      return res.status(200).json({ success: true, data: result });
    } else {
      return res.code(404).json({
        success: false,
        message: "La sessione di checkount non è stata trovata",
      });
    }
  } catch (error) {
    console.error("Errore nel recupero dello stato:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Errore nel recupero dello stato della sessione",
    });
  }
});

// Pagina di successo
app.get("/success", (req, res) => {
  const sessionId = req.query.session_id;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Pagamento Completato</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .success { color: #28a745; }
            .info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        </style>
    </head>
    <body>
        <h1 class="success">✅ Pagamento Completato con Successo!</h1>
        <div class="info">
            <p><strong>Session ID:</strong> ${sessionId}</p>
            <p>Il tuo pagamento è stato elaborato correttamente.</p>
        </div>
        <button onclick="checkStatus()">Verifica Stato Pagamento</button>
        <div id="status-result"></div>

        <script>
            async function checkStatus() {
                try {
                    const response = await fetch('/api/checkout/status/${sessionId}');
                    const data = await response.json();
                    document.getElementById('status-result').innerHTML =
                        '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                } catch (error) {
                    document.getElementById('status-result').innerHTML =
                        '<p style="color: red;">Errore: ' + error.message + '</p>';
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Pagina di cancellazione
app.get("/cancel", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Pagamento Annullato</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .cancel { color: #dc3545; }
        </style>
    </head>
    <body>
        <h1 class="cancel">❌ Pagamento Annullato</h1>
        <p>Il pagamento è stato annullato. Puoi riprovare quando vuoi.</p>
        <a href="/">← Torna alla home</a>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});
