document.addEventListener("DOMContentLoaded", function() {
  // Elementi UI
  const filterToggle = document.getElementById("filterToggle");
  const filterSidebar = document.getElementById("filterSidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const closeFilters = document.getElementById("closeFilters");
  const applyFilters = document.getElementById("applyFilters");
  const resetFilters = document.getElementById("resetFilters");

  // Gestione apertura/chiusura sidebar
  filterToggle.addEventListener("click", toggleSidebar);
  sidebarOverlay.addEventListener("click", closeSidebar);
  closeFilters.addEventListener("click", closeSidebar);

  function toggleSidebar() {
    const isOpening = !filterSidebar.classList.contains("active");
    
    filterSidebar.classList.toggle("active", isOpening);
    sidebarOverlay.classList.toggle("active", isOpening);
    document.body.classList.toggle("sidebar-open", isOpening);
    document.body.classList.toggle("overlay-active", isOpening);
  }

  function closeSidebar() {
    filterSidebar.classList.remove("active");
    sidebarOverlay.classList.remove("active");
    document.body.classList.remove("sidebar-open");
    document.body.classList.remove("overlay-active");
  }

  // Gestione filtri
  applyFilters.addEventListener("click", applyFiltersHandler);
  resetFilters.addEventListener("click", resetFiltersHandler);

  // Funzione di supporto per conversione prezzi
  function parsePriceInput(priceValue) {
  if (!priceValue) return null;
  
  // Converte virgola in punto e rimuove tutto tranne numeri e punto
  const sanitized = String(priceValue)
    .replace(',', '.')
    .replace(/[^0-9.]/g, '');

  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? null : Math.abs(parsed); // Math.abs() per sicurezza


}

  /*function getSelectedFilters() {
    const categoryCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"][id^="cat-"]:checked');
    const categories = Array.from(categoryCheckboxes).map(cb =>{
        const rawValue = cb.value || cb.id.replace('cat-', '');
        return rawValue.toLowerCase();
      } 
    );

    const uniqueCategories = [...new Set(categories)];

    return {
      categories: uniqueCategories, 
      minPrice: parsePriceInput(document.getElementById("minPrice").value),
      maxPrice: parsePriceInput(document.getElementById("maxPrice").value),
      priceOrder: document.querySelector(".price-order .active")?.id || null,
      availableOnly: document.getElementById("availableOnly").checked
    };
  }*/

    function getSelectedFilters() {
  const categoryCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"][id^="cat-"]:checked');
  const categories = Array.from(categoryCheckboxes).map(cb => cb.value.toLowerCase());
  
  const priceOrder = document.querySelector(".price-order .active")?.id || null;
  const availableOnly = document.getElementById("availableOnly").checked;

  return {
    categories: categories.length > 0 ? categories : null,
    minPrice: parsePriceInput(document.getElementById("minPrice").value),
    maxPrice: parsePriceInput(document.getElementById("maxPrice").value),
    availableOnly: availableOnly,
    priceOrder: priceOrder
  };
}

  /*async function applyFiltersHandler() {
  const filters = getSelectedFilters();
  console.log("Filtri applicati:", filters);

  // Aggiungi questa parte mancante: validazione degli input
  const validation = validatePriceInputs(filters.minPrice, filters.maxPrice);
  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  try {
    // Salva i filtri per uso futuro
    window.lastFilters = filters;
    
    // Se abbiamo risultati di ricerca, filtra quelli
    const sourceProducts = window.searchResults?.length > 0 ? window.searchResults : null;
    
    if (window.applyProductFilters) {
      window.applyProductFilters(filters, sourceProducts);
    }
  } catch (error) {
    console.error("Errore applicazione filtri:", error);
    // Fallback lato client
    if (window.applyProductFilters) {
      window.applyProductFilters(filters, sourceProducts);
    }
  }
  closeSidebar();
}*/

async function applyFiltersHandler() {
  const filters = getSelectedFilters();
  console.log("Filtri prima della validazione:", filters);

  const validation = validatePriceInputs(filters.minPrice, filters.maxPrice);
  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  console.log("Filtri dopo validazione:", filters); // Debug
  
  // Verifica se applyProductFilters esiste
  if (typeof window.applyProductFilters !== 'function') {
    console.error("applyProductFilters non è una funzione!");
    return;
  }

  // Verifica i prodotti disponibili
  console.log("All products:", window.allProducts);
  console.log("Displayed products:", window.displayedProducts);

  window.applyProductFilters(filters);
  closeSidebar();
}

  // Sostituisci la virgola con il punto per i decimali
  function parsePriceInput(priceValue) {
    if (!priceValue) return null;
    const normalizedValue = String(priceValue)
      .replace(',', '.')
      .replace(/[^\d.-]/g, ''); // Rimuovi caratteri non numerici
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? null : parsed;
  }

  function shouldUseServerFiltering(filters) {
    return filters.categories.length > 0 || 
           filters.minPrice !== null || 
           filters.maxPrice !== null ||
           filters.priceOrder;
  }

  function validatePriceInputs(minPrice, maxPrice) {
    const minInput = document.getElementById('minPrice');
    const maxInput = document.getElementById('maxPrice');

    // Resetta gli errori precedenti
    clearInputError(minInput);
    clearInputError(maxInput);

    // Validazioni...
    if (minPrice !== null && minPrice < 0) {
      showInputError(minInput, "Il prezzo minimo non può essere negativo");
      return { valid: false };
    }

    if (maxPrice !== null && maxPrice < 0) {
      showInputError(maxInput, "Il prezzo massimo non può essere negativo");
      return { valid: false };
    }

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      showInputError(minInput, "Il minimo deve essere ≤ al massimo");
      showInputError(maxInput, "Il massimo deve essere ≥ al minimo");
      return { valid: false };
    }

    return { valid: true };
  }

  function validatePriceInputsLive() {
  const minInput = document.getElementById('minPrice');
  const maxInput = document.getElementById('maxPrice');

  // Pulizia live: sostituisci virgole e rimuovi caratteri non numerici
  minInput.value = minInput.value.replace(',', '.').replace(/[^0-9.]/g, '');
  maxInput.value = maxInput.value.replace(',', '.').replace(/[^0-9.]/g, '');

  // Validazione prezzi (min <= max)
  const minPrice = parsePriceInput(minInput.value);
  const maxPrice = parsePriceInput(maxInput.value);

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    showInputError(minInput, "Il prezzo minimo non può superare il massimo");
    showInputError(maxInput, "Il prezzo massimo non può essere inferiore al minimo");
    return false;
  }

  clearInputError(minInput);
  clearInputError(maxInput);
  return true;
}

document.getElementById('minPrice').addEventListener('paste', (e) => {
  const pastedText = (e.clipboardData || window.clipboardData).getData('text');
  if (/[^0-9.,]/.test(pastedText)) {
    e.preventDefault(); // Blocca l'incollamento se contiene caratteri non numerici
  }
});

  // Listener per la validazione in tempo reale
  document.getElementById('minPrice')?.addEventListener('input', validatePriceInputsLive);
  document.getElementById('maxPrice')?.addEventListener('input', validatePriceInputsLive);

  // Mostra errore e evidenzia l'input
function showInputError(inputElement, message) {
  const errorElement = inputElement.nextElementSibling;
  
  // Se non esiste un elemento per il messaggio, crealo
  if (!errorElement || !errorElement.classList.contains('error-message')) {
    const newErrorElement = document.createElement('div');
    newErrorElement.className = 'error-message';
    inputElement.parentNode.insertBefore(newErrorElement, inputElement.nextSibling);
  }

  // Aggiorna stile e messaggio
  inputElement.classList.add('input-error');
  inputElement.nextElementSibling.textContent = message;
  inputElement.nextElementSibling.style.display = 'block';
}

// Ripristina lo stato normale
function clearInputError(inputElement) {
  inputElement.classList.remove('input-error');
  const errorElement = inputElement.nextElementSibling;
  if (errorElement && errorElement.classList.contains('error-message')) {
    errorElement.style.display = 'none';
  }
}

  function resetFiltersHandler() {
    resetAllFilters();
    window.lastFilters = {};
    if (window.resetProductGrid) {
      window.resetProductGrid();
    }
  }

  function resetAllFilters() {
    document.querySelectorAll(".filter-group input").forEach((input) => {
      if (input.type === "checkbox") {
        input.checked = false;
      } else {
        input.value = "";
      }
    });

    document.querySelectorAll(".price-order button").forEach((btn) => {
      btn.classList.remove("active");
    });
  }

  // Gestione ordinamento prezzo
  document.getElementById("priceAsc")?.addEventListener("click", function() {
    this.classList.add("active");
    document.getElementById("priceDesc")?.classList.remove("active");
  });

  document.getElementById("priceDesc")?.addEventListener("click", function() {
    this.classList.add("active");
    document.getElementById("priceAsc")?.classList.remove("active");
  });

  /*async function applyServerSideFilters(filters) {
    try {
      const payload = {
        ...filters,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice
      };

      console.log("Invio filtri al server:", payload);

      const response = await fetch('/api/products/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error("Errore nel filtro server-side");
      
      const filteredProducts = await response.json();
      
      if (window.updateProductGrid) {
        window.updateProductGrid(filteredProducts);
      } else {
        applyClientSideFilters(filters);
      }
    } catch (error) {
      console.error("Errore filtro server-side:", error);
      applyClientSideFilters(filters);
    }
  }

  function applyClientSideFilters(filters) {
    const products = document.querySelectorAll(".product-card");
    const productGrid = document.getElementById("productGrid");
    
    if (!products.length || !productGrid) {
      console.error("Elementi prodotti non trovati");
      return;
    }

    let visibleProducts = [];

    products.forEach((product) => {
      try {
        const productData = JSON.parse(product.dataset.product);
        let shouldShow = true;

        // Filtro categorie
        if (filters.categories?.length > 0) {
          const productCategory = String(productData.categoria_id || productData.categoria || "");
          shouldShow = shouldShow && filters.categories.some(cat => 
            String(cat) === productCategory
          );
        }

        // Filtro prezzo (conversione robusta)
        const productPrice = parsePriceInput(productData.prezzo) || 0;
        
        if (filters.minPrice !== null) {
          shouldShow = shouldShow && (productPrice >= filters.minPrice);
        }
        if (filters.maxPrice !== null) {
          shouldShow = shouldShow && (productPrice <= filters.maxPrice);
        }

        // Filtro disponibilità
        if (filters.availableOnly) {
          shouldShow = shouldShow && (Number(productData.disponibilita) > 0);
        }

        if (shouldShow) {
          product.style.display = "block";
          visibleProducts.push(product);
        } else {
          product.style.display = "none";
        }
      } catch (e) {
        console.error("Errore nel processare prodotto:", product, e);
      }
    });

    // Ordinamento
    if (filters.priceOrder && visibleProducts.length > 0) {
      visibleProducts.sort((a, b) => {
        try {
          const priceA = parsePriceInput(JSON.parse(a.dataset.product).prezzo) || 0;
          const priceB = parsePriceInput(JSON.parse(b.dataset.product).prezzo) || 0;
          return filters.priceOrder === "priceAsc" ? priceA - priceB : priceB - priceA;
        } catch (e) {
          return 0;
        }
      });

      // Riordina nel DOM
      visibleProducts.forEach(product => productGrid.appendChild(product));
    }
  }*/

 function initCategories() {
    console.log("Inizializzazione categorie...");
    const container = document.getElementById('categories-container');
    
    if (container) {
        console.log("Container trovato, carico le categorie");
        loadCategories();
    } else {
        console.log("Container non trovato, attendo con MutationObserver...");
        const observer = new MutationObserver((mutations) => {
            const container = document.getElementById('categories-container');
            if (container) {
                console.log("Container finalmente trovato!");
                loadCategories();
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });

        // Timeout di sicurezza
        setTimeout(() => {
            observer.disconnect();
            const container = document.getElementById('categories-container');
            if (container) {
                loadCategories();
            } else {
                console.error("Timeout: categories-container non trovato dopo 5 secondi");
            }
        }, 5000);
    }
}

async function loadCategories() {
    try {
        console.log("Caricamento categorie in corso...");
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Errore API');
        const categories = await response.json();
        console.log("Categorie ricevute:", categories);
        populateCategories(categories);
    } catch (err) {
        console.error("Errore caricamento categorie:", err);
        populateCategories(['Arredamento', 'Gioielli', 'Abbigliamento']); // Fallback
    }
}

function populateCategories(categories) {
    const container = document.getElementById('categories-container');
    const toggleBtn = document.getElementById('toggle-categories');
    const maxVisible = 12;

    if (!container) {
        console.error("ERRORE: categories-container non trovato!");
        return;
    }

    // Pulisci il container
    container.innerHTML = '';
    
    // Crea un wrapper per le categorie
    const categoriesWrapper = document.createElement('div');
    categoriesWrapper.className = 'categories-wrapper';
    
    categories.forEach((cat, index) => {
        const id = `cat-${cat.toLowerCase().replace(/\s+/g, '-')}`;
        const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
        const isHidden = index >= maxVisible ? 'hidden-category' : '';

        categoriesWrapper.innerHTML += `
        <div class="form-check ${isHidden}">
            <input class="form-check-input" type="checkbox" id="${id}" value="${cat}">
            <label class="form-check-label" for="${id}">${displayName}</label>
        </div>
        `;
    });
    
    // Aggiungi il wrapper al container
    container.appendChild(categoriesWrapper);

    if (toggleBtn) {
        toggleBtn.style.display = categories.length > maxVisible ? 'block' : 'none';
        toggleBtn.textContent = 'Mostra più...';
        toggleBtn.onclick = toggleCategories;
    }
}

function toggleCategories() {
    const container = document.getElementById('categories-container');
    const toggleBtn = document.getElementById('toggle-categories');
    
    if (!container || !toggleBtn) return;
    
    // Alterna la classe 'show-all' sul container
    container.classList.toggle('show-all');
    
    // Cambia il testo del pulsante
    toggleBtn.textContent = container.classList.contains('show-all') 
        ? 'Mostra meno...' 
        : 'Mostra più...';
}
  // Inizializza categorie al caricamento della pagina
  initCategories();
});