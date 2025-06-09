// let products va sostituita con il collegamento al database ***********************
let products = [
  {
    id: 1,
    nome: "Borsa in cuoio",
    descrizione: "Borsa fatta a mano in pelle di Bronte, con cuciture artigianali e dettagli in metallo nichel-free per una maggiore resistenza. Realizzata da Efesto, un artigiano locale che utilizza solo materiali di alta qualità e tecniche tradizionali per creare prodotti unici e durevoli. Questa borsa è perfetta per chi cerca un accessorio elegante e funzionale, ideale per l'uso quotidiano o per occasioni speciali. Ogni pezzo è unico, con piccole imperfezioni che ne attestano l'autenticità e la lavorazione artigianale.", 
    prezzo: "79.00",
    disponibilita: 5,
    artigiano_id: "Efesto",
    categoria_id: 3,
    immagini_url: ["product1.jpg","product2.jpg","product3.jpg"],
    data_pubblicazione: "2025-06-01"
  },
  {
    id: 2,
    nome: "Collana artigianale",
    descrizione: "Collana realizzata con pietre naturali di Bronte e filo cerato di Bronte.",
    prezzo: "45.00",
    disponibilita: 5,
    artigiano_id: 102,
    categoria_id: 2,
    immagini_url: ["product2.jpg","product3.jpg","product1.jpg"],
    data_pubblicazione: "2025-05-28"
  },
  {
    id: 3,
    nome: "Orecchini in argento",
    descrizione: "Creati da artigiani locali con argento di Bronte",
    prezzo: "60.00",
    disponibilita: 5,
    artigiano_id: 5,
    categoria_id: 3,
    immagini_url: ["product3.jpg","product1.jpg","product2.jpg"],
    data_pubblicazione: "2025-03-28"
  }
];

let currentProductIndex = 0;
const grid = document.getElementById("productGrid");

products.forEach((prod, index) => {
  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
    <img src="${prod.immagini_url[0]}" alt="${prod.nome}" />  
    <h3>${prod.nome}</h3>
    <p>${parseFloat(prod.prezzo).toFixed(2)} €</p>
  `;
  card.onclick = () => openOverlay(index); 
  grid.appendChild(card);
});

function openOverlay(index) {
  currentProductIndex = index;
  const product = products[currentProductIndex];

  // Carosello
  const carousel = document.getElementById("overlayCarousel");
  carousel.className = "image-carousel";
  carousel.innerHTML = "";

  const images = Array.isArray(product.immagini_url)
    ? product.immagini_url
    : [product.immagini_url]; 

  images.slice(0, 5).forEach(url => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = product.nome;
    img.onclick = () => openImageModal(url);
    carousel.appendChild(img);
  });

  // Titolo
  document.getElementById("productOverlayTitle").textContent = product.nome;

  // Descrizione + Artigiano
  document.getElementById("productOverlayDescription").innerHTML = `
    <p>${product.descrizione}</p>
    <p><small>Scopri il venditore: ${product.artigiano_id}</small></p>`; // Qui va collegato al profilo dell'artigiano

  // Prezzo
  document.getElementById("productOverlayPrice").textContent = `${parseFloat(product.prezzo).toFixed(2)} €`;

  // Disponibilità
  document.getElementById("productOverlayAvailability").textContent =
    `Disponibilità: ${product.disponibilita > 0 ? product.disponibilita + ' pezzi' : 'Non disponibile'}`;

  // Mostra overlay con classe CSS
  const overlay = document.getElementById("productOverlay");
  overlay.classList.add("show");

  updateArrowVisibility();
}

// Chiusura overlay
function closeOverlay() {
  document.getElementById("productOverlay").classList.remove("show");
}

// Chiudi productOverlay cliccando fuori 
document.getElementById("productOverlay").addEventListener("click", function (event) {
  if (!event.target.closest(".product-overlay-content") && !event.target.classList.contains("overlay-arrow")) {
    closeOverlay();
  }
});

// Mosrtra il modal per l'immagine
function openImageModal(src) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  modalImg.src = src;
  modal.style.display = "flex";
}

function closeImageModal() {
  document.getElementById("imageModal").style.display = "none";
}
// Gestione dei bottoni per navigare tra i prodotti
function showPreviousProduct() {
  if (currentProductIndex > 0) {
    openOverlay(currentProductIndex - 1);
  }
}

function showNextProduct() {
  if (currentProductIndex < products.length - 1) {
    openOverlay(currentProductIndex + 1);
  }
}

function updateArrowVisibility() {
  const leftArrow = document.querySelector(".overlay-arrow.left");
  const rightArrow = document.querySelector(".overlay-arrow.right");

  leftArrow.classList.toggle("hidden", currentProductIndex <= 0);
  rightArrow.classList.toggle("hidden", currentProductIndex >= products.length - 1);
}
function changeQuantity(delta) {
  const input = document.getElementById("quantityInput");
  let newVal = parseInt(input.value) + delta;
  if (newVal < 1) newVal = 1;
  input.value = newVal;
}


