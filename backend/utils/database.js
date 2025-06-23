const { Pool } = require("pg");
const bcrypt = require("bcrypt");

// parametro utile per l'hashing della password (motivo per cui ho messo la libreria bcrypt)
// viene generata una stringa di dati di lunghezza fissa (l'hash)
// che è estremamente difficile da invertire per ottenere la password originale
const SALT_ROUNDS = 10;

// Configura la connessione al tuo server PostgreSQL
const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
});


pool.query('SELECT 1')
    .then(() => console.log('Connesso al database'))
    .catch(err => {
      console.error('Errore DB:', err);
      process.exit(1);
    });


// SEZIONE DB UTILS
async function getClient() {
  // questo client è essenziale perché tutte le operazioni all'interno di una transazione devono utilizzare lo stesso client.
  // utile, ma opzionale, anche per le altre funzioni
  try {
    return await pool.connect();
  } catch (error) {
    console.error("Error getting client from pool:", error);
    return null;
  }
}

// SEZIONE UTENTI
async function getUser(username, login=false) {
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
    const { password_hash, ...safeUser } = user; // evita di restituire la password
    if (login) {
      return { success: true, user: user };
    } else {
      return { success: true, user: safeUser };
    }
  } catch (error) {
    console.error("Errore nella query: ", error);
    return { success: false, message: "server_error" };
  }
}

