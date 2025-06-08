// file per il recupero delle credenziali, in particolare l'api key di Stripe

function getStripePublicKey() {
  return "pk_test_51RRD9TRR7JhopDtYu9MgGm1hKT0rMMHugKkTRuSmunv4TfdA8jrHClrQvAr8JOxlwZRreb4EMHpuNqQXsSxg5zOO00GarI45Pf";
}

function getStripeSecretKey() {
  return process.env.STRIPE_API_KEY;
}

module.exports = {
  getStripePublicKey,
  getStripeSecretKey,
}; // module.exports = {nomeFun1, nomeFun2}
