function addToCart() {
/*
  console.log("Indice ricevuto in addToCart:", {
  currentProductIndex: window.currentProductIndex,
  displayedProductsLength: window.displayedProducts?.length
});

  // Controllo avanzato dell'indice
  if (typeof productIndex === 'undefined' || productIndex === null) {
    console.error("Indice del prodotto non fornito");
    return;
  }

  // Verifica che displayedProducts esista e sia un array
  if (!window.displayedProducts || !Array.isArray(window.displayedProducts)) {
    console.error("displayedProducts non è un array valido", window.displayedProducts);
    alert("Errore: prodotti non caricati. Ricarica la pagina.");
    return;
  }

  // Verifica che currentProductIndex sia valido
  if (productIndex< 0 || 
      productIndex>= window.displayedProducts.length) {
    console.error("Indice del prodotto non valido:", window.currentProductIndex);
    alert("Prodotto non valido selezionato. Riprova.");
    return;
  }

  // Controlla se l'utente è loggato
  if (!checkStatus()) {
    openLoginOverlay();
    return;
  }

  // Verifica che displayedProducts esista e sia un array
  if (!window.displayedProducts || !Array.isArray(window.displayedProducts)) {
    console.error("displayedProducts non è un array valido", window.displayedProducts);
    alert("Errore: prodotti non caricati. Ricarica la pagina.");
    return;
  }

  // Verifica che currentProductIndex sia valido
  if (
    window.currentProductIndex === undefined ||
    window.currentProductIndex < 0 ||
    window.currentProductIndex >= window.displayedProducts.length
  ) {
    console.error("Indice del prodotto non valido:", window.currentProductIndex);
    return;
  }

  const product = window.displayedProducts.find(p => p.prodotto.id === productIndex);
  if (!product) {
    console.error("Prodotto non trovato in displayedProducts");
    return;
  }
  */

  const product =window.currentProductVisualized;
  //console.log("prodCArt",window.currentProductVisualized);

  const quantityInput = document.getElementById("quantityInput");
  const addToCartBtn = document.getElementById("addToCartBtn");
  const quantity = parseInt(quantityInput.value) || 1;

  if (quantity > product.disponibilita) {
    quantityInput.value = product.disponibilita;
    return;
  }

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      title: product.nome,
      price: parseFloat(product.prezzo),
      quantity: quantity
    });
  }

  // Aggiorna localStorage e UI
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCartItems();
  updateCartBadge(getCartItemCount());

  // Riduci disponibilità locale
  product.disponibilita -= quantity;

  // Aggiorna testo disponibilità
  const availabilityEl = document.getElementById("productOverlayAvailability");
  availabilityEl.textContent =
    product.disponibilita > 0
      ? `Disponibilità: ${product.disponibilita} pezzi`
      : "Non disponibile";

  // Nascondi quantità e bottone se esaurito
  const qtyContainer = document.getElementById("quantitySelectionContainer");
  if (product.disponibilita <= 0) {
    qtyContainer.classList.add("hidden");
    addToCartBtn.classList.add("hidden");
  }

  // Resetta visivamente il campo input quantità e aggiorna il data-max
  const inputQty = document.getElementById("quantityInput");
  if (inputQty) {
    inputQty.value = "1";
    inputQty.setAttribute("data-max", product.disponibilita);
  }
  // Mostra popup
  const popup = document.getElementById("cartPopup");
  popup.classList.add("show");
  setTimeout(() => popup.classList.remove("show"), 2000);
}

// Conta il numero di articoli nel carrello
function getCartItemCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  return cart.length;
}

// Aggiorna il badge del carrello
function updateCartBadge(count) {
  const badge = document.getElementById("cartCountBadge");
  if (!badge) return;
  if(count > 0) {
  badge.textContent = count;
  badge.style.display = "inline-block";
  } else {
  badge.textContent = "";
  badge.style.display = "none";
  }
  // setTimeout(() => badge.classList.remove("cart-badge-animate"), 300);
}

// Inizializza il badge del carrello al caricamento della pagina
window.addEventListener("DOMContentLoaded", () => {
  updateCartBadge(getCartItemCount());
});

