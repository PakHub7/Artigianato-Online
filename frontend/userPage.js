// Apri overlay e mostra username
let check=0;
let overlayInitialized = false; // Flag per tracciare se l'overlay è già stato inizializzato

function openUserOverlay() {
  const overlay = document.getElementById("userOverlay");
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  overlay.classList.add("show");
  updateUserSidebar();
  
  // Solo se l'overlay non è stato ancora inizializzato, mostra la home
  if (!overlayInitialized) {
    showUserHome();
    overlayInitialized = true;
  }
}

// Chiudi overlay
function closeUserOverlay() {
  document.getElementById("userOverlay").classList.remove("show");
  // Reset del flag quando si chiude l'overlay
  overlayInitialized = false;
}

// Click fuori per chiudere overlay
document.getElementById("userOverlay").addEventListener("click", function(event) {
  if (!event.target.closest(".user-overlay-content")) {
    closeUserOverlay();
  }
});

function showUserHome() {
  // Nasconde tutte le sezioni diverse dalla home
  document.querySelectorAll('.user-main > *:not(.user-overlay-close-btn)')
      .forEach(el => {
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

  if(user.role === "artigiano") showSellerProducts(); // Mostra i prodotti del artigiano
}

// Associa bottone area personale all'overlay
document.getElementById("userAreaBtn").addEventListener("click", openUserOverlay);

// Aggiorna sidebar in base al ruolo
function updateUserSidebar() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) return; // Se non c'è un utente loggato, esci

  const statsBtn = document.getElementById("btnStats");
  const ordersBtn = document.getElementById("btnOrders");

  if (user.role === "artigiano") {
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

// Funzione that disegna il grafico (come già presente)
let currentChart;

async function renderSalesChart(chartType = "bar", id, ruolo) {
  const canvas = document.getElementById("venditeChart");
  const ctx = canvas.getContext("2d");

  // Distruggi il grafico esistente se presente
  if (currentChart) {
    currentChart.destroy();
  }

  try {
    const response = await fetch(`http://localhost:3000/api/orders?id=${id}&ruolo=${ruolo}`);
    const result = await response.json();

    if (!result.success || !Array.isArray(result.orders)) {
      console.warn(result.message || "Nessun ordine trovato.");
      return;
    }

    const ordini = result.orders;

    // Inizializza un array per 12 mesi con valore 0
    const venditeMensili = new Array(12).fill(0);

    // Raggruppa e somma gli importi per mese
    ordini.forEach((order) => {
      const dataOrdine = new Date(order.data_ordine);
      const mese = dataOrdine.getMonth(); // 0 = Gennaio, 11 = Dicembre
      venditeMensili[mese] += parseFloat(order.totale);
    });

    const labels = [
      "Gen",
      "Feb",
      "Mar",
      "Apr",
      "Mag",
      "Giu",
      "Lug",
      "Ago",
      "Set",
      "Ott",
      "Nov",
      "Dic",
    ];

    const backgroundColors = [
      "#007bff",
      "#28a745",
      "#ffc107",
      "#dc3545",
      "#6f42c1",
      "#17a2b8",
      "#fd7e14",
      "#20c997",
      "#6610f2",
      "#e83e8c",
      "#6c757d",
      "#adb5bd",
    ];

    currentChart = new Chart(ctx, {
      type: chartType,
      data: {
        labels: labels,
        datasets: [
          {
            data: venditeMensili,
            backgroundColor: backgroundColors,
            borderColor: "#333",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  } catch (error) {
    console.error("Errore nel recupero o elaborazione dei dati:", error);
  }
}

// Cache per i prodotti del venditore
let sellerProductsCache = null;
let sellerProductsLoaded = false;

// Mostra i prodotti del artgiano
async function showSellerProducts() {
  check++;
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user || user.role !== "artigiano") return;

  // Nascondi altre sezioni se necessario
  document.getElementById("statsContainer").classList.add("hidden");
  document.getElementById("sellerProductsContainer").classList.remove("hidden");

  // Se i prodotti sono già stati caricati, non ricaricarli
  if (sellerProductsLoaded && sellerProductsCache) {
    renderSellerProducts(sellerProductsCache);
    return;
  }

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

  // Mostra i prodotti del artgiano
  try {
    const response = await fetch(`http://localhost:3000/api/products/seller/${user.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    const sellerProducts = json.data;

    // Cache i prodotti
    sellerProductsCache = sellerProducts;
    sellerProductsLoaded = true;

    renderSellerProducts(sellerProducts);
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

// Funzione separata per renderizzare i prodotti
function renderSellerProducts(sellerProducts) {
  const grid = document.getElementById("sellerProductGrid");
  
  // Rimuovi tutti i prodotti esistenti (mantieni solo il bottone +)
  const existingCards = grid.querySelectorAll('.product-card:not(.new)');
  existingCards.forEach(card => card.remove());

  sellerProducts.forEach(prod => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
        <button class="card-btn edit" title="Modifica" onclick="openEditProductOverlay(${prod.prodotto.id})">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="card-btn delete" onclick="openDeletePopup(${prod.prodotto.id})">
          <i class="fa-solid fa-trash"></i>
        </button>
        <img src="${prod.immagini?.[0]?.image || 'placeholder.jpg'}" alt="${prod.prodotto.nome}">
        <h4>${prod.prodotto.nome}</h4>
        <p>${parseFloat(prod.prodotto.prezzo).toFixed(2)} €</p>
        <p>Disponibilità: ${prod.prodotto.disponibilita}</p>
      `;
    grid.appendChild(card);

  });
}

// Funzione per invalidare la cache quando si aggiunge/modifica/elimina un prodotto
function invalidateSellerProductsCache() {
  sellerProductsCache = null;
  sellerProductsLoaded = false;
}

//
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
    const response = await fetch(`http://localhost:3000/api/orders?artgiano=${encodeURIComponent(user.username)}`);
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
  //passwordInput.value = ""; // 🔹 precompila se presente

  // Rendi modificabili tutti tranne email
  usernameInput.removeAttribute("readonly");
  telefonoInput.removeAttribute("readonly");
  indirizzoInput.removeAttribute("readonly");
  //passwordInput.removeAttribute("readonly"); // 🔹

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
      //user.password = document.getElementById("settingsPassword"); // 🔹 aggiunta

      try {
        const response = await fetch("http://localhost:3000/api/user/update", {
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
async function addNewProduct() {
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
        <label for="categoria-dropdown">Scegli una categoria:</label>
        <select id="categoria-dropdown">
            <option value="">Caricamento categorie...</option>
        </select>
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

  populateCategoryDropdown();
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

  document.getElementById("editProductForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const response1 = await fetch("http://localhost:3000/api/product/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: document.getElementById("editName").value.trim(),
        categoria: document.getElementById("categoria-dropdown").value.trim(),
        descrizione: document.getElementById("editDescription").value.trim(),
        prezzo: parseFloat(document.getElementById("editPrice").value),
        disponibilita: parseInt(document.getElementById("editStock").value),
        idVenditore: JSON.parse(localStorage.getItem("loggedInUser")).id,
      }),
    });

    const data1 = await response1.json();
    const id = data1.data;

    const immagini = Array.from(document.querySelectorAll(".image-wrapper img")).map(img => img.src);

    for (const base64Img of immagini) {
      // Rimuovi header data URI
      const base64 = base64Img.replace(/^data:image\/\w+;base64,/, "");
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });
      const file = new File([blob], "immagine.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);

      // Upload file
      const response = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data2 = await response.json();
      console.log("data", data2);

      // Usa l'url ricevuto per l’API
      await fetch(`http://localhost:3000/api/product/${id}/image/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: [data2.url],
        }),
      });
    }

    invalidateSellerProductsCache();
    showSellerProducts();
    loadProducts();
    closeEditProductOverlay();
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

// Conferma l'eliminazione
document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
  if (productToDelete !== null) {
    deleteProduct(productToDelete);
    closeDeletePopup();
  }
});

// Funzione di eliminazione reale
async function deleteProduct(productId) {
  try {
    const response = await fetch("http://localhost:3000/api/product/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: productId,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Prodotto eliminato con successo");
      loadProducts(); // Ricarica i prodotti
      // Aggiorna l'UI solo DOPO la conferma dal server
      invalidateSellerProductsCache();
      showSellerProducts();
    } else {
      console.error("Errore eliminazione:", data.message);
      alert("Errore nell'eliminazione del prodotto");
    }
  } catch (error) {
    console.error("Errore di rete:", error);
    alert("Errore di connessione");
  }
}

// Modifica un prodotto
//
/*
function openEditProductOverlay(productId) {
  const overlay = document.getElementById("editProductOverlay");
  const content = document.getElementById("editProductContent");
  console.log("prod",productId);
  //const product = products.find(p => p.id === productId);
  //if (!product) return;

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
    // Invalida la cache e ricarica i prodotti
    invalidateSellerProductsCache();
    showSellerProducts();
  });
}
*/

async function openEditProductOverlay(productId) {
  const overlay = document.getElementById("editProductOverlay");
  const content = document.getElementById("editProductContent");
  //console.log("prod", productId);

  // Find the product from the cached seller products
  let product = null;
  if (sellerProductsCache) {
    const productData = sellerProductsCache.find(p => p.prodotto.id === productId);
    if (productData) {
      // Transform the data structure to match what the template expects
      product = {
        id: productData.prodotto.id,
        nome: productData.prodotto.nome,
        categoria: productData.prodotto.categoria,
        descrizione: productData.prodotto.descrizione,
        prezzo: productData.prodotto.prezzo,
        disponibilita: productData.prodotto.disponibilita,
        immagini_url: productData.immagini ? productData.immagini.map(img => img.image) : []
      };
    }
  }

  // If product not found in cache, try to fetch it
  if (!product) {
    try {
      const user = JSON.parse(localStorage.getItem("loggedInUser"));
      const response = await fetch(`http://localhost:3000/api/products/seller/${user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const json = await response.json();
        const productData = json.data.find(p => p.prodotto.id === productId);
        if (productData) {
          product = {
            id: productData.prodotto.id,
            nome: productData.prodotto.nome,
            categoria: productData.prodotto.categoria,
            descrizione: productData.prodotto.descrizione,
            prezzo: productData.prodotto.prezzo,
            disponibilita: productData.prodotto.disponibilita,
            immagini_url: productData.immagini ? productData.immagini.map(img => img.image) : []
          };
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  }

  if (!product) {
    console.error("Product not found:", productId);
    alert("Prodotto non trovato");
    return;
  }

  content.innerHTML = `
    <span class="close-btn" onclick="closeEditProductOverlay()">&times;</span>
    <h2 class="product-overlay-title">Modifica prodotto</h2>

    <div id="editableCarousel" class="image-carousel editable-carousel"></div>

    <form id="editProductForm" class="edit-product-form">
      <div class="form-group">
        <label for="editName">Nome</label>
        <input type="text" id="editName" value="${product.nome || ''}" required />
      </div>

      <div class="form-group">
        <label for="editDescription">Descrizione</label>
        <textarea id="editDescription" rows="4">${product.descrizione || ""}</textarea>
      </div>
      <div class="form-group">
        <label for="categoria-dropdown">Scegli una categoria:</label>
        <select id="categoria-dropdown">
            <option value="${product.categoria || ""}" required>Caricamento categorie...</option>
        </select>
      </div>
      <div class="form-group">
        <label for="editPrice">Prezzo</label>
        <input type="number" id="editPrice" value="${product.prezzo || 0}" step="0.01" required />
      </div>
      <div class="form-group">
        <label for="editStock">Disponibilità</label>
        <input type="number" id="editStock" value="${product.disponibilita || 0}" required />
      </div>
      <button type="submit" class="btn btn-primary mt-3 w-100">Salva modifiche</button>
    </form>
  `;

  populateCategoryDropdown(product.categoria);
  const editableCarousel = document.getElementById("editableCarousel");

  // Generate images with .image-wrapper - add safety check
  if (product.immagini_url && product.immagini_url.length > 0) {
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
  }

  // Button to add images

  const addBtn = document.createElement("div");


  addBtn.className = "image-wrapper add-image-btn";
  addBtn.innerHTML = `
    <div class="add-image-inner">
      <i class="fa-solid fa-plus"></i>
    </div>
    <input type="file" id="uploadImageInput" accept="image/*" class="hidden" />
  `;

  const fileInput = addBtn.querySelector("#uploadImageInput");

  // Make the entire card clickable
  addBtn.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", handleImageUpload);
  editableCarousel.appendChild(addBtn);

  overlay.classList.add("show");
  content.classList.remove("animate-in");
  void content.offsetWidth;
  content.classList.add("animate-in");

  // Add form submission handler
  document.getElementById("editProductForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const updatedProduct = {
      id: productId,
      nome: document.getElementById("editName").value.trim(),
      categoria: document.getElementById("categoria-dropdown").value.trim(),
      descrizione: document.getElementById("editDescription").value.trim(),
      prezzo: parseFloat(document.getElementById("editPrice").value),
      disponibilita: parseInt(document.getElementById("editStock").value),
      //immagini_url: Array.from(document.querySelectorAll("#editableCarousel .image-wrapper img")).map(img => img.src)
    };

    //console.log("up",updatedProduct);
    try {
      // Here you would typically send the update to your API
      const response = await fetch("http://localhost:3000/api/product/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log("Product updated successfully");
          loadProducts(); // Reload products
          closeEditProductOverlay();
          // Invalidate cache and reload products
          invalidateSellerProductsCache();
          showSellerProducts();
        } else {
          alert("Errore durante l'aggiornamento: " + (data.message || "Errore sconosciuto"));
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Errore di connessione durante l'aggiornamento");
    }
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

//popolamento del menu a tendina con le categorie ottenute dal .json

async function loadCategories() {
  try {
    const response = await fetch('/categorie.json');

    if (response.ok) {
      const data = await response.json();
      categoriesData = data.categories;

      // Se per qualche motivo categoriesData è ancora vuoto dopo il fetch, usa i default.
      if (!categoriesData || categoriesData.length === 0) {
        console.warn('Dati categorie vuoti dal JSON, usando i default.');
        categoriesData = DEFAULT_CATEGORIES;
      }

    } else {
      // Se la risposta HTTP non è OK, lancia un errore.
      throw new Error('Errore HTTP! Stato: ${response.status}');
    }
  } catch (error) {
    // Cattura errori di rete o di parsing e usa le categorie di default.
    console.error('Errore durante il caricamento delle categorie:', error);
    console.log('Usando categorie di default a causa dell errore.');
    categoriesData = DEFAULT_CATEGORIES;
  }
}
//popolamento del menu a tendina con le categorie ottenute dal .json

async function loadCategories() {
  try {
    const response = await fetch('/categorie.json');

    if (response.ok) {
      const data = await response.json();
      categoriesData = data.categories;

      // Se per qualche motivo categoriesData è ancora vuoto dopo il fetch, usa i default.
      if (!categoriesData || categoriesData.length === 0) {
        console.warn('Dati categorie vuoti dal JSON, usando i default.');
        categoriesData = DEFAULT_CATEGORIES;
      }

    } else {
      // Se la risposta HTTP non è OK, lancia un errore.
      throw new Error('Errore HTTP! Stato: ${response.status}');
    }
  } catch (error) {
    // Cattura errori di rete o di parsing e usa le categorie di default.
    console.error('Errore durante il caricamento delle categorie:', error);
    console.log('Usando categorie di default a causa dell errore.');
    categoriesData = DEFAULT_CATEGORIES;
  }
}
function populateCategoryDropdown(selectedCategoryId = null) { // Aggiungi parametro
  const dropdown = document.getElementById('categoria-dropdown');

  if (!dropdown) {
    console.error('Elemento <select> con ID "categoria-dropdown" non trovato nel DOM.');
    return;
  }

  dropdown.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = "";
  defaultOption.textContent = "--- Seleziona una categoria ---";
  dropdown.appendChild(defaultOption);

  categoriesData.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;

    //  AGGIUNGI QUESTA LOGICA PER SELEZIONARE L'OPZIONE CORRENTE
    if (selectedCategoryId && category.id === selectedCategoryId) {
      option.selected = true;
    }

    dropdown.appendChild(option);
  });

  dropdown.addEventListener('change', (event) => {
    console.log('Categoria selezionata dal menu a tendina (ID):', event.target.value);
  });
}


// Avvia il processo di caricamento delle categorie e popolamento del menu a tendina
// solo dopo che l'intero documento HTML è stato caricato e parsato.
document.addEventListener('DOMContentLoaded', loadCategories);