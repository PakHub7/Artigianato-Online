const { Pool } = require("pg");
const bcrypt = require("bcrypt");

// Configura la connessione al tuo server PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mia_app_db",
  password: "PizzaPANiN0",
  port: 5432,
});

// SEZIONE UTENTI
async function userExists(username) {
  const result = await pool.query("SELECT * FROM utenti WHERE username = $1", [
    username,
  ]);

  if (result.rows.length === 0) {
    return false;
  }

  const user = result.rows[0];
  return user;
}

async function login(username, password) {
  try {
    const user = await userExists(username);

    if (user) {
      const match = await bcrypt.compare(password, user.password_hash);

      if (match) {
        return { success: false, message: "wrong_password" };
      }

      return {
        success: true,
        user: {
          // id: user.id, // Non dovrebbe servire nei risultati login/signup ma solo come indicizzazione
          username: user.username,
          email: user.email,
          indirizzo: user.indirizzo, // è meglio restituirlo solo quando serve, rimuovere in seguito + aggiungerlo come dato per i pagamenti
          role: user.ruolo,
        },
      };
    } else {
      return { success: false, message: "not_found" };
    }
  } catch (err) {
    console.error("Errore nel login: ", err);
    return { success: false, message: "server_error", error: err };
  }
}

async function register(username, password, email, indirizzo, ruolo) {
  try {
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username e password sono obbligatori",
      });
    }

    const user = await userExists(username);

    if (!user) {
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
      const result = await pool.query(
        "INSERT INTO utenti (username, password_hash, email, indirizzo, ruolo) VALUES ($1, $2, $3, $4, $5)",
        [username, password_hash, email, indirizzo, ruolo],
      );
      return {
        success: true,
        user: {
          // id: user.id, // Non dovrebbe servire nei risultati login/signup ma solo come indicizzazione
          username: username,
          email: email,
          indirizzo: indirizzo, // è meglio restituirlo solo quando serve, rimuovere in seguito + aggiungerlo come dato per i pagamenti
          role: ruolo, // TODO: aggiungere il ruolo
        },
      };
    } else {
      return { success: false, message: "user_already_exists" };
    }
  } catch (err) {
    console.error("Errore: ", err);
    return { success: false, message: "server_error", error: err };
  }

  /* da spostare e sistemare in API.js
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
    } */
}

// SEZIONE PRODOTTI
async function getProductImage() {
  // get 1 or all
}

// // comando = {}
// ottenere 1 sola immagine per la vetrina
async function getProducts(req) {
  // Funzione che recupera TUTTI i prodotti o quelli richiesti tramite uno o più filtri
  const comando = req ? req.query : {}; // Se req è undefined, usa un oggetto vuoto

  let query = "SELECT id, nome, prezzo FROM prodotti";
  const valori = [];
  const conditions = [];
  let i = 1;

  // Controlla se ci sono parametri nel 'comando'
  if (Object.keys(comando).length > 0) {
    if ("categoria" in comando) {
      conditions.push(`categoria = $${i}`);
      valori.push(comando["categoria"]);
      i++;
    }

    if ("prezzo_min" in comando) {
      conditions.push(`prezzo >= $${i}`);
      valori.push(parseFloat(comando["prezzo_min"]));
      i++;
    }

    if ("prezzo_max" in comando) {
      conditions.push(`prezzo <= $${i}`);
      valori.push(parseFloat(comando["prezzo_max"]));
      i++;
    }

    if ("disponibilita" in comando) {
      conditions.push(`disponibilita >= $${i}`); // Mostra solo prodotti con almeno X unità disponibili
      valori.push(parseInt(comando["disponibilita"]));
      i++;
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    if ("limit" in comando && typeof comando.limit === "string") {
      const limite = parseInt(comando.limit);
      query += ` LIMIT $${i}`;
      // Assicurarsi che sia un numero valido
      if (!isNaN(limite)) {
        query += ` LIMIT $${i}`;
        valori.push(limite);
        i++;
      }
    }
  }

  try {
    const result = await pool.query(
      query,
      valori.length > 0 ? valori : undefined,
    );
    return result.rows;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error; // sostituire con un return { success: false, message: "" };
  }
}

async function getProduct(id) {
  // manca la funzione per prendere tutte le immagini del prodotto, capire come vogliono gestirle + salvarle (path, url o blob)
  const result = await pool.query("SELECT * FROM prodotti WHERE id = $1", [id]);
  const product = result.rows[0];
  if (!product) {
    return { success: false, message: "product_not_found" };
  }
  return product;
}

// SEZIONE ORDINI / CARRELLO
/*
1. controllo disponibilità ordini
2. se disponibili, eliminazione dal database della quantità richiesta dei prodotti e aggiunta in tabella ordini degli ordini effettuati
3. se non disponibili si notifica l'utente mostrando i prodotti che non sono più disponibili
*/
async function notifyUser() {
  // se alcuni prodotti nel carrello non sono più disponibili
}

async function checkAvailablity(ids) {
  const result = await pool.query(
    "SELECT disponibilita FROM prodotti WHERE id = ANY($1)",
    [ids],
  );
  return result.rows;
}

async function lockProducts() {}

// SEZIONE PAGAMENTI

module.exports = { login, register, getProductImage, getProduct, getProducts };