// Rimuove un prodotto dal carrello
/*function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Trova il prodotto nel carrello
  const removedItem = cart.find(item => item.id === productId);

  // Ripristina la disponibilità del prodotto
  if (removedItem) {
    const product = displayedProducts.find(p => p.id === removedItem.id);
    if (product) {
      product.prodotto.disponibilita += removedItem.quantity;
    }
  }

  // Rimuovi il prodotto dal carrello
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem("cart", JSON.stringify(cart));

  renderCartItems();         // aggiorna la vista del carrello
  updateCartBadge(getCartItemCount()); // aggiorna il badge
}*/

function removeFromCart(productId, restoreAvailability = false) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const removedItem = cart.find(item => item.id === productId);

  if (removedItem && restoreAvailability) {
    const product = window.displayedProducts.find(p => p.id === productId) || 
                   window.allProducts.find(p => p.id === productId);
    if (product) {
      product.prodotto.disponibilita += removedItem.quantity;
    }
  }

  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem("cart", JSON.stringify(cart));

  renderCartItems();
  updateCartBadge(getCartItemCount());
  
  if (restoreAvailability && typeof updateProductCardUI === "function") {
    updateProductCardUI(productId);
  }
}

function openCart() {
  renderCartItems();
  document.getElementById("cartContainer").classList.add("show");
}

// Chiude il carrello
function closeCart() {
  document.getElementById("cartContainer").classList.remove("show");
}

// Chiude il carrello cliccando fuori 
document.addEventListener("click", function (event) {
  const cartContainer = document.getElementById("cartContainer");
  const cartBtn = document.getElementById("cartBtn");

  if (!cartContainer.classList.contains("show")) return;

  const clickedInsideCart = cartContainer.contains(event.target);
  const clickedOnCartBtn = cartBtn.contains(event.target);
  const clickedRemoveBtn = event.target.closest(".remove-btn");

  if (!clickedInsideCart && !clickedOnCartBtn && !clickedRemoveBtn) {
    closeCart();
  }
});

function renderCartItems() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const container = document.getElementById("cartItems");
  const totalDisplay = document.getElementById("cartTotal");

  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = "<p>Il carrello è vuoto.</p>";
    totalDisplay.textContent = "Totale: €0,00";
    return;
  }

  let total = 0;

  cart.forEach(item => {
    const price = parseFloat(item.price) || 0;
    const itemTotal = price * item.quantity;
    total += itemTotal;

    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <div class="cart-item-title"><strong>${item.title}</strong></div>
      <div class="cart-item-info">
        <span>Quantità: ${item.quantity}</span>
        <span>Prezzo: €${price.toFixed(2)}</span>
        <span>Subtotale: €${itemTotal.toFixed(2)}</span>
        <button onclick="removeFromCart(${item.id})" class="remove-btn">Rimuovi</button>
      </div>
    `;
    container.appendChild(div);
  });

  totalDisplay.textContent = `Totale: €${total.toFixed(2)}`;
}

function clearCart() {
  localStorage.removeItem("cart");
  renderCartItems();
  updateCartBadge(0);
}

function saveCartToUserSession() {
  if (isUserLoggedIn()) { // Assumi di avere una funzione che verifica il login
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    sessionStorage.setItem(`cart_${getCurrentUserId()}`, JSON.stringify(cart));
  }
}

function loadCartFromUserSession() {
  if (isUserLoggedIn()) {
    const savedCart = sessionStorage.getItem(`cart_${getCurrentUserId()}`);
    if (savedCart) {
      localStorage.setItem("cart", savedCart);
      renderCartItems();
      updateCartBadge(getCartItemCount());
    }
  }
}

function restoreProductsAvailability(cart) {
  if (!Array.isArray(cart)) return;

  cart.forEach(item => {
    // Cerca il prodotto sia in displayedProducts che in allProducts
    const product = window.displayedProducts?.find(p => p.id === item.id) || 
                   window.allProducts?.find(p => p.id === item.id);
    
    if (product) {
      product.prodotto.disponibilita += item.quantity;
      
      // Aggiorna la card del prodotto se esiste
      if (typeof updateProductCardUI === "function") {
        updateProductCardUI(item.id);
      }
    }
  });
}