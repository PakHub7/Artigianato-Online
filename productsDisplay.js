import { executeSearch, resetSearch } from './search.js';

let searchResults = [];
let allProducts = [];
let filteredProducts = [];
let displayedProducts = [];
let currentProductIndex = 0;
const initialProductsCount = 12;
const productsPerLoad = 12;

// Funzione principale per caricare i prodotti
export async function loadProducts() {
  /*try {
    const response = await fetch('http://localhost:3000/api/products');
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    allProducts = await response.json();
    displayedProducts = [...allProducts];
    
    if (!Array.isArray(allProducts)) throw new Error("La risposta non è un array valido");

    if (allProducts.length === 0) {
      showMessage('Nessun prodotto disponibile al momento.');
    } else {
      renderInitialProducts();
    }
  } catch (error) {
    console.error('Errore nel caricamento prodotti:', error);
    showError('Impossibile caricare i prodotti. Riprova più tardi.');
  }*/

    try {
    const response = await fetch('/api/products');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const products = await response.json();
    allProducts = products;
    displayedProducts = [...allProducts];
    
    if (!Array.isArray(allProducts)) {
      throw new Error("La risposta non è un array valido");
    }

    if (allProducts.length === 0) {
      showMessage('Nessun prodotto disponibile al momento.');
    } else {
      renderInitialProducts();
    }
  } catch (error) {
    console.error('Errore nel caricamento prodotti:', error);
    showError('Impossibile caricare i prodotti. Riprova più tardi.');
  }
}

let lastFilters = {};

// Funzione per applicare i filtri (esportata per essere usata da filters.js)
// Sostituisci la funzione applyProductFilters con questa:
/*export function applyProductFilters(filters, sourceProducts = null) {
  const productsToFilter = sourceProducts || allProducts;
  
  filteredProducts = [...productsToFilter];
  lastFilters = filters;

  // Filtro per categoria
  if (filters.categories?.length > 0) {
    filteredProducts = filteredProducts.filter(product => {
      const catId = product.categoria_id?.toString();
      const catName = product.categoria?.toString();
      return filters.categories.some(cat => 
        cat === catId || cat === catName
      );
    });
  }

  // Filtro per prezzo
  if (filters.minPrice !== null && filters.minPrice !== undefined) {
    filteredProducts = filteredProducts.filter(product => 
      parseFloat(product.prezzo) >= parseFloat(filters.minPrice)
    );
  }
  if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
    filteredProducts = filteredProducts.filter(product => 
      parseFloat(product.prezzo) <= parseFloat(filters.maxPrice)
    );
  }

  // Filtro disponibilità
  if (filters.availableOnly) {
    filteredProducts = filteredProducts.filter(product => 
      parseInt(product.disponibilita) > 0
    );
  }

  // Ordinamento
  if (filters.priceOrder) {
    filteredProducts.sort((a, b) => {
      const priceA = parseFloat(a.prezzo) || 0;
      const priceB = parseFloat(b.prezzo) || 0;
      return filters.priceOrder === "priceAsc" ? priceA - priceB : priceB - priceA;
    });
  }

  displayedProducts = [...filteredProducts];
  renderInitialProducts();
}*/

async function applyProductFilters(selectedCategories, minPrice, maxPrice) {
  try {

    const filters = {
      categoria: Array.isArray(selectedCategories) ? selectedCategories : [selectedCategories],
      prezzo_min: minPrice,
      prezzo_max: maxPrice
    };

    console.log('Sending filters:', filters);

    const response = await fetch('/api/products/filter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters)
    });

    /*const response = await fetch('/api/products/filter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoria: Array.isArray(selectedCategories) ? selectedCategories : [selectedCategories],
        prezzo_min: minPrice,
        prezzo_max: maxPrice
      })
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const filteredProducts = await response.json();
    displayProducts(filteredProducts.products);
  } catch (error) {
    console.error('Errore nell\'applicazione dei filtri:', error);
  }*/
  if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    displayedProducts = result.products || result;
    renderInitialProducts();
  } catch (error) {
    console.error('Filter error:', error);
    showError('Failed to apply filters: ' + error.message);
  }
}

//Barra di ricerca
export function updateProductGridWithSearchResults(products) {
  searchResults = products;
  applyCurrentFilters();
}

function applyCurrentFilters() {
  if (window.lastFilters) {
    applyProductFilters(window.lastFilters);
  } else {
    renderProducts(searchResults.length > 0 ? searchResults : allProducts);
  }
}

window.resetProductGrid = function() {
  displayedProducts = [...allProducts];
  window.lastFilters = {};
  window.searchResults = [];
  renderInitialProducts();
};

function applyLastFilters() {
  if (Object.keys(lastFilters).length > 0) {
    applyProductFilters(lastFilters);
  } else {
    displayedProducts = searchResults.length > 0 ? [...searchResults] : [...allProducts];
    renderInitialProducts();
  }
}

// Render iniziale
function renderInitialProducts() {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = '';
  
  const productsToShow = displayedProducts.slice(0, initialProductsCount);
  renderProductRows(productsToShow);
  setupLoadMoreButton();
}

// Render delle righe di prodotti
function renderProductRows(productsToRender) {
  const grid = document.getElementById("productGrid");
  removeLoadMoreButton();

  // Aggiungi tutte le card direttamente al grid (Flexbox si occupa del layout)
  productsToRender.forEach((product, index) => {
    const card = createProductCard(product, index);
    grid.appendChild(card);
  });
}

// Gestione del pulsante "Vedi più"
function setupLoadMoreButton() {
  const currentCount = document.querySelectorAll(".product-card").length;
  if (currentCount >= displayedProducts.length) {
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
    const currentCount = document.querySelectorAll(".product-card").length;
    const nextProducts = displayedProducts.slice(currentCount, currentCount + productsPerLoad);
    renderProductRows(nextProducts);
    setupLoadMoreButton();
  });
}

