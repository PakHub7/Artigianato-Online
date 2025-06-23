// file per il recupero delle credenziali, in particolare l'api key di Stripe

function getStripePublicKey() {
  // TODO: mettere il valore in un .env per comodità
  // ( = quando si modificano le chiavi non serve toccare il codice)
  return "pk_test_51RRD9TRR7JhopDtYu9MgGm1hKT0rMMHugKkTRuSmunv4TfdA8jrHClrQvAr8JOxlwZRreb4EMHpuNqQXsSxg5zOO00GarI45Pf";
}

function getStripeSecretKey() {
  /*  Accessibile solo in locale,
      su Linux il comando per impostare la variabile d'ambiente
      è "export NOME_VARIABILE=valore */
  return "sk_test_51RRD9TRR7JhopDtYrWkHKDEheYvYuNn5nXQnBF7Q30LOcNLC1bWFOSoM5dtBSi6pLKhB3Hyw82z7Ii1OHt3viKp700AWrV1odU";
}

module.exports = {
  getStripePublicKey,
  getStripeSecretKey,
};
