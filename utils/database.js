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
async function getUser(username) {
  // TODO: se serve aggiungere la possibilità di cercare un utente tramite ID, se non serve non si fa
  try {
    const result = await pool.query(
      "SELECT * FROM utenti WHERE username = $1",
      [username],
    );

    if (result.rows.length === 0) {
      return { success: false, message: "not_found" };
    }

    const user = result.rows[0];
    return { success: true, user: user };
  } catch (error) {
    console.error("Errore nella query: ", error);
    return { success: false, message: "server_error" };
  }
}

async function updateUser(id, username, password, telefono, indirizzo) {
  try {
    const result = await pool.query(
      "UPDATE utenti SET username=$1, password=$2, telefono=$3, indirizzo=$4 WHERE id=$5",
      [username, password, telefono, indirizzo, id],
    );

    if (result.rowCount > 0) {
      user = await getUser(username);
      return { success: true, user: user };
    } else {
      return { success: false, message: "not_found" };
    }
  } catch (error) {
    return { success: false, message: "server_error" };
  }
}

async function deleteUser(username) {
  try {
    const result = await pool.query("DELETE FROM utenti WHERE username=$1", [
      username,
    ]);

    if (result.rowCount > 0) {
      return { success: true };
    } else {
      return { success: false, message: "not_found" };
    }
  } catch (error) {
    return { success: false, message: "server_error" };
  }
}

