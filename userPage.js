// Apri overlay e mostra username
function openUserOverlay() {
  const overlay = document.getElementById("userOverlay");
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  overlay.classList.add("show"); 
  updateUserSidebar();

  showUserHome(); // Mostra la home dell'utente all'apertura
}

// Chiudi overlay
function closeUserOverlay() {
  document.getElementById("userOverlay").classList.remove("show");
}

// Click fuori per chiudere overlay
document.getElementById("userOverlay").addEventListener("click", function(event) {
  if (!event.target.closest(".user-overlay-content")) {
    closeUserOverlay();
  }
});

function showUserHome() {
  // Nasconde tutte le sezioni diverse dalla home
  document.querySelectorAll('.user-main > *:not(.user-overlay-close-btn)').forEach(el => {
    el.classList.add('hidden');
  });

  // Rendi visibili titolo e benvenuto
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) return;

  const title = document.getElementById("userOverlayTitle");

  title.textContent = `Ciao, ${user.username || "utente"}`;

  title.classList.remove("hidden");

  // Eventuale sezione home (se la hai avvolta in un div)
  const statsContainer = document.getElementById("statsContainer");
  if (statsContainer) statsContainer.classList.add("hidden");

  if(user.ruolo === "venditore") showSellerProducts(); // Mostra i prodotti del venditore
}

// Associa bottone area personale all’overlay
document.getElementById("userAreaBtn").addEventListener("click", openUserOverlay);

// Aggiorna sidebar in base al ruolo
function updateUserSidebar() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) return; // Se non c'è un utente loggato, esci

  const statsBtn = document.getElementById("btnStats");
  const ordersBtn = document.getElementById("btnOrders");

  if (user.ruolo === "venditore") {
    statsBtn?.classList.remove("hidden");
    ordersBtn?.classList.add("hidden");
  } else {
    statsBtn?.classList.add("hidden");
    ordersBtn?.classList.remove("hidden");
  }
}

// Associa bottone 'Ordini' per mostrare ordini utente
document.getElementById("btnOrders").addEventListener("click", () => {
  showUserOrders();
});

function showUserOrders() {
  // Nasconde tutte le sezioni tranne quella ordini
  document.querySelectorAll('.user-main > *:not(.user-overlay-close-btn)').forEach(el => {
    el.classList.add('hidden');
  });

  const ordersContainer = document.getElementById("ordersContainer");
  ordersContainer.classList.remove("hidden");

  const ordersList = document.getElementById("ordersList");
  ordersList.innerHTML = ""; // Pulisce la lista visiva

  loadAndShowOrders(); // Carica gli ordini e li mostra
}

// Funzione che mostra il grafico nella sezione principale dell'overlay
function showStatsContent() {
  // Nasconde eventuali altre sezioni (se presenti in futuro)
  document.querySelectorAll('.user-main > *:not(.user-overlay-close-btn)').forEach(el => {
    if (el.id !== 'statsContainer') el.classList.add('hidden');
  });

  // Mostra la sezione stats
  const statsContainer = document.getElementById("statsContainer");
  statsContainer.classList.remove("hidden");

  // Ridisegna il grafico solo se non già disegnato
  if (!statsContainer.dataset.initialized) {
    renderSalesChart('bar');
    statsContainer.dataset.initialized = "true";
  }       
  loadAndShowOrders(); 
}

// Funzione che disegna il grafico (come già presente)
let currentChart = null;

