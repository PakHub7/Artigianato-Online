// --------- LOGIN ---------

let ruoloSelezionato = "";
const loginOverlay = document.getElementById("loginOverlay");

function openLoginOverlay() {
  loginOverlay.classList.remove("hidden");
  document.getElementById("loginUsername").focus();
};

function closeLoginOverlay() {
  loginOverlay.classList.add("hidden");
  document.getElementById("loginError").textContent = "";
  document.getElementById("loginForm").reset();
}

loginOverlay.addEventListener("click", (event) => {
  const content = document.querySelector(".login-overlay-content");
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
      localStorage.setItem("loggedInUser", JSON.stringify(data.user)); // Salvataggio
      closeLoginOverlay();
      updateNavbarForLogin();
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

function openRegisterOverlay() {
  registerOverlay.classList.remove("hidden");
  showRoleSelection();
};

function showRoleSelection() {
  document.getElementById("registerRoleSelection").classList.remove("hidden");
  document.getElementById("registerFormOverlay").classList.add("hidden");
  document.getElementById("formError").textContent = "";
  document.getElementById("formRegistrazione").reset();
};

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



// Gestione click sui pulsanti ruolo
document.getElementById("clienteBtn").addEventListener("click", () => showDynamicForm("cliente"));
document.getElementById("venditoreBtn").addEventListener("click", () => showDynamicForm("venditore"));

function showDynamicForm(ruolo) {
  ruoloSelezionato = ruolo;

  document.getElementById("registerRoleSelection").classList.add("hidden");
  document.getElementById("registerFormOverlay").classList.remove("hidden");

  const formTitle = document.getElementById("formTitle");
  const usernameInput = document.getElementById("inputUsername");
  const indirizzoInput = document.getElementById("inputIndirizzo");

  if (ruolo === "cliente") {
    formTitle.textContent = "Registrazione Cliente";
    usernameInput.placeholder = "Nome utente";
  } else if (ruolo === "venditore") {
    formTitle.textContent = "Registrazione Venditore";
    usernameInput.placeholder = "Nome dell’attività";
  }
}

// Gestione invio form
document.getElementById("formRegistrazione").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("inputUsername").value.trim();
  const email = document.getElementById("inputEmail").value.trim();
  const telefono = document.getElementById("inputTelefono").value.trim();
  const indirizzo = document.getElementById("inputIndirizzo").value.trim();
  const password = document.getElementById("inputPassword").value.trim();
  const errorDiv = document.getElementById("formError");

  // Validazione
  if (!username || !email || !telefono || !password || (ruoloSelezionato === "venditore" && !indirizzo)) {
    errorDiv.textContent = "Tutti i campi sono obbligatori.";
    return;
  }

  // Prepara i dati
  const data = {
    ruolo: ruoloSelezionato,
    username,
    email,
    telefono,
    password,
    ...(ruoloSelezionato === "venditore" ? { indirizzo } : {})
  };

  // Invio al backend
  fetch(`/api/register/${ruoloSelezionato}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(response => {
      if (response.success) {
        closeRegisterOverlay();
        updateNavbarForLogin();
        console.log(`${ruoloSelezionato} registrato con successo`);
      } else {
        errorDiv.textContent = response.message || "Registrazione fallita.";
      }
    })
    .catch(() => {
      errorDiv.textContent = "Errore di rete.";
    });
});

// --------- CHECK LOGIN STATUS ---------
function checkStatus() {
  return localStorage.getItem("loggedInUser") !== null;
}

// --------- LOGOUT ---------
function logoutUser() {
  localStorage.removeItem("loggedInUser");
  updateNavbarForLogin();;
};

// --------- NAVBAR UPDATE ---------
function updateNavbarForLogin() {
  const navButtons = document.getElementById("navButtons");
  const userIconContainer = document.getElementById("userIconContainer");

  if (checkStatus()) {
    navButtons.classList.add("d-none");
    userIconContainer.classList.remove("d-none");
    userIconContainer.style.display = "flex"; // Mostra subito
  } else {
    navButtons.classList.remove("d-none");
    userIconContainer.classList.add("d-none");
    userIconContainer.style.display = "none"; // Nasconde subito
  }
}