from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import stripe
from dotenv import load_dotenv
import math
from datetime import datetime

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # pour le dev, restreindre en prod !
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèles de données
class CalculateRequest(BaseModel):
    salaire: float
    charges: float
    taux: float = 0.03
    duree: int = 240
    apport: Optional[float] = 0

class VariableRateRequest(BaseModel):
    salaire: float
    charges: float
    taux_initial: float
    duree: int
    periode_fixe: int  # Nombre de mois en taux fixe
    variation_annuelle: float  # Variation du taux variable en %

class OptimizationRequest(BaseModel):
    salaire: float
    charges: float
    prix_bien: float
    taux: float
    duree_min: int = 60
    duree_max: int = 360

class InvestmentRequest(BaseModel):
    prix_bien: float
    apport: float
    taux: float
    duree: int
    loyer_mensuel: float
    charges_mensuelles: float
    impots_annuels: float

@app.get("/")
def read_root():
    return {"msg": "Bienvenue sur Simulpret API"}

@app.post("/calculate")
async def calculate(data: CalculateRequest):
    mensualite_max = data.salaire * 0.33 - data.charges
    if data.taux == 0: data.taux = 0.01
    montant = mensualite_max * (1 - (1 + data.taux/12) ** -data.duree) / (data.taux/12)
    return {
        "montant": round(montant, 2), 
        "mensualite_max": round(mensualite_max, 2),
        "cout_total": round(mensualite_max * data.duree, 2),
        "cout_credit": round(mensualite_max * data.duree - montant, 2)
    }

