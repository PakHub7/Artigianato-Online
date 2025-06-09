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
          id: user.id,
          username: user.username,
          email: user.email,
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

async function register(username, password, email) {
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
        "INSERT INTO utenti (username, password_hash, email) VALUES ($1, $2, $3)",
        [username, password_hash, email],
      );
      return { success: true };
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

module.exports = { login, register };
