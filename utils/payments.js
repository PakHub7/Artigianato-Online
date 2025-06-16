const { getStripePublicKey, getStripeSecretKey } = require("./donotshare");
const { getProduct } = require("./database.js");

const stripe = require("stripe")(getStripeSecretKey());

//console.log("Chiave Pubblica: ", getStripePublicKey());
//console.log("Chiave Segreta: ", getStripeSecretKey());

async function createCheckount(carrello, cliente_id) {
  try {
    const line_items = [];

    // Qui devi implementare getProduct da DB, per esempio:
    /*async function getProduct(prodotto_id) {
      const result = await pool.query(
        "SELECT nome, descrizione, prezzo FROM prodotti WHERE id = $1",
        [prodotto_id],
      );
      if (result.rowCount === 0) return { success: false };
      return { success: true, product: result.rows[0] };
      }*/

    for (const item of carrello) {
      const prodotto = await getProduct(item.prodotto_id);
      if (!prodotto.success) continue;

      line_items.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: prodotto.product.nome,
            description: prodotto.product.descrizione,
          },
          unit_amount: Math.round(prodotto.product.prezzo * 100),
        },
        quantity: item.quantita,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: "http://localhost:3000/success.html",
      cancel_url: "http://localhost:3000/cancel.html",
      metadata: {
        cliente_id: cliente_id.toString(),
        carrello: JSON.stringify(carrello),
      },
    });

    res.json({ url: session.url }); // redirect utente (frontend)
  } catch (error) {
    return { success: false, message: "server_error" };
  }
}

async function getOrderStatus(sessionId) {
  try {
    // Recupera i dettagli della sessione
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    // Recupera i dettagli del pagamento se completato
    let paymentIntent = null;
    if (session.payment_intent) {
      paymentIntent = await stripeClient.paymentIntents.retrieve(
        session.payment_intent,
      );
    }

    return {
      success: true,
      session: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_details?.email,
        metadata: session.metadata,
      },
      payment: paymentIntent
        ? {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            created: new Date(paymentIntent.created * 1000).toISOString(),
          }
        : null,
    };
  } catch (error) {
    return { success: false, message: "not_found" };
  }
}

module.exports = { getOrderStatus };