@app.post("/calculate/variable-rate")
async def calculate_variable_rate(data: VariableRateRequest):
    """Simulation avec taux variable - Coût: 2 crédits"""
    mensualite_max = data.salaire * 0.33 - data.charges
    
    # Calcul phase taux fixe
    taux_mensuel_fixe = data.taux_initial / 12
    montant_fixe = mensualite_max * (1 - (1 + taux_mensuel_fixe) ** -data.periode_fixe) / taux_mensuel_fixe
    
    # Simulation variation taux
    projections = []
    for annee in range(data.duree // 12):
        taux_annuel = data.taux_initial + (data.variation_annuelle * annee)
        taux_mensuel = taux_annuel / 12
        
        # Calcul de la mensualité pour cette période
        mois_restants = data.duree - (annee * 12)
        if mois_restants > 0:
            capital_restant = montant_fixe * (1 - (annee * 12) / data.duree)  # Approximation
            mensualite = capital_restant * taux_mensuel / (1 - (1 + taux_mensuel) ** -mois_restants)
            
            projections.append({
                "annee": annee + 1,
                "taux": round(taux_annuel, 3),
                "mensualite": round(mensualite, 2),
                "capital_restant": round(capital_restant, 2)
            })
    
    return {
        "montant_initial": round(montant_fixe, 2),
        "mensualite_initiale": round(mensualite_max, 2),
        "projections": projections,
        "credits_required": 2
    }

@app.post("/calculate/optimization")
async def optimize_loan(data: OptimizationRequest):
    """Optimisation apport/durée - Coût: 3 crédits"""
    results = []
    
    for duree in range(data.duree_min, data.duree_max + 1, 12):
        for apport_pct in range(0, 31, 5):  # 0% à 30% d'apport
            apport = data.prix_bien * apport_pct / 100
            montant_emprunte = data.prix_bien - apport
            
            taux_mensuel = data.taux / 12
            mensualite = montant_emprunte * taux_mensuel / (1 - (1 + taux_mensuel) ** -duree)
            
            # Vérifier si c'est viable
            taux_effort = mensualite / (data.salaire - data.charges)
            
            if taux_effort <= 0.33:
                cout_total = mensualite * duree + apport
                cout_credit = mensualite * duree - montant_emprunte
                
                results.append({
                    "duree": duree,
                    "apport": round(apport, 2),
                    "apport_pct": apport_pct,
                    "mensualite": round(mensualite, 2),
                    "cout_total": round(cout_total, 2),
                    "cout_credit": round(cout_credit, 2),
                    "taux_effort": round(taux_effort * 100, 1)
                })
    
    # Trier par coût total
    results.sort(key=lambda x: x["cout_total"])
    
    return {
        "optimal": results[0] if results else None,
        "alternatives": results[:5],
        "credits_required": 3
    }

@app.post("/calculate/investment")
async def calculate_investment(data: InvestmentRequest):
    """Simulation investissement locatif - Coût: 3 crédits"""
    montant_emprunte = data.prix_bien - data.apport
    taux_mensuel = data.taux / 12
    mensualite = montant_emprunte * taux_mensuel / (1 - (1 + taux_mensuel) ** -data.duree)
    
    # Cash-flow mensuel
    cash_flow_mensuel = data.loyer_mensuel - mensualite - data.charges_mensuelles
    
    # Projections sur 5, 10, 15, 20 ans
    projections = []
    for annees in [5, 10, 15, 20]:
        if annees * 12 <= data.duree:
            mois = annees * 12
            capital_rembourse = montant_emprunte * (1 - (1 + taux_mensuel) ** (mois - data.duree)) / (1 - (1 + taux_mensuel) ** -data.duree)
            
            cash_flow_total = cash_flow_mensuel * mois
            impots_total = data.impots_annuels * annees
            
            rendement_brut = (data.loyer_mensuel * 12) / data.prix_bien * 100
            rendement_net = ((data.loyer_mensuel * 12 - data.charges_mensuelles * 12 - data.impots_annuels) / data.prix_bien) * 100
            
            projections.append({
                "annees": annees,
                "cash_flow_cumule": round(cash_flow_total - impots_total, 2),
                "capital_rembourse": round(capital_rembourse, 2),
                "rendement_brut": round(rendement_brut, 2),
                "rendement_net": round(rendement_net, 2)
            })
    
    return {
        "mensualite": round(mensualite, 2),
        "cash_flow_mensuel": round(cash_flow_mensuel, 2),
        "rentabilite_brute": round((data.loyer_mensuel * 12) / data.prix_bien * 100, 2),
        "projections": projections,
        "credits_required": 3
    }

@app.post("/calculate/stress-test")
async def stress_test(data: dict):
    """Test de résistance financière - Coût: 2 crédits"""
    salaire = data.get("salaire", 0)
    charges = data.get("charges", 0)
    mensualite_actuelle = data.get("mensualite_actuelle", 0)
    
    scenarios = []
    
    # Scénarios de stress
    stress_scenarios = [
        {"nom": "Situation actuelle", "salaire_mult": 1.0, "charges_mult": 1.0},
        {"nom": "Chômage partiel (-20%)", "salaire_mult": 0.8, "charges_mult": 1.0},
        {"nom": "Perte d'emploi conjoint (-50%)", "salaire_mult": 0.5, "charges_mult": 1.0},
        {"nom": "Hausse charges (+30%)", "salaire_mult": 1.0, "charges_mult": 1.3},
        {"nom": "Crise combinée", "salaire_mult": 0.7, "charges_mult": 1.2}
    ]
    
    for scenario in stress_scenarios:
        salaire_stress = salaire * scenario["salaire_mult"]
        charges_stress = charges * scenario["charges_mult"]
        
        capacite_paiement = salaire_stress - charges_stress - mensualite_actuelle
        taux_effort = mensualite_actuelle / salaire_stress if salaire_stress > 0 else 999
        
        scenarios.append({
            "scenario": scenario["nom"],
            "salaire": round(salaire_stress, 2),
            "charges": round(charges_stress, 2),
            "capacite_paiement": round(capacite_paiement, 2),
            "taux_effort": round(taux_effort * 100, 1),
            "viable": taux_effort <= 0.33 and capacite_paiement > 0
        })
    
    # Calcul marge de sécurité
    marge_securite = ((salaire - charges) - mensualite_actuelle) / mensualite_actuelle * 100
    
    return {
        "scenarios": scenarios,
        "marge_securite": round(marge_securite, 1),
        "risque_global": "Faible" if marge_securite > 50 else "Moyen" if marge_securite > 20 else "Élevé",
        "credits_required": 2
    }

@app.post("/track")
async def track(request: Request):
    evt = await request.json()
    print(f"LOG EVENT {evt}")
    return {"ok": True}

# Endpoints pour le wallet et les micro-paiements
@app.post("/wallet/buy")
async def buy_credit(data: dict):
    mode = data.get("mode", "dev")
    amount = data.get("amount", 5)
    pack_type = data.get("pack_type", "standard")  # standard, pro, premium
    
    # Prix par pack
    prices = {
        "micro": {"credits": 1, "price": 50},  # 0.50€
        "standard": {"credits": 5, "price": 200},  # 2€
        "pro": {"credits": 10, "price": 350},  # 3.50€
        "premium": {"credits": 30, "price": 900}  # 9€
    }
    
    pack = prices.get(pack_type, prices["standard"])
    
    STRIPE_KEY = os.environ.get("STRIPE_SECRET", "")
    if mode == "dev" or not STRIPE_KEY:
        return {"success": True, "credits": pack["credits"]}
    else:
        stripe.api_key = STRIPE_KEY
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {"name": f"Simulpret Credits - Pack {pack_type}"},
                    "unit_amount": pack["price"],
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url="http://localhost:5173?payment=success",
            cancel_url="http://localhost:5173?payment=cancel",
        )
        return {"checkout_url": session.url}

@app.get("/pricing")
async def get_pricing():
    """Obtenir les tarifs des différentes fonctionnalités"""
    return {
        "features": {
            "basic": {"credits": 0, "name": "Simulation basique"},
            "variable_rate": {"credits": 2, "name": "Taux variable"},
            "optimization": {"credits": 3, "name": "Optimisation apport/durée"},
            "investment": {"credits": 3, "name": "Investissement locatif"},
            "stress_test": {"credits": 2, "name": "Test de résistance"},
            "multi_compare": {"credits": 2, "name": "Comparaison multi-offres"},
            "full_report": {"credits": 1, "name": "Rapport PDF"}
        },
        "packs": {
            "micro": {"credits": 1, "price": 0.50, "price_per_credit": 0.50},
            "standard": {"credits": 5, "price": 2.00, "price_per_credit": 0.40},
            "pro": {"credits": 10, "price": 3.50, "price_per_credit": 0.35},
            "premium": {"credits": 30, "price": 9.00, "price_per_credit": 0.30}
        }
    }