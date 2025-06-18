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
  headers: { 
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  body: JSON.stringify({
    username: username.trim(),
    password: password
  })
})
.then(async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Errore durante il login");
  }
  return data;
})
.then(data => {
  if (data.success) {
    localStorage.setItem("loggedInUser", JSON.stringify(data.user));
    closeLoginOverlay();
    updateNavbarForLogin();
    if (typeof updateUserSidebar === "function") updateUserSidebar();
  }
})
.catch(error => {
  console.error("Errore login:", error);
  errorDiv.textContent = error.message;
  errorDiv.style.display = "block";
});

    /*fetch('/api/login', {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email: "tua@email.com",
        password: "tua_password"
      })
    })
    .then(response => {
      if (!response.ok) throw new Error("Errore login");
      return response.json();
    })
    .then(data => {
      console.log("Login success:", data);
      // Gestisci il login riuscito
    })
    .catch(error => {
      console.error("Errore login:", error);
      // Mostra errore all'utente
    });*/
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

  const clienteError = document.getElementById("clienteError");
  if (clienteError) clienteError.textContent = "";

  const venditoreError = document.getElementById("venditoreError");
  if (venditoreError) venditoreError.textContent = "";

  const formCliente = document.getElementById("formCliente");
  if (formCliente) formCliente.reset();

  const formVenditore = document.getElementById("formVenditore");
  if (formVenditore) formVenditore.reset();
}

// Gestione click per chiudere l'overlay di registrazione
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
        if (typeof updateUserSidebar === "function") updateUserSidebar(); // Aggiorna la sidebar se la funzione esiste
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

// Inizializza la navbar al caricamento della pagina
window.addEventListener("DOMContentLoaded", () => {
  updateNavbarForLogin();
  if(typeof updateUserSidebar === "function") updateUserSidebar(); // Aggiorna la sidebar se la funzione esiste
});

// --------- LOGOUT ---------
function logoutUser() {
  localStorage.removeItem("loggedInUser");
  updateNavbarForLogin();
  closeUserOverlay();
};

// Gestione logout automatico
/*function setupAutoLogout() {
  // Flag per distinguere tra refresh e chiusura
  let isReloading = false;

  // Rileva se è un refresh
  window.addEventListener('beforeunload', (e) => {
    const performance = window.performance;
    if (performance && performance.navigation.type === 1) {
      isReloading = true;
    }
  });

  // Logout solo alla chiusura effettiva
  window.addEventListener('unload', () => {
    if (!isReloading && checkStatus()) {
      localStorage.setItem('pendingLogout', 'true');
    }
  });

  // Gestione all'apertura
  window.addEventListener('load', () => {
    if (localStorage.getItem('pendingLogout')) {
      logoutUser();
      localStorage.removeItem('pendingLogout');
    }
  });
}*/

// --------- LOGOUT AUTOMATICO ---------
function setupAutoLogout() {
  let isReloading = false;

  // Rileva i tasti di refresh (F5/Ctrl+R/Cmd+R)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) {
      isReloading = true;
    }
  });

  // Rileva click sul pulsante refresh del browser
  window.addEventListener('mouseup', (e) => {
    if (e.button === 1) { // Tasto centrale del mouse (click su refresh)
      isReloading = true;
    }
  });

  window.addEventListener('beforeunload', () => {
    if (!isReloading && checkStatus()) {
      localStorage.setItem('pendingLogout', 'true');
    }
  });

  window.addEventListener('load', () => {
    if (localStorage.getItem('pendingLogout')) {
      logoutUser();
      localStorage.removeItem('pendingLogout');
    }
    isReloading = false; // Reset per la prossima volta
  });
    
  if ('connection' in navigator) {
    navigator.connection.addEventListener('change', () => {
      isReloading = true; // Considera i cambi di connessione come refresh
    });
  }
}

// Inizializzazione
window.addEventListener('DOMContentLoaded', () => {
  setupAutoLogout();
  updateNavbarForLogin();
  if(typeof updateUserSidebar === 'function') updateUserSidebar();
});

// Verifica se l'utente è loggato
function isUserLoggedIn() {
  return localStorage.getItem('loggedInUser') !== null;
}

// Inizializza al caricamento della pagina
window.addEventListener('DOMContentLoaded', () => {
  setupAutoLogout();
  updateNavbarForLogin();
});