const { getStripePublicKey, getStripeSecretKey } = require("./donotshare");
const {
  getProduct,
  updateProduct,
  addOrder,
  getClient,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} = require("./database.js");

const stripe = require("stripe")(getStripeSecretKey());

//console.log("Chiave Pubblica: ", getStripePublicKey());
//console.log("Chiave Segreta: ", getStripeSecretKey());

async function createCheckount(carrello, cliente_id) {
  // fare get prodotto/i + update per diminuire la quantità + begin transaction
  const client = await getClient();
  if (!client) {
    return { success: false, message: "database_connection_error" };
  }

  try {
    await beginTransaction(client);
    const line_items = [];
    const productsToUpdate = [];

    for (const item of carrello) {
      const prodotto = await getProduct(item.prodotto_id, client);
      if (!prodotto.success) {
        await rollbackTransaction(client);
        return {
          success: false,
          message: `product_not_found: ${item.prodotto_id}`,
        };
      }
      if (prodotto.product.disponibilita) {
        await rollbackTransaction(client);
        return {
          success: false,
          message: `not_enough_stock_for: ${prodotto.product.nome}`,
        };
      }

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

      productsToUpdate.push({
        id: item.prodotto_id,
        newAvailability: prodotto.product.disponibilita - item.quantita,
      });
    }

    for (const update of productsToUpdate) {
      const result = await updateProduct(update.id, {
        disponibilita: update.newAvailability,
      });
      if (!result.success) {
        await rollbackTransaction(client);
        return {
          success: false,
          message: `failed_to_update_product_stock: ${update.id}`,
        };
      }
      // dettagli ordine
      const orderResult = await addOrder(
        cliente_id,
        update.venditore_id,
        update.id,
        carrello.find((item) => item.prodotto_id === update.id).quantita,
        null,
        client,
      );
      if (!orderResult.success) {
        await rollbackTransaction(client);
        return { success: false, message: "failed_add_order" };
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url:
        "http://localhost:3000/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000/cancel.html",
      metadata: {
        cliente_id: cliente_id.toString(),
        carrello: JSON.stringify(carrello),
      },
    });

    await commitTransaction(client);

    return { success: true, url: session.url };
  } catch (error) {
    await rollbackTransaction(client);
    return { success: false, message: "server_error" };
  } finally {
    client.release();
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

module.exports = { getOrderStatus, createCheckount };
