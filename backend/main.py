from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import stripe
from dotenv import load_dotenv
import math
from datetime import datetime
from sqlalchemy.orm import Session
from database import get_db, BankRate
from rate_fetcher import update_rates
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import asyncio
import json
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
import io
import tempfile

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # pour le dev, restreindre en prod !
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize scheduler for automatic rate updates
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    # Update rates on startup
    asyncio.create_task(update_rates())
    
    # Schedule rate updates every 6 hours
    scheduler.add_job(
        update_rates,
        'interval',
        hours=6,
        id='rate_update',
        replace_existing=True
    )
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()

# Modèles de données
class CalculateRequest(BaseModel):
    salaire: float
    autres_revenus: float = 0
    charges: float = 0
    taux: float = 3.5
    duree: int = 240
    taux_effort_max: float = 0.33

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

class BankOffer(BaseModel):
    bank_name: str
    taux: float
    duree: int
    frais_dossier: float = 0
    assurance_mensuelle: float = 0
    taux_assurance: float = 0

class MultiOfferRequest(BaseModel):
    prix_bien: float
    apport: float
    offers: List[BankOffer]

class ScenarioSaveRequest(BaseModel):
    name: str
    type: str  # basic, variable_rate, optimization, investment, stress_test
    data: dict
    results: dict

@app.get("/")
def read_root():
    return {"msg": "Bienvenue sur Simulpret API"}