async function updateUser(id, username,telefono, indirizzo) {
  try {
    //const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      "UPDATE utenti SET username=$1, telefono=$2, indirizzo=$3 WHERE id=$4",
      [username, telefono, indirizzo, id],
    );

    if (result.rowCount > 0) {
      const user = await getUser(username);
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
    const user = await getUser(username,true);

    if (user.success) {
      const match = await bcrypt.compare(password, user.user.password_hash);

      if (!match) {
        return { success: false, message: "wrong_password" };
      }

      return {
        success: true,
        user: {
          id: user.user.id, // Non dovrebbe servire nei risultati login/signup ma solo come indicizzazione
          username: user.user.username,
          email: user.user.email,
          telefono: user.user.telefono,
          indirizzo: user.user.indirizzo, // è meglio restituirlo solo quando serve, rimuovere in seguito + aggiungerlo come dato per i pagamenti
          role: user.user.ruolo,
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

async function register(username, password, email, telefono, ruolo, indirizzo) {
  try {
    if (!username || !password) {
      return {
        success: false,
        message: "Username e password sono obbligatori",
      };
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
async function getProductImages(id, max = 0) {
  // get N (max=N) or all (max=0)
  // TODO: sostituire url sia qui sia nella tabella immagini con img o simili
  let query = `
    SELECT idimm, img
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
      return { success: true, images: result.rows.map(r => ({ id: r.id, image: r.img })) };
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
async function searchProducts(searchTerm) {
  try {
    const result = await pool.query(
      `SELECT * FROM prodotti
       WHERE nome ILIKE $1 OR descrizione ILIKE $1`,
      [`%${searchTerm}%`]
    );

    if (result.rows.length === 0) {
      return { success: false, message: "no_products_found" };
    }

    // Aggiunta delle immagini per ogni prodotto trovato
    const productsWithImages = await Promise.all(
      result.rows.map(async (product) => {
        const immagini = await getProductImages(product.id);
        return {
          prodotto: product,
          immagini: immagini.success ? immagini.images : []
        };
      })
    );

    return { success: true, data: productsWithImages };
  } catch (error) {
    console.error("Error in searchProducts:", error);
    return { success: false, message: "server_error" };
  }
}

async function getProducts(filters = {}) {
  // Funzione che recupera TUTTI i prodotti o quelli richiesti tramite uno o più filtri
  let query = "SELECT * FROM prodotti";
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
      // query += ` LIMIT $${i}`;
      // Assicurarsi che sia un numero valido
      if (!isNaN(limite)) {
        query += ` LIMIT $${i}`;
        values.push(limite);
        i++;
      }
    }
  }

  try {
    const products = await pool.query(
      query,
      values.length > 0 ? values : undefined,
    );

    const result = await Promise.all(
      products.rows.map(async (product) => {
        //console.log("id",product.id)
        const immagini = await getProductImages(product.id); // deve ritornare array
        //console.log(".",immagini);
        return {
          prodotto: product,
          immagini: immagini.images,
        };
      })
    );
    return { success: true, products: result };
  } catch (error) {
    console.error("Error executing query: ", error);
    // throw error; // sostituire con un return { success: false, message: "" }; - fatto
    return { success: false, message: "server_error" };
  }
}

async function getProduct(id, client = pool) {
  // manca la funzione per prendere tutte le immagini del prodotto, capire come vogliono gestirle + salvarle (path, url o blob)
  try {
    const result = await client.query("SELECT * FROM prodotti WHERE id = $1", [
      id,
    ]);
    const product = result.rows[0];
    if (!product) {
      return { success: false, message: "product_not_found" };
    }
    const images = await getProductImages(id);
    product.immagini = images;
    return { success: true, product: product };
  } catch (error) {
    console.error("Error executing query: ", error);
    return { success: false, message: "server_error" };
  }
}

async function getSellerProducts(id, client = pool) {
  try {
    const products = await client.query("SELECT * FROM prodotti WHERE artigiano_id = $1", [
      id,
    ]);

    if (!products) {
      return { success: false, message: "products_not_found" };
    }

    const result = await Promise.all(
        products.rows.map(async (product) => {
          const immagini = await getProductImages(product.id); // deve ritornare array
          return {
            prodotto: product,
            immagini: immagini.images,
          };
        })
    );
    return { success: true, products: result };
  } catch (error) {
    console.error("Error executing query: ", error);
    return { success: false, message: "server_error" };
  }

}

async function addProduct(  nome,  categoria,  descrizione,  prezzo,  disponibilita,  idVenditore,) {
  const existing = await pool.query(
    "SELECT * FROM prodotti WHERE nome = $1 AND artigiano_id = $2",
    [nome, idVenditore],
  );

  if (existing.rows.length > 0) {
    return { success: false, message: "product_already_exists" };
  }

  try {
    const result = await pool.query(
      "INSERT INTO prodotti (nome, categoria, descrizione, prezzo, disponibilita, artigiano_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [nome, categoria, descrizione, prezzo, disponibilita, idVenditore]
    );

    //console.log("resAdd",result.rows[0]);
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
      return { success: true ,message:"Prodotto cancellato con successo"};
    } else {
      return { success: false, message: "Prodotto non trovato" };
    }
  } catch (error) {
    return { success: false, message: "Errore del server" };
  }
}

async function updateProduct(id, nome, descrizione, prezzo, disponibilita,categoria, client = pool) {
  try {
    const result = await client.query("UPDATE prodotti SET nome=$1, descrizione=$2, prezzo=$3,disponibilita=$4, categoria=$5 WHERE id=$6",[nome, descrizione, prezzo, disponibilita,categoria,id]);
    if (result.rowCount > 0) {
      return { success: true , message:"oggetto aggiornato correttamente"};
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
async function addOrder(cliente_id, venditore_id, id_prodotto, quantita, id_pagamento=null, client = pool) {
  try {
    const result = await client.query( // Use client instead of pool
      "INSERT INTO ordini (cliente_id, venditore_id, id_prodotto, quantita, id_pagamento) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [cliente_id, venditore_id, id_prodotto, quantita, id_pagamento]
    );
    return { success: true, order: result.rows[0] };
  } catch (error) {
    console.error("Error adding order:", error);
    return { success: false, message: "server_error" };
  }
}

async function updateOrder(id,stato,id_pagamento,client=pool) {
  try{
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (stato !== undefined) {
      fields.push(`stato = $${paramIndex++}`);
      values.push(stato);
    }

    if (id_pagamento !== undefined) {
      fields.push(`id_pagamento = $${paramIndex++}`);
      values.push(id_pagamento);
    }

    // Se non ci sono campi da aggiornare, ritorna errore
    if (fields.length === 0) {
      return { success: false, message: "no_fields_to_update" };
    }

    // Aggiungi id per la clausola WHERE
    values.push(id);
    const query = `UPDATE ordini SET ${fields.join(", ")} WHERE id = $${paramIndex}`;

    await client.query(query, values);
    return { success: true };
  }catch (error){
    return {success:false, message:"server_error"}
  }

}

// SEZIONE TRANSAZIONI
async function beginTransaction(client) {
  try {
    const result = await client.query("BEGIN");
    return { success: true };
  } catch (error) {
    return { success: false, message: "server_error" };
  }
}

async function commitTransaction(client) {
  try {
    await client.query("COMMIT");
  } catch (error) {
    return { success: false, message: "server_error" };
  }
}

async function rollbackTransaction(client) {
  try {
    await client.query("ROLLBACK");
  } catch (error) {
    return { success: true, message: "server_error" };
  }
}

// DA DEFINIRE

async function notifyUser() {
  // se alcuni prodotti nel carrello non sono più disponibili
}

async function checkAvailablity(ids) {
  try {
    const result = await pool.query(
      "SELECT disponibilita FROM prodotti WHERE id = ANY($1)",
      [ids],
    );
    return { success: true, data: result.rows };
  } catch (error) {
    return {success: false, message: "server_error"}
  }
}

module.exports = {
  login,
  register,
  getUser,
  updateUser,
  getProductImages,
  addProductImage,
  deleteProductImage,
  getProduct,
  getProducts,
  updateProduct,
  deleteUser,
  deleteProduct,
  addProduct,
  showOrder,
  addOrder,
  getClient,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  getSellerProducts,
  searchProducts,
  checkAvailablity,
  updateOrder,
};