function renderSalesChart(chartType = 'bar') {
  const canvas = document.getElementById('venditeChart');
  const ctx = canvas.getContext('2d');

  // Distruggi il grafico esistente se presente
  if (currentChart) {
    currentChart.destroy();
  }

  currentChart = new Chart(ctx, {
    type: chartType,

    // Dati di test ++++++++++++++++++++++++++++++++++++++++++++++++++
    data: { 
      labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag'],
      datasets: [{
        data: [120, 190, 30, 50, 90],
        backgroundColor: [
          '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1'
        ],
        borderColor: '#333',
        borderWidth: 1
      }]
    },
    options: {
      responsive:true,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// Mostra i prodotti del venditore
function showSellerProducts() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user || user.ruolo !== "venditore") return;

  // Nascondi altre sezioni se necessario
  document.getElementById("statsContainer").classList.add("hidden");
  document.getElementById("sellerProductsContainer").classList.remove("hidden");

  // Pulisci la griglia
  const grid = document.getElementById("sellerProductGrid");
  grid.innerHTML = "";

  const addCard = document.createElement("div");
  addCard.className = "product-card new";
  addCard.innerHTML = `<i class="fa-solid fa-plus fa-2x plus-icon"></i>`;
  addCard.onclick = () => {
    addNewProduct();
  };
  grid.prepend(addCard);

  // Mostra i prodotti del venditore
  const sellerProducts = products.filter(p => p.artigiano_id === user.username);
  sellerProducts.forEach(prod => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <button class="card-btn edit" title="Modifica" onclick="openEditProductOverlay(${prod.id})">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button class="card-btn delete" onclick="openDeletePopup(${prod.id})">
        <i class="fa-solid fa-trash"></i>
      </button>
      <img src="${prod.immagini_url[0]}" alt="${prod.nome}" />
      <h4>${prod.nome}</h4>
      <p>${parseFloat(prod.prezzo).toFixed(2)} €</p>
      <p>Disponibilità: ${prod.disponibilita}</p>
    `;
    grid.appendChild(card);
  });
}

// Mostra gli ordini
async function loadAndShowOrders() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) return;

  // Dati di test ++++++++++++++++++++++++++++++++++++++++++++++++++
  const data = {
    success: true,
    orders: [
      {
        prodotti: [
          { nome: "Borsa in cuoio", quantita: 2 }
        ],
        stato: "spedito",
        guadagno_totale: 158.00,
        data: "24.05.2025"
      },
      {
        prodotti: [
          { nome: "Orecchini in argento", quantita: 1 }
        ],
        stato: "in lavorazione",
        guadagno_totale: 60.00,
        data: "12.02.2025"
      }
    ]
  };

  const ordersList = document.getElementById("ordersList");
  ordersList.innerHTML = ""; // Pulisce lista ordini

  if (!data.success || !data.orders.length) {
    ordersList.textContent = "Nessun ordine trovato.";
    return;
  }

  data.orders.forEach(order => {
    const orderDiv = document.createElement("div");
    orderDiv.className = "order-item";

    const prodottiString = order.prodotti
      .map(p => `<div class="order-product-line">${p.nome} x${p.quantita}</div>`)
      .join("");

    orderDiv.innerHTML = `
      <div class="order-products">${prodottiString}
        <small>${order.data}</small>
      </div>
      <div class="order-state">${order.stato}</div>
      <div class="order-profit">€${order.guadagno_totale.toFixed(2)}</div>
    `;

    ordersList.appendChild(orderDiv);
  });

  /* Collegamento 
  try {
    const response = await fetch(`/api/orders?venditore=${encodeURIComponent(user.username)}`);
    const data = await response.json();
    if (!data.success) {
      document.getElementById("ordersList").textContent = "Nessun ordine trovato.";
      return;
    }

    const ordersList = document.getElementById("ordersList");
    ordersList.innerHTML = ""; // Pulisce lista ordini

    data.orders.forEach(order => {
      const orderDiv = document.createElement("div");
      orderDiv.className = "order-item";

      // Lista prodotti in stringa "Prod A x2, Prod B x1"
      const prodottiString = order.prodotti.map(p => `${p.nome} x${p.quantita}`).join(", ");

      orderDiv.innerHTML = `
        <div class="order-products">${prodottiString}</div>
        <div class="order-state">${order.stato}</div>
        <div class="order-profit">€${order.guadagno_totale.toFixed(2)}</div>
      `;

      ordersList.appendChild(orderDiv);
    });

  } catch (error) {
    console.error("Errore caricamento ordini:", error);
    document.getElementById("ordersList").textContent = "Errore nel caricamento degli ordini.";
  }
  */ 
};

// Mostra la pagina delle impostazioni
function showSettingsSection() {
  // Nasconde tutto tranne la sezione impostazioni
  document.querySelectorAll('.user-main > *:not(.user-overlay-close-btn)').forEach(el => {
    el.classList.add('hidden');
  });

  const settingsContainer = document.getElementById("settingsContainer");
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) return;

  // Popola i campi con i dati utente
  const usernameInput = document.getElementById("settingsUsername");
  const emailInput = document.getElementById("settingsEmail");
  const telefonoInput = document.getElementById("settingsTelefono");
  const indirizzoInput = document.getElementById("settingsIndirizzo");
  const passwordInput = document.getElementById("settingsPassword"); // 🔹 nuovo campo

  usernameInput.value = user.username || "";
  emailInput.value = user.email || "";
  telefonoInput.value = user.telefono || "";
  indirizzoInput.value = user.indirizzo || "";
  passwordInput.value = user.password || ""; // 🔹 precompila se presente

  // Rendi modificabili tutti tranne email
  usernameInput.removeAttribute("readonly");
  telefonoInput.removeAttribute("readonly");
  indirizzoInput.removeAttribute("readonly");
  passwordInput.removeAttribute("readonly"); // 🔹

  emailInput.setAttribute("readonly", "true");
  emailInput.classList.add("readonly");

  settingsContainer.classList.remove("hidden");
}

// Apre il popup
function openSettingsPopup() {
  const popup = document.getElementById('confirmPopup');
  popup.classList.remove('hidden');
  popup.style.display = 'flex';
}
window.openSettingsPopup = openSettingsPopup;

// Chiude il popup
function closeSettingsPopup() {
  const popup = document.getElementById('confirmPopup');
  if (popup) {
    popup.classList.add('hidden');
    popup.style.display = 'none';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("confirmPopup");
  if (popup) {
    popup.addEventListener("click", function (event) {
      const popupContent = document.querySelector(".popup-content");
      if (!popupContent.contains(event.target)) {
        closeSettingsPopup();
      }
    });
  }

  const confirmBtn = document.getElementById("confirmSettingsBtn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", async function () {
      const user = JSON.parse(localStorage.getItem("loggedInUser")) || {};

      user.username = document.getElementById("settingsUsername").value.trim();
      user.telefono = document.getElementById("settingsTelefono").value.trim();
      user.indirizzo = document.getElementById("settingsIndirizzo").value.trim();
      user.password = document.getElementById("settingsPassword").value.trim(); // 🔹 aggiunta

      try {
        const response = await fetch("/api/updateUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user)
        });

        const data = await response.json();
        if (data.success) {
          localStorage.setItem("loggedInUser", JSON.stringify(user));
          closeSettingsPopup();
          showUserHome();
        } else {
          alert("Errore durante il salvataggio: " + (data.message || "Errore sconosciuto"));
        }
      } catch (error) {
        console.error("Errore connessione:", error);
        alert("Errore di rete. Riprova.");
      }
    });
  }
});

// Aggiunge nuovi prodotti
function addNewProduct() {
  const overlay = document.getElementById("editProductOverlay");
  const content = document.getElementById("editProductContent");

  content.innerHTML = `
    <span class="close-btn" onclick="closeEditProductOverlay()">&times;</span>
    <h2 class="product-overlay-title">Nuovo prodotto</h2>

    <div id="editableCarousel" class="image-carousel editable-carousel"></div>

    <form id="editProductForm" class="edit-product-form">
      <div class="form-group">
        <label for="editName">Nome</label>
        <input type="text" id="editName" required />
      </div>
      <div class="form-group">
        <label for="editDescription">Descrizione</label>
        <textarea id="editDescription" rows="4"></textarea>
      </div>
      <div class="form-group">
        <label for="editPrice">Prezzo</label>
        <input type="number" id="editPrice" step="0.01" required />
      </div>
      <div class="form-group">
        <label for="editStock">Disponibilità</label>
        <input type="number" id="editStock" required />
      </div>
      <button type="submit" class="btn btn-primary mt-3 w-100">Crea prodotto</button>
    </form>
  `;

  const editableCarousel = document.getElementById("editableCarousel");

  // Bottone per aggiunta immagini
  const addBtn = document.createElement("div");
  addBtn.className = "image-wrapper add-image-btn";
  addBtn.innerHTML = `
    <div class="add-image-inner">
      <i class="fa-solid fa-plus"></i>
    </div>
    <input type="file" id="uploadImageInput" accept="image/*" class="hidden" />
  `;
  const fileInput = addBtn.querySelector("#uploadImageInput");
  addBtn.addEventListener("click", () => {
    fileInput.click();
  });
  fileInput.addEventListener("change", handleImageUpload);
  editableCarousel.appendChild(addBtn);

  overlay.classList.add("show");
  content.classList.remove("animate-in");
  void content.offsetWidth;
  content.classList.add("animate-in");

  document.getElementById("editProductForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const newProduct = {
      id: Date.now(), // ID temporaneo
      nome: document.getElementById("editName").value.trim(),
      descrizione: document.getElementById("editDescription").value.trim(),
      prezzo: parseFloat(document.getElementById("editPrice").value),
      disponibilita: parseInt(document.getElementById("editStock").value),
      immagini_url: Array.from(document.querySelectorAll(".image-wrapper img")).map(img => img.src),
      artigiano_id: JSON.parse(localStorage.getItem("loggedInUser")).username
    };

    products.push(newProduct);
    closeEditProductOverlay();
    showSellerProducts();
  });
}

let productToDelete = null;

// Mostra il popup di conferma per eliminare un prodotto
function openDeletePopup(productId) {
  productToDelete = productId;
  document.getElementById("deleteConfirmPopup").classList.remove("hidden");
}

// Chiude il popup
function closeDeletePopup() {
  document.getElementById("deleteConfirmPopup").classList.add("hidden");
  productToDelete = null;
}

document.getElementById("deleteConfirmPopup").addEventListener("click", function(event) {
  if (!event.target.closest(".deleteConfirmPupup")) {
    closeDeletePopup();
  }
});

// Conferma l’eliminazione
document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
  if (productToDelete !== null) {
    deleteProduct(productToDelete);
    closeDeletePopup();
  }
});

// Funzione di eliminazione reale
function deleteProduct(productId) {
  // Rimuove dall’array locale dei prodotti
  products = products.filter(p => p.id !== productId);

  // Ricostruisce la sezione
  showSellerProducts();

  // Puoi aggiungere una fetch al backend qui
  /*
  fetch(`/api/products/${productId}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      if (data.success) showSellerProducts();
    });
  */
}

// Modifica un prodotto
function openEditProductOverlay(productId) {
  const overlay = document.getElementById("editProductOverlay");
  const content = document.getElementById("editProductContent");

  const product = products.find(p => p.id === productId);
  if (!product) return;

  content.innerHTML = `
    <span class="close-btn" onclick="closeEditProductOverlay()">&times;</span>
    <h2 class="product-overlay-title">Modifica prodotto</h2>

    <div id="editableCarousel" class="image-carousel editable-carousel"></div>

    <form id="editProductForm" class="edit-product-form">
      <div class="form-group">
        <label for="editName">Nome</label>
        <input type="text" id="editName" value="${product.nome}" required />
      </div>
      <div class="form-group">
        <label for="editDescription">Descrizione</label>
        <textarea id="editDescription" rows="4">${product.descrizione || ""}</textarea>
      </div>
      <div class="form-group">
        <label for="editPrice">Prezzo</label>
        <input type="number" id="editPrice" value="${product.prezzo}" step="0.01" required />
      </div>
      <div class="form-group">
        <label for="editStock">Disponibilità</label>
        <input type="number" id="editStock" value="${product.disponibilita}" required />
      </div>
      <button type="submit" class="btn btn-primary mt-3 w-100">Salva modifiche</button>
    </form>
  `;

  const editableCarousel = document.getElementById("editableCarousel");
  // Genera immagini con .image-wrapper
  product.immagini_url.forEach((url, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "image-wrapper";
    wrapper.innerHTML = `
      <img src="${url}" alt="Immagine ${i + 1}" class="editable-image" />
      <button class="remove-image-btn" onclick="removeImageFromCarousel(this)">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    editableCarousel.appendChild(wrapper);
  });
  
  // Bottone per aggiungere le immagini
  const addBtn = document.createElement("div");
  addBtn.className = "image-wrapper add-image-btn";
  addBtn.innerHTML = `
    <div class="add-image-inner">
      <i class="fa-solid fa-plus"></i>
    </div>
    <input type="file" id="uploadImageInput" accept="image/*" class="hidden" />
  `;

  const fileInput = addBtn.querySelector("#uploadImageInput");

  // Rendi tutta la card cliccabile
  addBtn.addEventListener("click", () => {
    fileInput.click();
  });

fileInput.addEventListener("change", handleImageUpload);
  editableCarousel.appendChild(addBtn);

  overlay.classList.add("show");
  content.classList.remove("animate-in");
  void content.offsetWidth;
  content.classList.add("animate-in");

  document.getElementById("editProductForm").addEventListener("submit", function (e) {
    e.preventDefault();
    product.nome = document.getElementById("editName").value.trim();
    product.descrizione = document.getElementById("editDescription").value.trim();
    product.prezzo = parseFloat(document.getElementById("editPrice").value);
    product.disponibilita = parseInt(document.getElementById("editStock").value);
    // Now images are in .image-wrapper img
    product.immagini_url = Array.from(document.querySelectorAll(".image-wrapper img")).map(img => img.src);

    closeEditProductOverlay();
    showSellerProducts();
  });
}

function closeEditProductOverlay() {
  document.getElementById("editProductOverlay").classList.remove("show");
  document.getElementById("editProductContent").classList.remove("animate-in");
}

function addImageToCarousel() {
  const input = document.getElementById("newImageUrl");
  const url = input.value.trim();
  if (!url) return;

  const editableCarousel = document.getElementById("editableCarousel");
  // Find the add-image-btn to insert before it
  const addBtn = editableCarousel.querySelector(".add-image-btn");
  const wrapper = document.createElement("div");
  wrapper.className = "image-wrapper";
  wrapper.innerHTML = `
    <button class="remove-image-btn" onclick="removeImageFromCarousel(this)">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  if (addBtn) {
    editableCarousel.insertBefore(wrapper, addBtn);
  } else {
    editableCarousel.appendChild(wrapper);
  }
  input.value = "";
}

function removeImageFromCarousel(btn) {
  // Now .image-wrapper is the container
  const container = btn.closest(".image-wrapper");
  if (container) container.remove();
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const imageUrl = e.target.result;

    const editableCarousel = document.getElementById("editableCarousel");
    const addBtn = editableCarousel.querySelector(".add-image-btn");

    const wrapper = document.createElement("div");
    wrapper.className = "image-wrapper";
    wrapper.innerHTML = `
      <img src="${imageUrl}" alt="Nuova immagine" class="editable-image" />
      <button class="remove-image-btn" onclick="removeImageFromCarousel(this)">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;

    if (addBtn) {
      editableCarousel.insertBefore(wrapper, addBtn);
    } else {
      editableCarousel.appendChild(wrapper);
    }

    event.target.value = ""; // Reset del file input
  };
  reader.readAsDataURL(file);
}