function removeLoadMoreButton() {
  const btn = document.getElementById("loadMoreBtn");
  if (btn) btn.parentElement.remove();
}

function createProductCard(product, index) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.dataset.index = index;
  
  card.innerHTML = `
    <img src="${product.immagini_url?.[0] || 'placeholder.jpg'}" alt="${product.nome}">
    <h3>${product.nome}</h3>
    <p>${parseFloat(product.prezzo).toFixed(2)} €</p>
    <p class="availability ${product.disponibilita > 0 ? '' : 'out-of-stock'}">
      ${product.disponibilita > 0 ? 'Disponibile' : 'Esaurito'}
    </p>
  `;
  
  card.addEventListener('click', () => openOverlay(index));
  return card;
}

function openOverlay(index) {
  currentProductIndex = index;
  const product = displayedProducts[currentProductIndex];

  document.body.classList.add('overlay-active');

  // Setup carousel
  const carousel = document.getElementById("overlayCarousel");
  carousel.innerHTML = "";
  
  const images = product.immagini_url?.length > 0 
    ? product.immagini_url 
    : ['placeholder.jpg', 'placeholder1.jpg', 'placeholder2.jpg', 'placeholder3.jpg', 'placeholder4.jpg'];

  images.slice(0, 5).forEach(url => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = product.nome;
    img.addEventListener('click', () => openImageModal(url));
    carousel.appendChild(img);
  });

  // Popola i dettagli
  document.getElementById("productOverlayTitle").textContent = product.nome || "Prodotto senza nome";
  document.getElementById("productOverlayDescription").innerHTML = `
    <p>${product.descrizione || "Nessuna descrizione disponibile"}</p>
    ${product.artigiano_id ? `<p><small>Venditore: ${product.artigiano_id}</small></p>` : ''}`;
  document.getElementById("productOverlayPrice").textContent = `${parseFloat(product.prezzo || 0).toFixed(2)} €`;
  document.getElementById("productOverlayAvailability").textContent =
    `Disponibilità: ${product.disponibilita > 0 ? product.disponibilita + ' pezzi' : 'Non disponibile'}`;

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartItem = cart.find(item => item.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  document.getElementById("productOverlayAvailability").textContent = product.disponibilita > 0 ? `Disponibilità: ${product.disponibilita} pezzi` : 'Non disponibile';

  document.getElementById("quantitySelectionContainer").classList.toggle("hidden", product.disponibilita <= 0);
  document.getElementById("addToCartBtn").classList.toggle("hidden", product.disponibilita <= 0);

  const inputQty = document.getElementById("quantityInput");
  inputQty.value = "1";
  inputQty.setAttribute("data-max", product.disponibilita);

  document.getElementById("productOverlay").classList.add("show");

  setupOverlayArrows();
  updateArrowVisibility();
}

function updateArrowVisibility() {
  const leftArrow = document.querySelector(".overlay-arrow.left");
  const rightArrow = document.querySelector(".overlay-arrow.right");

  leftArrow.classList.toggle("hidden", currentProductIndex <= 0);
  rightArrow.classList.toggle("hidden", currentProductIndex >= products.length - 1);
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
    
    leftArrow.classList.toggle("hidden", currentProductIndex <= 0);
    rightArrow.classList.toggle("hidden", currentProductIndex >= displayedProducts.length - 1);
  }
}

function showPreviousProduct() {
  if (currentProductIndex > 0) {
    changeQuantity(0);
    currentProductIndex--;
    openOverlay(currentProductIndex);
  }
}

function showNextProduct() {
  if (currentProductIndex < displayedProducts.length - 1) {
    changeQuantity(0);
    currentProductIndex++;
    openOverlay(currentProductIndex);
  }
}

function closeOverlay() {
  changeQuantity(0);
  document.getElementById("productOverlay").classList.remove("show");
  document.body.classList.remove('overlay-active');
}


document.querySelector('.close-btn')?.addEventListener('click', function(e) {
  e.stopPropagation(); // Impedisce la chiusura quando si clicca sul prodotto
  closeOverlay();
});

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

function showMessage(message) {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = `<p class="info-message">${message}</p>`;
}

function showError(message) {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = `<p class="error-message">${message}</p>`;
}

window.applyProductFilters = applyProductFilters;

window.updateProductGrid = updateProductGridWithSearchResults;

/*window.updateProductGrid = function(filteredProducts) {
  // Converti i dati se necessario (aggiungi questo blocco)
  displayedProducts = filteredProducts.map(product => ({
    ...product,
    // Assicura che i campi siano nel formato corretto
    categoria_id: product.categoria_id || product.categoria,
    immagini_url: product.immagini_url || [product.immagine_url || 'placeholder.jpg'],
    disponibilita: product.disponibilita || product.stock || 0
  }));
  
  renderInitialProducts();
}*/

// Event listeners
document.getElementById("productOverlay").addEventListener("click", function(event) {
  if (!event.target.closest(".overlay-content") && !event.target.classList.contains("overlay-arrow")) {
    closeOverlay();
  }
});

//export { loadProducts, applyProductFilters, updateProductGridWithSearchResults };

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  
  // Setup overlay arrows
  document.querySelectorAll('.overlay-arrow').forEach(arrow => {
    arrow.style.display = 'block';
  });
  
});

window.updateProductGridWithSearchResults = function(products) {
    displayedProducts = products;
    renderInitialProducts();
};

window.lastFilters = {};
window.searchResults = [];
window.isSearchActive = false;