let currentSearchTerm = "";
let isSearchActive = false;
isLoading = false;
const grid = document.getElementById("productGrid");

/**
 * Esegue la ricerca dei prodotti
 * @param {string} searchTerm - Termine da cercare
 */
async function executeSearch(searchTerm) {
  if (isLoading) return;

  try {
    isLoading = true;
    currentSearchTerm = searchTerm.trim();
    isSearchActive = currentSearchTerm.length > 0;

    toggleSearchLoading(true);
    if (currentSearchTerm.length === 0) {

      window.isSearchActive = false;
      window.searchResults = [];
      window.displayedProducts = [];
      window.lastSearchTerm = "";

      loadProducts(); // Ricarica i prodotti iniziali
      return;
    }

    const response = await fetch(
      `http://localhost:3000/api/search?q=${encodeURIComponent(currentSearchTerm)}`,
    );

    console.log("response:", response);

    if (!response.ok) {
      // Gestisci diversi codici di stato
      let message;
      if (response.status === 404) {
        message = "Nessun prodotto trovato per la ricerca.";
      } else if (response.status >= 500) {
        message = "Errore del server. Riprova più tardi.";
      } else {
        message = "Errore durante la ricerca. Riprova.";
      }
      
      // Aggiorna le variabili globali per indicare ricerca vuota
      window.isSearchActive = isSearchActive;
      window.searchResults = [];
      window.displayedProducts = [];
      window.lastSearchTerm = currentSearchTerm;
      
      // Mostra il messaggio nel grid
      grid.innerHTML = `<p class='info-message'>${message}</p>`;
      
      // Esci dalla funzione senza fare throw
      return;
    }

    const apiResponse = await response.json();
    if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
      throw new Error(
        "Formato della risposta API non valido: array 'data' non trovato",
      );
    }
    
    const searchResults = apiResponse.data;
    console.log("Search results:", searchResults);

    // Aggiorna le variabili globali
    window.isSearchActive = isSearchActive;
    window.searchResults = searchResults;
    window.displayedProducts = searchResults;
    window.lastSearchTerm = currentSearchTerm;

    // Pulisci il grid e renderizza i nuovi risultati
    grid.innerHTML = "";
    
    if (searchResults.length === 0) {
      grid.innerHTML = "<p class='info-message'>Nessun prodotto corrisponde alla ricerca.</p>";
    } else {
      renderProductRows(searchResults);
      
      // Ri-applica i filtri se presenti
      if (window.lastFilters && Object.keys(window.lastFilters).length > 0) {
        console.log("Ri-applico filtri attivi:", window.lastFilters);
        setTimeout(() => {
          if (window.applyProductFilters) {
            window.applyProductFilters(window.lastFilters, searchResults);
          }
        }, 100);
      }
    }

  } catch (error) {
    console.error("Search error:", error);
    
    // Solo per errori reali (non per response.ok = false)
    const errorMessage = "Errore tecnico durante la ricerca. Riprova più tardi.";
    grid.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;

    // Reset dello stato in caso di errore
    window.isSearchActive = false;
    window.searchResults = [];
    window.displayedProducts = [];
    
  } finally {
    isLoading = false;
    toggleSearchLoading(false);
  }
}

/**
 * Resetta la ricerca e mostra tutti i prodotti
 */
async function resetSearch() {
  if (!isSearchActive) return;

  currentSearchTerm = "";
  isSearchActive = false;

  // Resetta il campo di input
  const searchInput = document.querySelector('.search-form input[name="q"]');
  if (searchInput) searchInput.value = "";
}

function setupSearchClear() {
  const searchInput = document.querySelector('.search-form input[name="q"]');
  if (!searchInput) return;

  searchInput.addEventListener("search", async (e) => {
    if (e.target.value === "") {
      await resetSearch();
    }
  });
}

function initSearch() {
  const searchForm = document.querySelector(".search-form");

  if (!searchForm) return;

  // Setup del pulsante clear
  setupSearchClear();

  if (searchForm) {
    searchForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const searchTerm = searchForm
        .querySelector('input[name="q"]')
        .value.trim();
      await executeSearch(searchTerm);
    });

    // Setup della ricerca tradizionale (invece di setupLiveSearch)
    setupTraditionalSearch();
  }
}

function setupTraditionalSearch() {
  const searchInput = document.querySelector('.search-form input[name="q"]');
  if (!searchInput) return;

  // Aggiungi solo il feedback visivo durante la digitazione
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim();
    const searchButton = document.querySelector(".search-button");
  });
}

/**
 * Mostra/nasconde l'indicatore di caricamento
 */
function toggleSearchLoading(isLoading) {
  const searchButton = document.querySelector(".search-button");
  if (!searchButton) return;

  if (isLoading) {
    searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cerca';
    searchButton.disabled = true;
  } else {
    searchButton.innerHTML = '<i class="fas fa-search"></i> Cerca';
    searchButton.disabled = false;
  }
}

/**
 * Mostra un messaggio di errore
 */
function showErrorMessage(message) {
  const grid = document.getElementById("productGrid");
  if (grid) {
    grid.innerHTML = `<div class="alert alert-danger">${message}</div>`;
  }
}

// Inizializza la ricerca quando il DOM è pronto
document.addEventListener("DOMContentLoaded", initSearch);
