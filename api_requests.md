### *Qui troverete tutte le richieste API con i vari risultati, QUESTO FILE LO ELIMINEREMO NON APPENA AVREMO FATTO LA DOCUMENTAZIONE*

# **UTENTE**
## POST /api/register
  ### *Body della richiesta:*
  ``` JSON
  {
    "username": "string (obbligatorio)",
    "password": "string (obbligatorio)",
    "email": "string (obbligatorio)",
    "indirizzo": "string (opzionale)",
    "ruolo": "string (opzionale, default: 'user')"
  }
  ```

  ### *Status code 201:*
  ``` JSON
  {
      "success": true,
      "user": {
          "username": "nuovo_utente",
          "email": "nuovo.utente@example.com",
          "indirizzo": "Via Indirizzo 123",
          "role": "customer"
      },
      "message": "Registrazione avvenuta con successo"
  }
  ```

  ### *Status code 409:*
  ``` JSON
  {
      "success": false,
      "message": "Un utente con questo username è già esistente"
  }
  ```

  ### *Status code 400:*
  ``` JSON
  {
      "success": false,
      "message": "Username, password ed email sono obbligatori"
  }
  ```

  ### *Status code 500:*
  ``` JSON
  {
      "success": false,
      "message": "Errore interno del server"
  }
  ```

## POST /api/login
  ### *Body della richiesta:*
  ``` JSON
  {
      "username": "string (obbligatorio)",
      "password": "string (obbligatorio)"
  }
  ```

  ### *Status code 200:*
  ``` JSON
  {
      "success": true,
      "user": {
          "username": "utente_esistente",
          "email": "utente@example.com",
          "indirizzo": "Via Milano 45",
          "role": "admin"
      }
  }
  ```

  ### *Status code 401:*
  ``` JSON
  {
      "success": false,
      "message": "Utente non trovato"
  }
  ```

  ### *Status code 400:*
  ``` JSON
  {
      "success": false,
      "message": "Username e password sono obbligatori"
  }
  ```

  ### *Status code 500:*
  ``` JSON
  {
      "success": false,
      "message": "Errore interno del server"
  }
  ```

# **PRODOTTO**
## GET /api/products
  ### Esempio:
  ```
  /api/products?categoria=abbigliamento&categoria=gioielli&prezzo_min=50&disponibilita=100&limit=10
  ```

  ### *Parametri url:*
  ``` JSON
  {
      "categoria": "array (opzionale, es. ['arredamento', 'gioielli'])",
      "prezzo_min": "number (opzionale, es. 50, 100.50)",
      "prezzo_max": "number (opzionale, es. 200, 75.99)",
      "disponibilita": "integer (opzionale, es. 10, 50 - mostra prodotti con almeno X unità disponibili)",
      "limit": "integer (opzionale, es. 10, 20 - limita il numero di risultati)"
  }
  ```

  ### *Status code 200:*
  ``` JSON
  {
      "success": true,
      "products": [
          { "id": 101, "nome": "Prodotto A", "prezzo": 799.99 },
          { "id": 102, "nome": "Prodotto B", "prezzo": 89.00 },
          { "id": 103, "nome": "Prodotto C", "prezzo": 249.50 }
      ]
  }
  ```

  ### *Status code 404:*
  ``` JSON
  {
      "success": false,
      "message": "Prodotti non trovati per i filtri specificati"
  }
  ```

  ### *Status code 500:*
  ``` JSON
  {
      "success": false,
      "message": "Errore interno del server"
  }
  ```

## GET /api/products/:id
  ### Esempio:
  ```
  /api/products/123
  ```

  ### *Status code 200:*
  ``` JSON
  {
      "success": true,
      "product": {
          "id": 123,
          "nome": "Maglietta in Cotone",
          "prezzo": 25.99,
          "descrizione": "Una maglietta comoda e traspirante, 100% cotone biologico.",
          "disponibilita": 250,
          "categoria": "abbigliamento"
      }
  }
  ```

  ### *Status code 404:*
  ``` JSON
  {
      "success": false,
      "message": "Prodotto non trovato"
  }
  ```

  ### *Status code 400:*
  ``` JSON
  {
      "success": false,
      "message": "ID prodotto non valido"
  }
  ```

  ### *Status code 500:*
  ``` JSON
  {
      "success": false,
      "message": "Errore interno del server"
  }
  ```
