import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  fr: {
    translation: {
      // Navigation
      welcome: "Bienvenue sur Simulpret",
      home: "Accueil",
      compare: "Comparer",
      premium: "Premium",
      variableRate: "Taux Variable",
      optimization: "Optimisation",
      investment: "Investissement",
      stressTest: "Test Résistance",
      
      // Wallet
      wallet: "Mon portefeuille",
      credits: "Crédits",
      credit: "crédit",
      buyCredits: "Acheter des crédits",
      yourBalance: "Votre solde",
      popular: "Populaire",
      securePayment: "Paiement 100% sécurisé",
      purchaseError: "Erreur lors de l'achat",
      
      // Simulation
      simulation: "Simulation",
      simulate: "Simuler",
      calculate: "Calculer",
      optimize: "Optimiser",
      calculating: "Calcul en cours...",
      simulationError: "Erreur lors de la simulation",
      simulationResults: "Résultats de la simulation",
      
      // Credits
      creditCost: "Coût",
      creditUsed: "Crédit utilisé",
      notEnoughCredits: "Pas assez de crédits",
      
      // Forms
      monthlyIncome: "Revenus mensuels",
      monthlyCharges: "Charges mensuelles",
      interestRate: "Taux d'intérêt",
      loanDuration: "Durée du prêt",
      propertyPrice: "Prix du bien",
      downPayment: "Apport",
      monthlyPayment: "Mensualité",
      
      // Variable Rate
      variableRateSimulation: "Simulation Taux Variable",
      initialRate: "Taux initial",
      fixedPeriod: "Période taux fixe",
      annualVariation: "Variation annuelle",
      rateProjections: "Projections des taux",
      initialAmount: "Montant initial",
      initialMonthly: "Mensualité initiale",
      
      // Optimization
      optimizationSimulation: "Optimisation Apport/Durée",
      minDuration: "Durée minimale",
      maxDuration: "Durée maximale",
      optimalSolution: "Solution optimale",
      alternatives: "Alternatives",
      duration: "Durée",
      totalCost: "Coût total",
      effortRate: "Taux d'effort",
      
      // Common
      year: "Année",
      years: "ans",
      months: "mois",
      rate: "Taux",
      remainingCapital: "Capital restant",
      cancel: "Annuler",
      
      // Features
      rateBank: "Taux des banques",
      advancedSim: "Simulation avancée",
      login: "Connexion",
      logout: "Déconnexion",
    },
  },
  en: {
    translation: {
      // Navigation
      welcome: "Welcome to Simulpret",
      home: "Home",
      compare: "Compare",
      premium: "Premium",
      variableRate: "Variable Rate",
      optimization: "Optimization",
      investment: "Investment",
      stressTest: "Stress Test",
      
      // Wallet
      wallet: "My wallet",
      credits: "Credits",
      credit: "credit",
      buyCredits: "Buy credits",
      yourBalance: "Your balance",
      popular: "Popular",
      securePayment: "100% secure payment",
      purchaseError: "Purchase error",
      
      // Simulation
      simulation: "Simulation",
      simulate: "Simulate",
      calculate: "Calculate",
      optimize: "Optimize",
      calculating: "Calculating...",
      simulationError: "Simulation error",
      simulationResults: "Simulation results",
      
      // Credits
      creditCost: "Cost",
      creditUsed: "Credit used",
      notEnoughCredits: "Not enough credits",
      
      // Forms
      monthlyIncome: "Monthly income",
      monthlyCharges: "Monthly charges",
      interestRate: "Interest rate",
      loanDuration: "Loan duration",
      propertyPrice: "Property price",
      downPayment: "Down payment",
      monthlyPayment: "Monthly payment",
      
      // Variable Rate
      variableRateSimulation: "Variable Rate Simulation",
      initialRate: "Initial rate",
      fixedPeriod: "Fixed rate period",
      annualVariation: "Annual variation",
      rateProjections: "Rate projections",
      initialAmount: "Initial amount",
      initialMonthly: "Initial monthly",
      
      // Optimization
      optimizationSimulation: "Down Payment/Duration Optimization",
      minDuration: "Minimum duration",
      maxDuration: "Maximum duration",
      optimalSolution: "Optimal solution",
      alternatives: "Alternatives",
      duration: "Duration",
      totalCost: "Total cost",
      effortRate: "Effort rate",
      
      // Common
      year: "Year",
      years: "years",
      months: "months",
      rate: "Rate",
      remainingCapital: "Remaining capital",
      cancel: "Cancel",
      
      // Features
      rateBank: "Bank rates",
      advancedSim: "Advanced simulation",
      login: "Login",
      logout: "Logout",
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