@app.post("/calculate")
async def calculate(data: CalculateRequest):
    # Calcul du revenu total
    revenu_total = data.salaire + data.autres_revenus
    
    # Calcul de la mensualité maximale selon le taux d'effort
    mensualite_max = (revenu_total * data.taux_effort_max) - data.charges
    
    # Protection contre mensualité négative
    if mensualite_max <= 0:
        return {
            "montant": 0, 
            "mensualite_max": 0,
            "cout_total": 0,
            "cout_credit": 0,
            "revenu_total": round(revenu_total, 2),
            "error": "Capacité d'emprunt insuffisante"
        }
    
    # Calcul du montant empruntable
    taux_mensuel = data.taux / 100 / 12
    if taux_mensuel > 0:
        montant = mensualite_max * (1 - (1 + taux_mensuel) ** -data.duree) / taux_mensuel
    else:
        montant = mensualite_max * data.duree
    
    cout_total = mensualite_max * data.duree
    cout_credit = cout_total - montant
    
    return {
        "montant": round(montant, 2), 
        "mensualite_max": round(mensualite_max, 2),
        "cout_total": round(cout_total, 2),
        "cout_credit": round(cout_credit, 2),
        "revenu_total": round(revenu_total, 2),
        "taux_effort_utilise": data.taux_effort_max
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

@app.get("/bank-rates")
async def get_bank_rates(db: Session = Depends(get_db)):
    """Obtenir les taux actuels des principales banques depuis la base de données"""
    
    # Get rates from database
    rates = db.query(BankRate).all()
    
    if not rates:
        # If no rates in DB, trigger an update
        asyncio.create_task(update_rates())
        
        # Return default rates for now
        return {
            "rates": [
                {
                    "bank_name": "Crédit Agricole",
                    "rate_10_years": 3.20,
                    "rate_15_years": 3.45,
                    "rate_20_years": 3.65,
                    "rate_25_years": 3.85,
                    "best_rate": True,
                    "last_updated": datetime.now().strftime("%Y-%m-%d")
                }
            ],
            "average_rates": {
                "10_years": 3.25,
                "15_years": 3.50,
                "20_years": 3.70,
                "25_years": 3.89
            },
            "last_update": datetime.now().strftime("%Y-%m-%d"),
            "status": "updating"
        }
    
    # Convert to response format
    rate_list = []
    for rate in rates:
        rate_list.append({
            "bank_name": rate.bank_name,
            "rate_10_years": rate.rate_10_years,
            "rate_15_years": rate.rate_15_years,
            "rate_20_years": rate.rate_20_years,
            "rate_25_years": rate.rate_25_years,
            "best_rate": False,  # Will be calculated
            "last_updated": rate.last_updated.strftime("%Y-%m-%d %H:%M")
        })
    
    # Sort by average rate and mark best rates
    for duration in ['10', '15', '20', '25']:
        sorted_rates = sorted(rate_list, key=lambda x: x[f'rate_{duration}_years'])
        if sorted_rates:
            sorted_rates[0]['best_rate'] = True
    
    # Calculate averages
    avg_10 = sum(r['rate_10_years'] for r in rate_list) / len(rate_list) if rate_list else 0
    avg_15 = sum(r['rate_15_years'] for r in rate_list) / len(rate_list) if rate_list else 0
    avg_20 = sum(r['rate_20_years'] for r in rate_list) / len(rate_list) if rate_list else 0
    avg_25 = sum(r['rate_25_years'] for r in rate_list) / len(rate_list) if rate_list else 0
    
    # Get most recent update time
    last_update = max(r.last_updated for r in rates) if rates else datetime.now()
    
    return {
        "rates": rate_list,
        "average_rates": {
            "10_years": round(avg_10, 2),
            "15_years": round(avg_15, 2),
            "20_years": round(avg_20, 2),
            "25_years": round(avg_25, 2)
        },
        "last_update": last_update.strftime("%Y-%m-%d %H:%M"),
        "next_update": "In 6 hours"
    }

@app.post("/bank-rates/update")
async def force_rate_update():
    """Force an immediate update of bank rates"""
    asyncio.create_task(update_rates())
    return {"status": "Update started", "message": "Rates will be updated in the background"}

@app.post("/calculate/multi-offer")
async def compare_offers(data: MultiOfferRequest):
    """Comparaison multi-offres - Coût: 2 crédits"""
    montant_emprunte = data.prix_bien - data.apport
    
    comparisons = []
    
    for offer in data.offers:
        taux_mensuel = offer.taux / 100 / 12
        
        # Calcul mensualité hors assurance
        if taux_mensuel > 0:
            mensualite_credit = montant_emprunte * taux_mensuel / (1 - (1 + taux_mensuel) ** -offer.duree)
        else:
            mensualite_credit = montant_emprunte / offer.duree
        
        # Calcul assurance
        if offer.taux_assurance > 0:
            assurance_mensuelle = montant_emprunte * (offer.taux_assurance / 100) / 12
        else:
            assurance_mensuelle = offer.assurance_mensuelle
        
        mensualite_totale = mensualite_credit + assurance_mensuelle
        
        # Coût total
        cout_total = (mensualite_totale * offer.duree) + offer.frais_dossier
        cout_credit = cout_total - montant_emprunte
        
        comparisons.append({
            "bank_name": offer.bank_name,
            "mensualite_credit": round(mensualite_credit, 2),
            "assurance_mensuelle": round(assurance_mensuelle, 2),
            "mensualite_totale": round(mensualite_totale, 2),
            "frais_dossier": offer.frais_dossier,
            "cout_total": round(cout_total, 2),
            "cout_credit": round(cout_credit, 2),
            "taux": offer.taux,
            "duree": offer.duree
        })
    
    # Trier par coût total
    comparisons.sort(key=lambda x: x["cout_total"])
    
    # Calculer les économies par rapport à l'offre la plus chère
    if len(comparisons) > 1:
        max_cout = max(c["cout_total"] for c in comparisons)
        for comp in comparisons:
            comp["economie"] = round(max_cout - comp["cout_total"], 2)
    
    return {
        "montant_emprunte": round(montant_emprunte, 2),
        "comparisons": comparisons,
        "meilleure_offre": comparisons[0] if comparisons else None,
        "credits_required": 2
    }

@app.post("/export/pdf")
async def export_pdf(data: dict):
    """Export PDF du rapport - Coût: 1 crédit"""
    try:
        # Créer un fichier temporaire
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            # Créer le document PDF
            doc = SimpleDocTemplate(tmp_file.name, pagesize=A4)
            story = []
            
            # Styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Title'],
                fontSize=24,
                textColor=colors.HexColor('#1a1a1a'),
                spaceAfter=30,
            )
            
            # Titre
            story.append(Paragraph("Rapport de Simulation Immobilière", title_style))
            story.append(Spacer(1, 20))
            
            # Informations générales
            info_data = [
                ["Type de simulation", data.get("type", "Standard")],
                ["Date", datetime.now().strftime("%d/%m/%Y")],
                ["Montant du bien", f"{data.get('prix_bien', 0):,.0f} €"],
                ["Apport", f"{data.get('apport', 0):,.0f} €"],
                ["Montant emprunté", f"{data.get('montant_emprunte', 0):,.0f} €"]
            ]
            
            info_table = Table(info_data, colWidths=[200, 200])
            info_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.white),
                ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.lightgrey, colors.white]),
                ('PADDING', (0, 0), (-1, -1), 10),
            ]))
            
            story.append(info_table)
            story.append(Spacer(1, 30))
            
            # Résultats selon le type
            if data.get("type") == "multi_offer" and "comparisons" in data:
                story.append(Paragraph("Comparaison des Offres", styles['Heading2']))
                story.append(Spacer(1, 10))
                
                # Tableau des offres
                offer_data = [["Banque", "Taux", "Durée", "Mensualité", "Coût total", "Économie"]]
                
                for offer in data["comparisons"]:
                    offer_data.append([
                        offer["bank_name"],
                        f"{offer['taux']}%",
                        f"{offer['duree']} mois",
                        f"{offer['mensualite_totale']:,.0f} €",
                        f"{offer['cout_total']:,.0f} €",
                        f"{offer.get('economie', 0):,.0f} €"
                    ])
                
                offer_table = Table(offer_data, colWidths=[100, 60, 60, 80, 80, 80])
                offer_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
                ]))
                
                story.append(offer_table)
            
            elif data.get("type") == "optimization" and "alternatives" in data:
                story.append(Paragraph("Optimisation Apport/Durée", styles['Heading2']))
                story.append(Spacer(1, 10))
                
                opt_data = [["Apport", "Durée", "Mensualité", "Coût total", "Taux d'effort"]]
                
                for alt in data["alternatives"][:5]:
                    opt_data.append([
                        f"{alt['apport']:,.0f} € ({alt['apport_pct']}%)",
                        f"{alt['duree']} mois",
                        f"{alt['mensualite']:,.0f} €",
                        f"{alt['cout_total']:,.0f} €",
                        f"{alt['taux_effort']}%"
                    ])
                
                opt_table = Table(opt_data, colWidths=[120, 80, 80, 100, 80])
                opt_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
                ]))
                
                story.append(opt_table)
            
            # Générer le PDF
            doc.build(story)
            
            # Retourner le fichier
            return FileResponse(
                tmp_file.name,
                media_type='application/pdf',
                filename=f"simulation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération du PDF: {str(e)}")

