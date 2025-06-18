import { updateProductGridWithSearchResults, loadProducts } from './productsDisplay.js';

// Variabili di stato
let currentSearchTerm = '';
let isSearchActive = false;
let isLoading = false;

/**
 * Esegue la ricerca dei prodotti
 * @param {string} searchTerm - Termine da cercare
*/
export async function executeSearch(searchTerm) {
    if (isLoading) return;
    
    try {
        isLoading = true;
        currentSearchTerm = searchTerm.trim();
        isSearchActive = currentSearchTerm.length > 0;

        toggleSearchLoading(true);

        
        const response = await fetch(`/api/search?q=${encodeURIComponent(currentSearchTerm)}`);
        
        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}`);
        }
        
        const searchResults = await response.json();
        
        
        const normalizedResults = searchResults.map(product => {
            
            const price = parseFloat(product.prezzo) || 0;
            const availability = parseInt(product.disponibilita) || 0;
            
            // Gestione immagini (supporta sia string che array)
            let images = [];
            if (Array.isArray(product.immagini_url)) {
                images = product.immagini_url.filter(url => url);
            } else if (product.immagine_url) {
                images = [product.immagine_url];
            }
            if (images.length === 0) images = ['placeholder.jpg'];

            return {
                id: product.id,
                nome: product.nome || "Senza nome",
                descrizione: product.descrizione || "Nessuna descrizione disponibile",
                prezzo: price,
                categoria_id: product.categoria_id || product.categoria || null,
                immagini_url: images,
                disponibilita: availability,
                artigiano_id: product.artigiano_id || null,
                ...product // Mantieni le proprietà aggiuntive
            };
        });

        
        window.isSearchActive = isSearchActive;
        window.searchResults = normalizedResults;
        window.lastSearchTerm = currentSearchTerm;

        
        if (window.updateProductGridWithSearchResults) {
            window.updateProductGridWithSearchResults(normalizedResults);
            
            // Ri-applica i filtri se presenti
            if (window.lastFilters && Object.keys(window.lastFilters).length > 0) {
                console.log("Ri-applico filtri attivi:", window.lastFilters);
                setTimeout(() => {
                window.applyProductFilters(window.lastFilters, normalizedResults);
            }, 100);
        }
}

    } catch (error) {
        console.error('Search error:', error);
        showErrorMessage('Ricerca fallita. Riprova più tardi.');
        
        // Reset dello stato in caso di errore
        window.isSearchActive = false;
        window.searchResults = [];
        if (window.resetProductGrid) {
            window.resetProductGrid();
        }
    } finally {
        isLoading = false;
        toggleSearchLoading(false);
    }
}

/**
 * Resetta la ricerca e mostra tutti i prodotti
 */
export async function resetSearch() {
    if (!isSearchActive) return;
    
    currentSearchTerm = '';
    isSearchActive = false;
    
    // Resetta il campo di input
    const searchInput = document.querySelector('.search-form input[name="q"]');
    if (searchInput) searchInput.value = '';
    
    // Ricarica i prodotti normalmente
    await loadProducts();
}

function setupSearchClear() {
    const searchInput = document.querySelector('.search-form input[name="q"]');
    if (!searchInput) return;

    searchInput.addEventListener('search', async (e) => {
        if (e.target.value === '') {
            await resetSearch();
        }
    });
}
 
function initSearch() {
    const searchForm = document.querySelector('.search-form');

    if (!searchForm) return;

    // Setup del pulsante clear
    setupSearchClear();

    if (searchForm) {
        // Sostituisci l'evento submit esistente con questa versione migliorata
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const searchTerm = searchForm.querySelector('input[name="q"]').value.trim();
            
            if (searchTerm.length >= 3) {
                await executeSearch(searchTerm);
            } else if (searchTerm.length === 0 && isSearchActive) {
                await resetSearch();
            } else {
                showErrorMessage('Inserisci almeno 3 caratteri per la ricerca');
            }
        });

        // Setup della ricerca tradizionale (invece di setupLiveSearch)
        setupTraditionalSearch();
    }
}


function setupTraditionalSearch() {
    const searchInput = document.querySelector('.search-form input[name="q"]');
    if (!searchInput) return;

    // Rimuovi l'event listener per l'input (ricerca live)
    //searchInput.removeEventListener('input', handleLiveSearch);

    // Aggiungi solo il feedback visivo durante la digitazione
    searchInput.addEventListener('input', () => {
        const term = searchInput.value.trim();
        const searchButton = document.querySelector('.search-button');
        
        // Abilita/disabilita il pulsante in base alla lunghezza del testo
        if (searchButton) {
            searchButton.disabled = term.length < 3;
        }
    });
}

/**
 * Mostra/nasconde l'indicatore di caricamento
 */
function toggleSearchLoading(isLoading) {
    const searchButton = document.querySelector('.search-button');
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
document.addEventListener('DOMContentLoaded', initSearch);