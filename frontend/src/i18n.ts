import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  fr: {
    translation: {
      welcome: "Bienvenue sur Simulpret",
      home: "Accueil",
      compare: "Comparer",
      premium: "Premium",
      wallet: "Mon portefeuille",
      credits: "Crédits",
      buyCredits: "Acheter des crédits",
      simulation: "Simulation",
      login: "Connexion",
      logout: "Déconnexion",
      creditUsed: "Crédit utilisé",
      notEnoughCredits: "Pas assez de crédits",
      rateBank: "Taux des banques",
      advancedSim: "Simulation avancée",
      // Ajoute d'autres traductions selon besoin
    },
  },
  en: {
    translation: {
      welcome: "Welcome to Simulpret",
      home: "Home",
      compare: "Compare",
      premium: "Premium",
      wallet: "My wallet",
      credits: "Credits",
      buyCredits: "Buy credits",
      simulation: "Simulation",
      login: "Login",
      logout: "Logout",
      creditUsed: "Credit used",
      notEnoughCredits: "Not enough credits",
      rateBank: "Bank rates",
      advancedSim: "Advanced simulation",
      // Add more translations as needed
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "fr",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
