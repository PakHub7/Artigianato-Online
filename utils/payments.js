const { getStripePublicKey, getStripeSecretKey } = require("./donotshare");

const stripe = require("stripe")(getStripeSecretKey());

//console.log("Chiave Pubblica: ", getStripePublicKey());
//console.log("Chiave Segreta: ", getStripeSecretKey());

module.exports = {};