async function login(username, password) {
  try {
    const user = await getUser(username);

    if (user.success) {
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
          telefono: user.telefono,
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

async function register(username, password, email, telefono, indirizzo, ruolo) {
  try {
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username e password sono obbligatori",
      });
    }

    const user = await getUser(username);

    if (!user.success) {
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
          telefono: telefono,
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
}

// SEZIONE IMMAGINI
async function getProductImage(id, max = 0) {
  // get N (max=N) or all (max=0)
  // TODO: sostituire url sia qui sia nella tabella immagini con img o simili
  let query = `
    SELECT img
    FROM immagini
    WHERE idProd = $1
  `;

  const params = [id];

  if (max > 0) {
    query += " LIMIT $2";
    params.push(max);
  } else if (max < 0) {
    return { success: false, message: "invalid_max_value" };
  }

  try {
    const result = await pool.query(query, params);
    if (result.rows.length) {
      return { success: true, images: result.rows }; // TODO: chiedere se vogliono tutta la riga o solo la colonna con il nome dell'img
    } else {
      return { success: false, message: "no_rows" };
    }
  } catch (error) {
    return { success: false, message: "server_error" };
  }
}

async function addProductImage(id, images) {
  // TODO: prendere più id per risparmiare nelle req API
  try {
    if (!Array.isArray(images) || images.length === 0) {
      return { success: false, message: "no_images_provided" };
    }

    let values = [];
    let params = [];
    let i = 1;

    images.forEach((image) => {
      values.push(`($${i}, $${i + 1})`);
      params.push(id, image);
    });

    const query =
      "INSERT INTO immagini (idProd, img) VALUES " +
      values.join(", ") +
      " RETURNING *";
    const result = await pool.query(query, params);
    if (result.rowCount > 0) {
      return { success: true, images: result.rows };
    } else {
      return { success: false, message: "no_rows_inserted" };
    }
  } catch (error) {
    return { success: false, message: "server_error" };
  }
}

async function deleteProductImage(id) {
  try {
    const result = await pool.query("DELETE FROM immagini WHERE id=$1", [id]);
    if (result.rowCount > 0) {
      return { success: true };
    } else {
      return { success: false, message: "not_found" };
    }
  } catch (error) {
    return { success: false, message: "server_error" };
  }
}

// SEZIONE PRODOTTI
// ottenere 1 sola immagine per la vetrina
async function getProducts(filters = {}) {
  // Funzione che recupera TUTTI i prodotti o quelli richiesti tramite uno o più filtri
  let query = "SELECT id, nome, prezzo FROM prodotti";
  let values = [];
  let conditions = [];
  let i = 1;

  // Controlla se ci sono parametri in 'filters'
  if (Object.keys(filters).length > 0) {
    if ("categoria" in filters) {
      const categorie = Array.isArray(filters["categoria"])
        ? filters["categoria"]
        : [filters["categoria"]];
      conditions.push(`categoria = ANY($${i})`);
      values.push(categorie);
      i++;
    }

    if ("prezzo_min" in filters) {
      conditions.push(`prezzo >= $${i}`);
      values.push(parseFloat(filters["prezzo_min"]));
      i++;
    }

    if ("prezzo_max" in filters) {
      conditions.push(`prezzo <= $${i}`);
      values.push(parseFloat(filters["prezzo_max"]));
      i++;
    }

    if ("disponibilita" in filters) {
      conditions.push(`disponibilita >= $${i}`); // Mostra solo prodotti con almeno X unità disponibili
      values.push(parseInt(filters["disponibilita"]));
      i++;
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    if ("limit" in filters && typeof filters.limit === "string") {
      const limite = parseInt(filters.limit);
      query += ` LIMIT $${i}`;
      // Assicurarsi che sia un numero valido
      if (!isNaN(limite)) {
        query += ` LIMIT $${i}`;
        values.push(limite);
        i++;
      }
    }
  }

  try {
    const result = await pool.query(
      query,
      values.length > 0 ? values : undefined,
    );
    return result.rows;
  } catch (error) {
    console.error("Error executing query: ", error);
    // throw error; // sostituire con un return { success: false, message: "" }; - fatto
    return { success: false, message: "server_error" };
  }
}

async function getProduct(id) {
  // manca la funzione per prendere tutte le immagini del prodotto, capire come vogliono gestirle + salvarle (path, url o blob)
  try {
    const result = await pool.query("SELECT * FROM prodotti WHERE id = $1", [
      id,
    ]);
    const product = result.rows[0];
    if (!product) {
      return { success: false, message: "product_not_found" };
    }
    return { success: true, product: product };
  } catch (error) {
    console.error("Error executing query: ", error);
    return { success: false, message: "server_error" };
  }
}

async function addProduct(
  nome,
  categoria,
  descrizione,
  prezzo,
  disponibilita,
  idVenditore,
) {
  const existing = await pool.query(
    "SELECT * FROM prodotti WHERE nome = $1 AND idVenditore = $2",
    [nome, idVenditore],
  );

  if (existing.rows.length > 0) {
    return { success: false, message: "product_already_exists" };
  }

  try {
    const result = await pool.query(
      "INSERT INTO prodotti (nome, categoria, descrizione, prezzo, disponibilita, idVenditore) VALUES ($1, $2, $3, $4, $5, $6)"[
        (nome, categoria, descrizione, prezzo, disponibilita, idVenditore)
      ],
    );

    return { success: true, product: result.rows[0] };
  } catch (error) {
    console.error("Errore nell'aggiunta del prodotto:", error);
    return { success: false, message: "server_error" };
  }
}

async function deleteProduct(id) {
  //
  try {
    const result = await pool.query("DELETE FROM prodotti WHERE id=$1", [id]);

    if (result.rowCount > 0) {
      return { success: true };
    } else {
      return { success: false, message: "not_found" };
    }
  } catch (error) {
    return { success: false, message: "server_error" };
  }
}

async function updateProduct(id, params = {}) {
  let query = "UPDATE prodotti SET";
  let values = [];
  let conditions = [];
  let i = 1;

  if (Object.keys(params).length > 0) {
    if ("descrizione" in params) {
      conditions.push(`descrizione= $${i}`);
      values.push(params["descrizione"]);
      i++;
    }

    if ("prezzo" in params) {
      conditions.push(`prezzo= $${i}`);
      values.push(parseFloat(params["prezzo"]));
      i++;
    }

    if ("disponibilita" in params) {
      conditions.push(`disponibilita= $${i}`);
      values.push(parseInt(params["disponibilita"]));
      i++;
    }

    if (conditions.length > 0) {
      query += conditions.join(", ");
    }
  } else {
    return { success: false, message: "params_empty" };
  }

  try {
    const result = await pool.query(
      query,
      valori.length > 0 ? valori : undefined,
    );
    if (result.rowCount > 0) {
      return { success: true };
    } else {
      return { success: false, message: "not_found" };
    }
  } catch (error) {
    console.error("Error executing query: ", error);
    // throw error; // sostituire con un return { success: false, message: "" }; - fatto
    return { success: false, message: "server_error" };
  }
}

//SEZIONE VISUALIZZAZIONE ORDINI

async function showOrder(id, ruolo) {
  let query;
  switch (ruolo) {
    case "cliente":
      query = "SELECT * FROM ordini WHERE cliente_id= $1";
      break;
    case "venditore":
      query = "SELECT * FROM ordini WHERE venditore_id= $1";
      break;
    //case "admin":
  }
  try {
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return { success: false, message: "not_found" };
    }

    return { success: true, order: result.rows };
  } catch (error) {
    console.error("Errore nella query: ", error);
    return { success: false, message: "server_error" };
  }
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

module.exports = {
  login,
  register,
  getUser,
  updateUser,
  getProductImage,
  addProductImage,
  deleteProductImage,
  getProduct,
  getProducts,
};
