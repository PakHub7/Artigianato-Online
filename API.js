const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

// Configura la connessione al tuo server PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mia_app_db',
    password: 'PizzaPANiN0',
    port: 5432,
});

// Servi la pagina HTML
app.use(express.static(path.join(__dirname)));

// Endpoint per ottenere i dati
app.get('/api/dati', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM utenti' +
            '');
        res.json(result.rows);
    } catch (err) {
        console.error('Errore nella query', err);
        res.status(500).json({ errore: 'Errore durante la query' });
    }
});

app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
});