@app.post("/export/csv")
async def export_csv(data: dict):
    """Export CSV des données - Gratuit"""
    try:
        import csv
        import tempfile
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv', newline='') as tmp_file:
            writer = csv.writer(tmp_file)
            
            # En-têtes généraux
            writer.writerow(["Simulation Immobilière - Export CSV"])
            writer.writerow(["Date", datetime.now().strftime("%d/%m/%Y %H:%M")])
            writer.writerow([])
            
            # Données selon le type
            if data.get("type") == "multi_offer" and "comparisons" in data:
                writer.writerow(["Comparaison Multi-Offres"])
                writer.writerow(["Banque", "Taux (%)", "Durée (mois)", "Mensualité (€)", "Coût total (€)"])
                
                for offer in data["comparisons"]:
                    writer.writerow([
                        offer["bank_name"],
                        offer["taux"],
                        offer["duree"],
                        offer["mensualite_totale"],
                        offer["cout_total"]
                    ])
            
            elif data.get("type") == "basic":
                writer.writerow(["Simulation Basique"])
                writer.writerow(["Paramètre", "Valeur"])
                writer.writerow(["Montant emprunté", data.get("montant", 0)])
                writer.writerow(["Mensualité", data.get("mensualite_max", 0)])
                writer.writerow(["Coût total", data.get("cout_total", 0)])
                writer.writerow(["Coût du crédit", data.get("cout_credit", 0)])
            
            tmp_file.flush()
            
            return FileResponse(
                tmp_file.name,
                media_type='text/csv',
                filename=f"simulation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération du CSV: {str(e)}")

@app.post("/scenarios/save")
async def save_scenario(data: ScenarioSaveRequest):
    """Sauvegarder un scénario (stockage côté client)"""
    # Dans une vraie app, on sauvegarderait en DB
    # Ici on retourne juste un ID unique pour le localStorage
    scenario_id = f"scenario_{datetime.now().timestamp()}"
    
    return {
        "id": scenario_id,
        "name": data.name,
        "type": data.type,
        "created_at": datetime.now().isoformat(),
        "message": "Scénario prêt à être sauvegardé dans le navigateur"
    }

@app.get("/scenarios/list")
async def list_scenarios():
    """Liste des scénarios (pour future implémentation avec auth)"""
    # Placeholder pour future implémentation avec authentification
    return {
        "scenarios": [],
        "message": "Les scénarios sont stockés localement dans votre navigateur"
    }