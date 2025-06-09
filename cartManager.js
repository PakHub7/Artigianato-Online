function addToCart(product, quantity) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Verifica se già presente
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: quantity
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
}

function checkLoginStatus() {
  const userId = localStorage.getItem("userid");

  
  if (!userId) {
    // Utente non loggato, va a regLog
    openLoginOverlay();
    console.log("Utente non loggato, reindirizzamento a regLog.js");
    return;
  }


  // Utente loggato: recupera il prodotto e la quantità
  const product = products[currentProductIndex];
  const quantity = parseInt(document.getElementById("quantityInput").value) || 1;

  addToCart(product,quantity);

  // Mostra il popup
  const popup = document.getElementById("cartPopup");
  popup.classList.add("show");

  // Nascondi dopo 2 secondi
  setTimeout(() => {
    popup.classList.remove("show");
  }, 2000);
};

function openCart() {
  document.getElementById("cartContainer").classList.add("show");
  document.getElementById("floatingCartBtn").classList.add("hidden");
}

function closeCart() {
  document.getElementById("cartContainer").classList.remove("show");
  document.getElementById("floatingCartBtn").classList.remove("hidden");
}