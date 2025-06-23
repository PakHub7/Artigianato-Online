// Configurazione del sistema
const CONFIG = {
  MAX_PRODUCTS_CLIENT_SIDE: 1000, // Soglia per decidere client vs server
  PRODUCTS_PER_PAGE: 20,           // Prodotti per pagina lato server
  INITIAL_LOAD_LIMIT: 50,          // Caricamento iniziale per test
  INITIAL_PRODUCTS_COUNT: 12,      // Prodotti mostrati inizialmente
  PRODUCTS_PER_LOAD: 12            // Prodotti caricati con "Vedi più"
};

let isLoading = false;

// Variabili globali per compatibilità
window.addToCart = typeof addToCart !== 'undefined' ? addToCart : function() {};
let allProducts = [];
let idGrid = 0; // ID univoco per il grid dei prodotti
window.displayedProducts = [];
window.currentProductIndex = 0;
window.searchResults = [];
window.isSearchActive = false;
window.currentProductVisualized= [];


// Funzione principale di caricamento
async function loadProducts() {
  isLoading = true;
  try {
    const response = await fetch('http://localhost:3000/api/products', {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const products = data.data || data;

    //console.log("Dati prodotti ricevuti:", products);
    
    allProducts = Array.isArray(products) ? products : [];
    window.displayedProducts = [...allProducts];
    window.allProducts = allProducts; // Per compatibilità con i filtri
    
    if (allProducts.length === 0) {
      showMessage('Nessun prodotto disponibile al momento.');
    }

    //console.log("Dati prodotti ricevuti:", products);
    
  } catch (error) {
    console.error('Errore nel caricamento prodotti:', error);
    window.displayedProducts = [];
    showError('Impossibile caricare i prodotti. Riprova più tardi.');
  } finally {
    isLoading = false;
    renderInitialProducts();
  }
}

// Render iniziale con sistema "Vedi più"
function renderInitialProducts() {
  const grid = document.getElementById("productGrid");

  if (!Array.isArray(window.displayedProducts)) {
    console.error('displayedProducts non è un array:', window.displayedProducts);
    window.displayedProducts = [];
    return;
  }

  if (isLoading) {
    grid.innerHTML = `
      <div class="spinner-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Caricamento...</span>
        </div>
      </div>
    `;
    return;
  }

  if (!window.displayedProducts || window.displayedProducts.length === 0) {
    grid.innerHTML = "<p class='info-message'>Nessun prodotto trovato.</p>";
    return;
  }

  grid.innerHTML = ""; // Pulisci il grid prima di renderizzare
  
  const productsToShow = window.displayedProducts.slice(0, CONFIG.INITIAL_PRODUCTS_COUNT);
  renderProductRows(productsToShow);
  //console.log("productsToShow: ", productsToShow);
  setupLoadMoreButton();
}

// Render delle righe di prodotti
function renderProductRows(productsToRender) {
  const grid = document.getElementById("productGrid");
  //console.log("prod to render: ", productsToRender);
  removeLoadMoreButton();

  // Aggiungi tutte le card direttamente al grid (Flexbox si occupa del layout)
  productsToRender.forEach((product, indexI) => {
    const card = createProductCard(product, indexI);
    //console.log("Card creata per prodotto:", product.prodotto.nome, "con index:", index);
    grid.appendChild(card);
  });
}

// Gestione del pulsante "Vedi più" 
function setupLoadMoreButton() {
  const currentCount = document.querySelectorAll(".product-card").length;
  if (currentCount >= window.displayedProducts.length) {
    removeLoadMoreButton();
    return;
  }

  const grid = document.getElementById("productGrid");
  const loadMoreContainer = document.createElement("div");
  loadMoreContainer.className = "load-more-container";
  loadMoreContainer.innerHTML = `
    <button id="loadMoreBtn" class="btn btn-primary">Vedi più</button>
  `;
  grid.appendChild(loadMoreContainer);

  document.getElementById("loadMoreBtn").addEventListener("click", () => {
    idGrid+=12;
    const currentCount = document.querySelectorAll(".product-card").length;
    const nextProducts = window.displayedProducts.slice(currentCount, currentCount + CONFIG.PRODUCTS_PER_LOAD);
    renderProductRows(nextProducts);
    setupLoadMoreButton();
  });
}

function removeLoadMoreButton() {
  const btn = document.getElementById("loadMoreBtn");
  if (btn) btn.parentElement.remove();
}

// Creazione card prodotto
function createProductCard(product, index) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.dataset.index = index;
  card.dataset.productId = product.prodotto.id;

  card.innerHTML = `
    <img src="${product.immagini?.[0]?.image || 'placeholder.jpg'}" alt="${product.prodotto.nome}">
    <h3>${product.prodotto.nome}</h3>
    <p class="product-price">${parseFloat(product.prodotto.prezzo).toFixed(2)} €</p>
    <p class="availability ${product.prodotto.disponibilita > 0 ? '' : 'out-of-stock'}">
      ${product.prodotto.disponibilita > 0 ? 'Disponibile' : 'Esaurito'}
    </p>
  `;
  
  card.addEventListener('click', (e) => {
    if (!window.displayedProducts || window.displayedProducts.length === 0) {
      console.warn("Prodotti non ancora caricati");
      return;
    }
    //console.log("Card cliccata per il prodotto:", product.prodotto.nome, "con ID:",card.dataset.productId);
    //console.log("typeof: ",typeof card.dataset.productId);
    openOverlay(parseInt(card.dataset.productId));
    //console.log("Card cliccata per il prodotto:", product.prodotto.nome, "con index:", index);
  });
  
  return card;
}

// Setup paginazione (per compatibilità con il sistema filtri)
function setupPagination(pagination) {
  const existingPagination = document.getElementById('pagination-container');
  if (existingPagination) {
    existingPagination.remove();
  }
  
  if (!pagination || pagination.total_pages <= 1) return;
  
  const paginationHtml = `
    <div id="pagination-container" class="pagination-container mt-4">
      <nav aria-label="Navigazione prodotti">
        <ul class="pagination justify-content-center">
          ${pagination.current_page > 1 ? 
            `<li class="page-item">
              <button class="page-link" onclick="changePage(${pagination.current_page - 1})">Precedente</button>
            </li>` : ''
          }
          
          ${Array.from({length: pagination.total_pages}, (_, i) => i + 1)
            .filter(page => 
              page === 1 || 
              page === pagination.total_pages || 
              Math.abs(page - pagination.current_page) <= 2
            )
            .map(page => 
              `<li class="page-item ${page === pagination.current_page ? 'active' : ''}">
                <button class="page-link" onclick="changePage(${page})">${page}</button>
              </li>`
            ).join('')
          }
          
          ${pagination.current_page < pagination.total_pages ? 
            `<li class="page-item">
              <button class="page-link" onclick="changePage(${pagination.current_page + 1})">Successiva</button>
            </li>` : ''
          }
        </ul>
      </nav>
    </div>
  `;
  
  const grid = document.getElementById("productGrid");
  grid.insertAdjacentHTML('afterend', paginationHtml);
}

// Funzioni di utilità per compatibilità con ricerca
function updateProductGridWithSearchResults(products) {
  window.searchResults = products;
  
  // Se ci sono filtri attivi, applicali ai risultati di ricerca
  if (window.applyFiltersToSearchResults) {
    window.applyFiltersToSearchResults(products);
  } else {
    window.displayedProducts = products;
    renderProductRows(window.displayedProducts);
    renderInitialProducts();
  }
}

// Reset griglia prodotti
window.resetProductGrid = function() {
  window.displayedProducts = [...allProducts];
  window.searchResults = [];
  renderInitialProducts();
};

// Funzioni di utilità per messaggi
function showMessage(message) {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = `<p class="info-message">${message}</p>`;
}

function showError(message) {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = `<p class="error-message">${message}</p>`;
}

// === OVERLAY FUNCTIONS ===

function openOverlay(index) {
  if (!window.displayedProducts || !Array.isArray(window.displayedProducts)) {
    console.error("displayedProducts non è un array valido", window.displayedProducts);
    alert("Si è verificato un errore. Ricarica la pagina.");
    return;
  }

  if (window.displayedProducts.length === 0) {
    console.error("displayedProducts è vuoto");
    alert("Nessun prodotto disponibile al momento.");
    return;
  }

  if (typeof index !== 'number' || index < 0) {
    console.error("Indice non valido fornito a openOverlay:", index);
    return;
  }
  
  window.currentProductIndex = index;
  const product = window.displayedProducts.find(p => p.prodotto.id === index);
  document.body.classList.add('overlay-active');

  // Setup carousel
  const carousel = document.getElementById("overlayCarousel");
  carousel.innerHTML = "";
  
  const images = product.immagini?.length > 0 
    ? product.immagini 
    : ['placeholder.jpg', 'placeholder1.jpg', 'placeholder2.jpg', 'placeholder3.jpg', 'placeholder4.jpg'];

  images.slice(0, 5).forEach(url => {
    const img = document.createElement("img");
    img.src = url.image;
    img.alt = product.prodotto.nome;
    img.addEventListener('click', () => openImageModal(url.image));
    carousel.appendChild(img);
  });

  document.getElementById("productOverlayTitle").textContent = product.prodotto.nome || "Prodotto senza nome";
  document.getElementById("productOverlayDescription").innerHTML = `
    <p><strong>Categoria:</strong> ${product.prodotto.categoria || "Nessuna categoria"}</p>
    <p>${product.prodotto.descrizione || "Nessuna descrizione disponibile"}</p>
    ${product.prodotto.artigiano_id ? `<p><small>Artigiano: ${product.prodotto.artigiano_id}</small></p>` : ''}`;
  document.getElementById("productOverlayPrice").textContent = `${parseFloat(product.prodotto.prezzo || 0).toFixed(2)} €`;
  document.getElementById("productOverlayAvailability").textContent =
    `Disponibilità: ${product.prodotto.disponibilita > 0 ? product.prodotto.disponibilita + ' pezzi' : 'Non disponibile'}`;

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartItem = cart.find(item => item.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  document.getElementById("productOverlayAvailability").textContent = product.prodotto.disponibilita > 0 ? `Disponibilità: ${product.prodotto.disponibilita} pezzi` : 'Non disponibile';

  document.getElementById("quantitySelectionContainer").classList.toggle("hidden", product.prodotto.disponibilita <= 0);
  document.getElementById("addToCartBtn").classList.toggle("hidden", product.prodotto.disponibilita <= 0);

  const inputQty = document.getElementById("quantityInput");
  inputQty.value = "1";
  inputQty.setAttribute("data-max", product.prodotto.disponibilita);

  const quantityContainer = document.getElementById("quantitySelectionContainer");
  const [decreaseBtn, increaseBtn] = quantityContainer.querySelectorAll("button");
  
  decreaseBtn.onclick = (e) => {
    e.stopPropagation();
    changeQuantity(-1);
  };
  
  increaseBtn.onclick = (e) => {
    e.stopPropagation();
    changeQuantity(1);
  };

  inputQty.onchange = validateQuantityInput;

  document.getElementById("productOverlay").classList.add("show")
  window.currentProductVisualized = product.prodotto;
  //console.log("tutto prod",window.currentProductVisualized);
  //console.log("Overlay aperto per il prodotto:", product.prodotto.nome, "con indice:", index);

  setupOverlayArrows();
  updateArrowVisibility();
}

function updateArrowVisibility() {
  const leftArrow = document.querySelector(".overlay-arrow.left");
  const rightArrow = document.querySelector(".overlay-arrow.right");

  leftArrow.classList.toggle("hidden", currentProductIndex <= 0);
  rightArrow.classList.toggle("hidden", currentProductIndex >= window.displayedProducts.length - 1);
}

function validateQuantityInput() {
  const input = document.getElementById("quantityInput");
  const errorMsg = input.parentElement.querySelector(".error-msg");
  const maxAvailable = parseInt(input.dataset.max);
  let val = parseInt(input.value);

  if (isNaN(val) || val < 1) {
    input.value = 1;
    errorMsg.style.display = "none";
    errorMsg.textContent = "";
  } else if (val > maxAvailable) {
    input.value = maxAvailable;
    errorMsg.style.display = "block";
  } else {
    errorMsg.style.display = "none";
    errorMsg.textContent = "";
  }
}

function setupOverlayArrows() {
  const leftArrow = document.querySelector(".overlay-arrow.left");
  const rightArrow = document.querySelector(".overlay-arrow.right");

  if (leftArrow && rightArrow) {
    leftArrow.onclick = showPreviousProduct;
    rightArrow.onclick = showNextProduct;
    
    leftArrow.classList.toggle("hidden", window.currentProductIndex <= 0);
    rightArrow.classList.toggle("hidden", window.currentProductIndex >= window.displayedProducts.length - 1);
  }
}

function showPreviousProduct() {
  if (window.currentProductIndex > 0) {
    changeQuantity(0);
    window.currentProductIndex--;
    openOverlay(window.currentProductIndex);
  }
}

function showNextProduct() {
  if (window.currentProductIndex < window.displayedProducts.length - 1) {
    changeQuantity(0);
    window.currentProductIndex++;
    openOverlay(window.currentProductIndex);
  }
}

function closeOverlay() {
  changeQuantity(0);
  document.getElementById("productOverlay").classList.remove("show");
  document.body.classList.remove('overlay-active');
}

function changeQuantity(delta) {
  const input = document.getElementById("quantityInput");
  const max = parseInt(input.dataset.max);
  let newVal = parseInt(input.value) + delta;
  if (isNaN(newVal) || newVal < 1) newVal = 1;
  if (newVal > max) newVal = max;
  input.value = newVal;
  validateQuantityInput();
}

function openImageModal(src) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  
  modalImg.src = src;
  modal.style.display = "flex";
  document.body.style.overflow = "hidden"; // Blocca lo scroll
  
  // Aggiungi listener per la chiusura
  modal.addEventListener('click', function modalClickHandler(e) {
    if (e.target === modal || e.target.classList.contains('close-modal')) {
      closeImageModal();
      modal.removeEventListener('click', modalClickHandler);
    }
  });
}

function closeImageModal() {
  const modal = document.getElementById("imageModal");
  modal.style.display = "none";
  document.body.style.overflow = ""; // Riabilita lo scroll
}

// === ESPORTAZIONI E COLLEGAMENTI ===

// Esportazioni per compatibilità con sistema filtri
window.renderInitialProducts = renderInitialProducts;
window.setupPagination = setupPagination;
window.updateProductGridWithSearchResults = updateProductGridWithSearchResults;

// Funzione per aggiornare l'UI delle card prodotto
window.updateProductCardUI = function(productId) {
  const product = window.displayedProducts.find(p => p.id === productId) || 
                 allProducts.find(p => p.id === productId);
  if (!product) return;

  const cards = document.querySelectorAll(`.product-card[data-product-id="${productId}"]`);
  
  cards.forEach(card => {
    const availabilityEl = card.querySelector('.availability');
    if (availabilityEl) {
      availabilityEl.textContent = product.prodotto.disponibilita > 0 
        ? `Disponibile` 
        : 'Esaurito';
      availabilityEl.classList.toggle('out-of-stock', product.prodotto.disponibilita <= 0);
    }
  });
};

// Debug info
window.getProductsInfo = function() {
  return {
    loadedProducts: allProducts.length,
    displayedProducts: window.displayedProducts.length,
    searchResults: window.searchResults.length,
    config: CONFIG
  };
};

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
});

