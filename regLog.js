// --------- LOGIN ---------

const loginOverlay = document.getElementById("loginOverlay");

document.getElementById("loginBtn").onclick = () => {
  loginOverlay.classList.remove("hidden");
  document.getElementById("loginUsername").focus();
};

function closeLoginOverlay() {
  loginOverlay.classList.add("hidden");
  document.getElementById("loginError").textContent = "";
  document.getElementById("loginForm").reset();
}

loginOverlay.addEventListener("click", (event) => {
  const content = document.querySelector(".overlay-box");
  if (!content.contains(event.target)) {
    closeLoginOverlay();
  }
});

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const errorDiv = document.getElementById("loginError");

  if (!username || !password) {
    errorDiv.textContent = "Tutti i campi sono obbligatori.";
    return;
  }

  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        closeLoginOverlay();
        console.log("Login effettuato:", data.user);
      } else {
        errorDiv.textContent = data.message || "Credenziali non valide.";
      }
    })
    .catch(() => {
      errorDiv.textContent = "Errore di connessione al server.";
    });
});

// --------- REGISTRAZIONE ---------

const registerOverlay = document.getElementById("registerOverlay");

document.getElementById("registerBtn").addEventListener("click", () => {
  registerOverlay.classList.remove("hidden");

  // Mostra selezione ruoli, nasconde form
  showRegisterRoleSelection();

  // Pulisci eventuali errori o dati vecchi
  document.getElementById("formCliente").reset();
  document.getElementById("formVenditore").reset();
  document.getElementById("clienteError").textContent = "";
  document.getElementById("venditoreError").textContent = "";
});

function showRegisterRoleSelection() {
  document.getElementById("registerRoleSelection").classList.remove("hidden");
  document.getElementById("formCliente").classList.add("hidden");
  document.getElementById("formVenditore").classList.add("hidden");
}

function closeRegisterOverlay() {
  registerOverlay.classList.add("hidden");
  document.getElementById("clienteError").textContent = "";
  document.getElementById("venditoreError").textContent = "";
  document.getElementById("formCliente").reset();
  document.getElementById("formVenditore").reset();
}

registerOverlay.addEventListener("click", function (event) {
  if (!event.target.closest(".register-overlay-content")) {
    closeRegisterOverlay();
  }
});

// Ruolo selezionato → mostra form corrispondente
document.getElementById("clienteBtn").addEventListener("click", () => {
  document.getElementById("registerRoleSelection").classList.add("hidden");
  document.getElementById("formCliente").classList.remove("hidden");
  document.getElementById("formVenditore").classList.add("hidden");
  document.getElementById("clienteUsername").focus();
  document.getElementById("back-btn").classList.remove("hidden");
});

document.getElementById("venditoreBtn").addEventListener("click", () => {
  document.getElementById("registerRoleSelection").classList.add("hidden");
  document.getElementById("formVenditore").classList.remove("hidden");
  document.getElementById("formCliente").classList.add("hidden");
  document.getElementById("venditoreNomeAttivita").focus();
  document.getElementById("back-btn").classList.remove("hidden");
});

// Submit Cliente
document.getElementById("formCliente").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("clienteUsername").value.trim();
  const email = document.getElementById("clienteEmail").value.trim();
  const telefono = document.getElementById("clienteTelefono").value.trim();
  const password = document.getElementById("clientePassword").value.trim();
  const errorDiv = document.getElementById("clienteError");

  if (!username || !email || !telefono || !password) {
    errorDiv.textContent = "Tutti i campi sono obbligatori.";
    return;
  }

  fetch("/api/register/cliente", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, telefono, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        closeRegisterOverlay();
        console.log("Cliente registrato");
      } else {
        errorDiv.textContent = data.message || "Registrazione fallita.";
      }
    })
    .catch(() => {
      errorDiv.textContent = "Errore di rete.";
    });
});

// Submit Venditore
document.getElementById("formVenditore").addEventListener("submit", function (e) {
  e.preventDefault();
  const nomeAttivita = document.getElementById("venditoreNomeAttivita").value.trim();
  const email = document.getElementById("venditoreEmail").value.trim();
  const indirizzo = document.getElementById("venditoreIndirizzo").value.trim();
  const telefono = document.getElementById("venditoreTelefono").value.trim();
  const password = document.getElementById("venditorePassword").value.trim();
  const errorDiv = document.getElementById("venditoreError");

  if (!nomeAttivita || !email || !indirizzo || !telefono || !password) {
    errorDiv.textContent = "Tutti i campi sono obbligatori.";
    return;
  }

  fetch("/api/register/venditore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nomeAttivita, email, indirizzo, telefono, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        closeRegisterOverlay();
        console.log("Venditore registrato");
      } else {
        errorDiv.textContent = data.message || "Registrazione fallita.";
      }
    })
    .catch(() => {
      errorDiv.textContent = "Errore di rete.";
    });
});