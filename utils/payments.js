const { getStripePublicKey, getStripeSecretKey } = require("./donotshare");

const stripe = require("stripe")(getStripeSecretKey());

//console.log("Chiave Pubblica: ", getStripePublicKey());
//console.log("Chiave Segreta: ", getStripeSecretKey());

async function getBalance() {
  const balance = await stripe.balance.retrieve();
  return balance;
}

module.exports = { getBalance };
