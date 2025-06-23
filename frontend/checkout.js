// Funzione principale per il checkout - SEMPLIFICATA
async function procediAlCheckout() {
    try {
        // Ottieni dati necessari
        const carrello = ottieniCarrello();
        const clienteId = ottieniClienteId();
        
        // DEBUG: Mostra i dati che stiamo inviando
        console.log('=== DATI INVIATI ===');
        console.log('Carrello:', carrello);
        console.log('Cliente ID:', clienteId);
        console.log('Carrello mappato:', carrello.map(item => ({
            prodotto_id: item.id,
            quantita: item.quantity
        })));
        console.log('==================');
        
        // Validazioni essenziali
        if (!carrello.length) {
            throw new Error('Il carrello è vuoto');
        }
        if (!clienteId) {
            throw new Error('Devi essere autenticato per procedere');
        }
        
        // Chiamata API
        const payloadData = {
            carrello: carrello.map(item => ({
                prodotto_id: item.id,
                quantita: item.quantity
            })),
            cliente_id: clienteId
        };
        
        console.log('=== PAYLOAD FINALE ===');
        console.log('JSON da inviare:', JSON.stringify(payloadData, null, 2));
        console.log('====================');
        
        const response = await fetch("http://localhost:3000/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadData)
        });
        
        const data = await response.json();
        
        // DEBUG: Mostra la risposta completa
        console.log('=== RISPOSTA SERVER ===');
        console.log('Status:', response.status);
        console.log('Data completa:', data);
        console.log('Success:', data.success);
        console.log('URL:', data.data?.url);
        console.log('Message:', data.message);
        console.log('=======================');
        
        // Gestione risposta
        if (data.success) {
            // Controlla se ci sono errori nei dati interni
            if (data.data && data.data.success === false) {
                // Errore specifico (es. stock insufficiente)
                const errorMsg = data.data.message || 'Errore sconosciuto';
                
                // Gestisci errori di stock
                if (errorMsg.includes('not_enough_stock_for:')) {
                    const prodotto = errorMsg.split('not_enough_stock_for:')[1]?.trim();
                    throw new Error(`Stock insufficiente per: ${prodotto}. Riduci la quantità o rimuovi l'articolo dal carrello.`);
                }
                
                throw new Error(errorMsg);
            }
            
            // Se tutto ok, dovrebbe esserci l'URL
            if (data.data?.url) {
                // Controlla se l'URL è valido (non un placeholder)
                if (data.data.url.includes('stripe_checkout_url')) {
                    throw new Error('Il server ha restituito un URL non valido. Contatta il supporto.');
                }
                window.location.href = data.data.url;
            } else {
                throw new Error('URL di checkout non ricevuto dal server');
            }
        } else {
            throw new Error(data.message || 'Errore dal server');
        }
        
    } catch (error) {
        console.error("Errore checkout:", error);
        alert('Errore: ' + error.message);
    }
}

// Funzioni helper - ESSENZIALI
function ottieniCarrello() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

function ottieniClienteId() {
    // SOSTITUISCI con la tua logica di autenticazione
    const userId = getCurrentUserId(); // Assumo tu abbia questa funzione
    return userId ? parseInt(userId) : null;
}

// Inizializzazione - SEMPLICE
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.querySelector('.checkout-btn');
    if (btn) {
        btn.addEventListener('click', procediAlCheckout);
    }
});