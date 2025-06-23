document.addEventListener("DOMContentLoaded", function() {
    // ============================================================================
    // ELEMENTI UI E VERIFICHE SICUREZZA
    // ============================================================================
    const filterToggle = document.getElementById("filterToggle");
    const filterSidebar = document.getElementById("filterSidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const closeFilters = document.getElementById("closeFilters");
    const applyFilters = document.getElementById("applyFilters");
    const resetFilters = document.getElementById("resetFilters");

    // Verifica che gli elementi essenziali esistano
    if (!filterToggle || !filterSidebar) {
        console.error('Elementi filtri essenziali non trovati nel DOM');
        return;
    }

    // ============================================================================
    // GESTIONE SIDEBAR
    // ============================================================================
    filterToggle.addEventListener("click", toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);
    if (closeFilters) closeFilters.addEventListener("click", closeSidebar);

    function toggleSidebar() {
        const isOpening = !filterSidebar.classList.contains("active");
        filterSidebar.classList.toggle("active", isOpening);
        if (sidebarOverlay) sidebarOverlay.classList.toggle("active", isOpening);
        document.body.classList.toggle("sidebar-open", isOpening);
        document.body.classList.toggle("overlay-active", isOpening);
    }

    function closeSidebar() {
        filterSidebar.classList.remove("active");
        if (sidebarOverlay) sidebarOverlay.classList.remove("active");
        document.body.classList.remove("sidebar-open");
        document.body.classList.remove("overlay-active");
    }

    // ============================================================================
    // CONFIGURAZIONE GLOBALE
    // ============================================================================
    const FILTER_CONFIG = {
        MAX_PRODUCTS_CLIENT_SIDE: 1000,
        PRODUCTS_PER_PAGE: 20
    };

    const CATEGORY_CONFIG = {
        INITIAL_VISIBLE: 6,
        SHOW_ALL: false
    };

    // Categorie di default con fallback robusto
    const DEFAULT_CATEGORIES = [
        { id: "ceramica", name: "Ceramica e Terracotta", icon: "fas fa-vase", color: "#8B4513" },
        { id: "tessuti", name: "Tessuti e Ricami", icon: "fas fa-cut", color: "#9932CC" },
        { id: "legno", name: "Lavorazione del Legno", icon: "fas fa-tree", color: "#228B22" },
        { id: "gioielli", name: "Gioielli e Oreficeria", icon: "fas fa-gem", color: "#FFD700" },
        { id: "metalli", name: "Lavorazione Metalli", icon: "fas fa-hammer", color: "#C0C0C0" },
        { id: "vetro", name: "Arte del Vetro", icon: "fas fa-wine-glass", color: "#87CEEB" },
        { id: "cuoio", name: "Pelletteria", icon: "fas fa-shoe-prints", color: "#8B4513" },
        { id: "cartoleria", name: "Cartoleria Artistica", icon: "fas fa-palette", color: "#FF6347" }
    ];

    // ============================================================================
    // VARIABILI GLOBALI
    // ============================================================================
    let categoriesData = [...DEFAULT_CATEGORIES];
    let filterMode = 'auto'; // 'client', 'server', 'auto'
    let totalProductsCount = 0;
    let filterTimeout;

    // ============================================================================
    // GESTIONE CATEGORIE
    // ============================================================================
    async function loadCategories() {
        try {
            const response = await fetch('/categorie.json');
            if (response.ok) {
                const data = await response.json();
                categoriesData = data.categories || DEFAULT_CATEGORIES;
                //console.log('Categorie caricate da file:', categoriesData.length);
                //console.log("cat:", categoriesData[0]);
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.log('Usando categorie di default:', error.message);
            categoriesData = DEFAULT_CATEGORIES;
        }
        
        renderCategoriesFilter();
    }

    function renderCategoriesFilter() {
        const container = document.getElementById('categories-container');
        const toggleButton = document.getElementById('toggle-categories');
        
        if (!container) {
            console.error('Container categorie non trovato');
            return;
        }
        
        container.innerHTML = '';
        
        // Determina quante categorie mostrare
        const categoriesToShow = CATEGORY_CONFIG.SHOW_ALL 
            ? categoriesData 
            : categoriesData.slice(0, CATEGORY_CONFIG.INITIAL_VISIBLE);
        
        // Crea checkbox per ogni categoria
        categoriesToShow.forEach(category => {
            const categoryElement = createCategoryCheckbox(category);
            container.appendChild(categoryElement);
        });
        
        // Aggiorna il pulsante toggle
        if (toggleButton) {
            updateToggleButton();
        }
        
        // Aggiungi event listener ai checkbox
        setupCategoryEventListeners();
    }

    function createCategoryCheckbox(category) {
        const div = document.createElement('div');
        div.className = 'form-check category-item';
        div.innerHTML = `
            <input class="form-check-input" type="checkbox" id="cat-${category.id}" value="${category.id}">
            <label class="form-check-label category-label" for="cat-${category.id}">
                <i class="${category.icon}" style="color: ${category.color}; margin-right: 8px;"></i>
                ${category.name}
            </label>
        `;
        return div;
    }

    function updateToggleButton() {
        const toggleButton = document.getElementById('toggle-categories');
        if (!toggleButton) return;
        
        const hasMoreCategories = categoriesData.length > CATEGORY_CONFIG.INITIAL_VISIBLE;
        
        if (!hasMoreCategories) {
            toggleButton.style.display = 'none';
            return;
        }
        
        toggleButton.style.display = 'block';
        toggleButton.textContent = CATEGORY_CONFIG.SHOW_ALL ? 'Mostra meno...' : 'Mostra più...';
        toggleButton.onclick = toggleCategoriesVisibility;
    }

    function toggleCategoriesVisibility() {
        CATEGORY_CONFIG.SHOW_ALL = !CATEGORY_CONFIG.SHOW_ALL;
        
        // Salva lo stato dei checkbox selezionati prima del re-render
        const selectedCategories = getSelectedCategories();
        
        renderCategoriesFilter();
        
        // Ripristina le selezioni
        restoreSelectedCategories(selectedCategories);
    }

    function setupCategoryEventListeners() {
        const checkboxes = document.querySelectorAll('#categories-container input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateSelectedCategoriesCount();
                
                // Auto-apply opzionale
                if (shouldAutoApplyFilters()) {
                    debounceFilterApplication();
                }
            });
        });
    }

    // ============================================================================
    // FUNZIONI UTILITY CATEGORIE
    // ============================================================================
    function getSelectedCategories() {
        const checkboxes = document.querySelectorAll('#categories-container input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    function restoreSelectedCategories(selectedIds) {
        selectedIds.forEach(id => {
            const checkbox = document.getElementById(`cat-${id}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }

    function updateSelectedCategoriesCount() {
        const selectedCount = getSelectedCategories().length;
        const filterGroupTitle = document.querySelector('.filter-group h6');
        
        if (filterGroupTitle && filterGroupTitle.textContent.includes('Categorie')) {
            const baseText = 'Categorie';
            filterGroupTitle.textContent = selectedCount > 0 
                ? `${baseText} (${selectedCount})` 
                : baseText;
        }
    }

    // ============================================================================
    // GESTIONE FILTRI E VALIDAZIONE
    // ============================================================================
    function parsePriceInput(priceValue) {
        if (!priceValue) return null;
        const sanitized = String(priceValue)
            .replace(',', '.')
            .replace(/[^0-9.]/g, '');
        const parsed = parseFloat(sanitized);
        return isNaN(parsed) ? null : Math.abs(parsed);
    }

    function getSelectedFilters() {
        const categoryCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"][id^="cat-"]:checked');
        const categories = Array.from(categoryCheckboxes).map(cb => cb.value.toLowerCase());

        const priceOrder = document.querySelector(".price-order .active")?.id || null;
        const availableOnly = document.getElementById("availableOnly")?.checked || false;

        return {
            categories: categories.length > 0 ? categories : null,
            minPrice: parsePriceInput(document.getElementById("minPrice")?.value),
            maxPrice: parsePriceInput(document.getElementById("maxPrice")?.value),
            availableOnly: availableOnly,
            priceOrder: priceOrder
        };
    }

    function validatePriceInputs(minPrice, maxPrice) {
        const minInput = document.getElementById('minPrice');
        const maxInput = document.getElementById('maxPrice');

        if (!minInput || !maxInput) {
            return { valid: true };
        }

        // Resetta gli errori precedenti
        clearInputError(minInput);
        clearInputError(maxInput);

        // Validazioni
        if (minPrice !== null && minPrice < 0) {
            showInputError(minInput, "Il prezzo minimo non può essere negativo");
            return { valid: false, error: "Il prezzo minimo non può essere negativo" };
        }

        if (maxPrice !== null && maxPrice < 0) {
            showInputError(maxInput, "Il prezzo massimo non può essere negativo");
            return { valid: false, error: "Il prezzo massimo non può essere negativo" };
        }

        if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
            showInputError(minInput, "Il minimo deve essere ≤ al massimo");
            showInputError(maxInput, "Il massimo deve essere ≥ al minimo");
            return { valid: false, error: "Il prezzo minimo deve essere minore o uguale al massimo" };
        }

        return { valid: true };
    }

    function validatePriceInputsLive() {
        const minInput = document.getElementById('minPrice');
        const maxInput = document.getElementById('maxPrice');
        
        if (!minInput || !maxInput) return true;

        // Pulizia live
        minInput.value = minInput.value.replace(',', '.').replace(/[^0-9.]/g, '');
        maxInput.value = maxInput.value.replace(',', '.').replace(/[^0-9.]/g, '');

        // Validazione prezzi
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

    // ============================================================================
    // GESTIONE ERRORI UI
    // ============================================================================
    function showInputError(inputElement, message) {
        const errorElement = inputElement.nextElementSibling;

        if (!errorElement || !errorElement.classList.contains('error-message')) {
            const newErrorElement = document.createElement('div');
            newErrorElement.className = 'error-message';
            inputElement.parentNode.insertBefore(newErrorElement, inputElement.nextSibling);
        }

        inputElement.classList.add('input-error');
        inputElement.nextElementSibling.textContent = message;
        inputElement.nextElementSibling.style.display = 'block';
    }

    function clearInputError(inputElement) {
        inputElement.classList.remove('input-error');
        const errorElement = inputElement.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.style.display = 'none';
        }
    }

    // ============================================================================
    // SISTEMA FILTRI INTELLIGENTE
    // ============================================================================
    async function determineFilterMode() {
        try {
            const response = await fetch('http://localhost:3000/api/products?limit=1&count=true');
            const data = await response.json();
            totalProductsCount = data.total || 0;
            
            filterMode = totalProductsCount <= FILTER_CONFIG.MAX_PRODUCTS_CLIENT_SIDE ? 'client' : 'server';
            //console.log(`Modalità filtri determinata automaticamente: ${filterMode} (${totalProductsCount} prodotti)`);
        } catch (error) {
            console.error('Errore nel determinare modalità filtri:', error);
            filterMode = 'server'; // Fallback sicuro
        }
    }

    async function applyProductFilters(filters) {
        //console.log(`Applicando filtri in modalità: ${filterMode}`, filters);
        window.lastFilters = filters;
        
        // Determina la modalità se è 'auto'
        if (filterMode === 'auto') {
            await determineFilterMode();
        }
        
        if (filterMode === 'client') {
            applyClientSideFilters(filters);
        } else {
            await applyServerSideFilters(filters);
        }
    }

    function applyClientSideFilters(filters) {
        let baseProducts = window.searchResults && window.searchResults.length > 0 
            ? [...window.searchResults] 
            : [...(window.allProducts || [])];
            
        if (baseProducts.length === 0) {
            console.warn('Nessun prodotto disponibile per i filtri client-side');
            window.displayedProducts = [];
            if (window.renderInitialProducts) window.renderInitialProducts();
            return;
        }

        let filtered = [...baseProducts];
        
        // Filtro per categoria
        if (filters.categories && filters.categories.length > 0) {
            filtered = filtered.filter(product => 
                filters.categories.includes(product.prodotto.categoria?.toLowerCase())
            );
        }
        
        // Filtro per prezzo minimo
        if (filters.minPrice !== null && filters.minPrice !== undefined) {
            filtered = filtered.filter(product => 
                parseFloat(product.prodotto.prezzo) >= filters.minPrice
            );
        }
        
        // Filtro per prezzo massimo
        if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
            filtered = filtered.filter(product => 
                parseFloat(product.prodotto.prezzo) <= filters.maxPrice
            );
        }
        
        // Filtro disponibilità
        if (filters.availableOnly) {
            filtered = filtered.filter(product => 
                product.prodotto.disponibilita > 0
            );
        }
        
        // Ordinamento
        if (filters.priceOrder) {
            filtered = filtered.sort((a, b) => {
                const priceA = parseFloat(a.prodotto.prezzo);
                const priceB = parseFloat(b.prodotto.prezzo);
                
                return filters.priceOrder === "priceAsc" ? priceA - priceB : priceB - priceA;
            });
        }
        
        window.displayedProducts = filtered;
        
        if (window.renderInitialProducts) {
            window.renderInitialProducts();
        }

        const totalCount = baseProducts.length;
        let message = ``;
        if (filtered.length > 1) {
            message = `${filtered.length} prodotti trovati`;
        }else if (filtered.length == 1) {
            message = `${filtered.length} prodotto trovato`;
        } else {
            message = `Nessun prodotto trovato`;
        }
        showFilterResults(message);
        
        if (filtered.length === 0) {
            showNoProductsMessage(filters);
        }
    }

    async function applyServerSideFilters(filters) {
        let url = "http://localhost:3000/api/products";
        let params = [];
        
        if (filters.categories && filters.categories.length > 0) {
            params.push(`categoria=${encodeURIComponent(filters.categories[0])}`);
        }
        
        if (filters.minPrice !== null && filters.minPrice !== undefined) {
            params.push(`prezzo_min=${filters.minPrice}`);
        }
        
        if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
            params.push(`prezzo_max=${filters.maxPrice}`);
        }
        
        if (filters.availableOnly) {
            params.push(`disponibilita=1`);
        }
        
        if (filters.priceOrder) {
            const sortValue = filters.priceOrder === "priceAsc" ? "prezzo_asc" : "prezzo_desc";
            params.push(`sort=${sortValue}`);
        }
        
        if (!filters.loadMore) {
            params.push(`limit=${FILTER_CONFIG.PRODUCTS_PER_PAGE}`);
        }
        
        if (params.length > 0) {
            url += "?" + params.join("&");
        }
        
        console.log("URL costruita:", url);
        
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Dati ricevuti:", data);
            
            window.displayedProducts = data.data || [];
            
            if (window.renderInitialProducts) {
                window.renderInitialProducts();
            }
            
            if (data.pagination && window.setupPagination) {
                window.setupPagination(data.pagination);
                const message = `Pagina ${data.pagination.current_page} di ${data.pagination.total_pages} (${data.pagination.total_items} prodotti totali)`;
                showFilterResults(message);
            } else if (window.displayedProducts.length > 0) {
                showFilterResults(`-${window.displayedProducts.length} prodotti trovati`);
            }
            
        } catch (error) {
            console.error("Errore nei filtri server-side:", error);
            showError('Errore nel caricamento dei prodotti filtrati.');
        }
    }

    // ============================================================================
    // FEEDBACK E MESSAGGI
    // ============================================================================
    function showFilterResults(message) {
        const existingMessage = document.getElementById('filter-results-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageHtml = `
            <div id="filter-results-message" class="alert alert-info mt-2 mb-3">
                <i class="fas fa-info-circle"></i> ${message}
            </div>
        `;
        
        const grid = document.getElementById("productGrid");
        if (grid) {
            grid.insertAdjacentHTML('beforebegin', messageHtml);
        }
    }

    function showNoProductsMessage(filters) {
        const grid = document.getElementById("productGrid");
        if (!grid) return;
        
        let message = "Nessun prodotto trovato con i filtri selezionati.";
        
        const suggestions = [];
        if (filters.categories && filters.categories.length > 0) {
            suggestions.push("prova a rimuovere il filtro categoria");
        }
        if (filters.minPrice !== null || filters.maxPrice !== null) {
            suggestions.push("modificare il range di prezzo");
        }
        if (filters.availableOnly) {
            suggestions.push("includi anche i prodotti non disponibili");
        }
        
        if (suggestions.length > 0) {
            message += ` Prova a ${suggestions.join(" o ")}.`;
        }
        
        grid.innerHTML = `<p class="info-message">${message}</p>`;
    }

    function showError(message) {
        const grid = document.getElementById("productGrid");
        if (grid) {
            grid.innerHTML = `<p class="error-message">${message}</p>`;
        }
    }

    // ============================================================================
    // GESTIONE EVENTI E HANDLERS
    // ============================================================================
    async function applyFiltersHandler() {
        const filters = getSelectedFilters();
        //console.log("Filtri prima della validazione:", filters);

        const validation = validatePriceInputs(filters.minPrice, filters.maxPrice);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        //console.log("Filtri dopo validazione:", filters);

        await applyProductFilters(filters);
        closeSidebar();
    }

    function resetFiltersHandler() {
        // Reset categorie
        const categoryCheckboxes = document.querySelectorAll('#categories-container input[type="checkbox"]');
        categoryCheckboxes.forEach(cb => cb.checked = false);
        
        // Reset altri filtri
        document.querySelectorAll(".filter-group input").forEach((input) => {
            if (input.type === "checkbox" && !input.id.startsWith('cat-')) {
                input.checked = false;
            } else if (input.type !== "checkbox") {
                input.value = "";
            }
        });

        document.querySelectorAll(".price-order button").forEach((btn) => {
            btn.classList.remove("active");
        });
        
        // Reset contatore categorie
        updateSelectedCategoriesCount();
        
        // Reset visualizzazione categorie
        CATEGORY_CONFIG.SHOW_ALL = false;
        renderCategoriesFilter();
        
        window.lastFilters = {};
        if (window.resetProductGrid) {
            window.resetProductGrid();
        }
    }

    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================
    if (applyFilters) applyFilters.addEventListener("click", applyFiltersHandler);
    if (resetFilters) resetFilters.addEventListener("click", resetFiltersHandler);

    // Gestione ordinamento prezzo con controlli di sicurezza
    const priceAsc = document.getElementById("priceAsc");
    const priceDesc = document.getElementById("priceDesc");

    if (priceAsc) {
        priceAsc.addEventListener("click", function () {
            this.classList.add("active");
            if (priceDesc) priceDesc.classList.remove("active");
        });
    }

    if (priceDesc) {
        priceDesc.addEventListener("click", function () {
            this.classList.add("active");
            if (priceAsc) priceAsc.classList.remove("active");
        });
    }

    // Validazione input prezzi con controlli di sicurezza
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');

    if (minPriceInput) {
        minPriceInput.addEventListener('input', validatePriceInputsLive);
        minPriceInput.addEventListener('paste', (e) => {
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (/[^0-9.,]/.test(pastedText)) {
                e.preventDefault();
            }
        });
    }

    if (maxPriceInput) {
        maxPriceInput.addEventListener('input', validatePriceInputsLive);
    }

    // ============================================================================
    // FUNZIONI UTILITY
    // ============================================================================
    function shouldAutoApplyFilters() {
        return false; // Mantieni comportamento manuale per ora
    }

    function debounceFilterApplication() {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
            if (window.applyProductFilters) {
                const filters = getSelectedFilters();
                window.applyProductFilters(filters);
            }
        }, 300);
    }

    function getCurrentFilters() {
        return window.lastFilters || {};
    }

    function hasActiveFilters() {
        const filters = getCurrentFilters();
        return (filters.categories && filters.categories.length > 0) ||
               filters.minPrice !== null ||
               filters.maxPrice !== null ||
               filters.availableOnly ||
               filters.priceOrder;
    }

    function applyFiltersToSearchResults(searchResults) {
        if (!hasActiveFilters()) {
            window.displayedProducts = [...searchResults];
            if (window.renderInitialProducts) {
                window.renderInitialProducts();
            }
            return;
        }
        
        window.searchResults = searchResults;
        const currentFilters = getCurrentFilters();
        applyClientSideFilters(currentFilters);
    }

    // ============================================================================
    // FUNZIONI GLOBALI E DEBUGGING
    // ============================================================================
    window.applyProductFilters = applyProductFilters;
    window.applyFiltersToSearchResults = applyFiltersToSearchResults;
    window.getCurrentFilters = getCurrentFilters;
    window.hasActiveFilters = hasActiveFilters;
    
    window.switchFilterMode = function(mode) {
        if (['client', 'server', 'auto'].includes(mode)) {
            filterMode = mode;
            console.log(`Modalità filtri cambiata a: ${mode}`);
        }
    };

    window.getFilterInfo = function() {
        return {
            mode: filterMode,
            totalProducts: totalProductsCount,
            hasActiveFilters: hasActiveFilters(),
            currentFilters: getCurrentFilters(),
            config: FILTER_CONFIG
        };
    };

    window.getCategoriesInfo = function() {
        return {
            totalCategories: categoriesData.length,
            selectedCategories: getSelectedCategories(),
            showingAll: CATEGORY_CONFIG.SHOW_ALL,
            config: CATEGORY_CONFIG
        };
    };

    window.setSelectedCategories = function(categoryIds) {
        const allCheckboxes = document.querySelectorAll('#categories-container input[type="checkbox"]');
        allCheckboxes.forEach(cb => cb.checked = false);
        
        categoryIds.forEach(id => {
            const checkbox = document.getElementById(`cat-${id}`);
            if (checkbox) {
                checkbox.checked = true;
            } else {
                console.warn(`Categoria con ID '${id}' non trovata`);
            }
        });
        
        updateSelectedCategoriesCount();
    };

    // ============================================================================
    // INIZIALIZZAZIONE
    // ============================================================================
    //console.log("Inizializzazione sistema filtri integrato...");
    
    // Inizializza modalità filtri
    determineFilterMode();
    
    // Carica le categorie
    loadCategories();
    
    // Ripristina filtri salvati dopo un breve delay
    setTimeout(() => {
        const savedFilters = window.lastFilters;
        if (savedFilters && savedFilters.categories) {
            window.setSelectedCategories(savedFilters.categories);
        }
    }, 100);

    //console.log("Sistema filtri integrato inizializzato con successo");
});