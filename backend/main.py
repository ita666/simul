from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
import stripe
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # pour le dev, restreindre en prod !
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"msg": "Bienvenue sur Simulpret API"}

@app.post("/calculate")
async def calculate(data: dict):
    salaire = float(data.get("salaire", 0))
    charges = float(data.get("charges", 0))
    taux = float(data.get("taux", 0.03))
    duree = int(data.get("duree", 240))
    mensualite_max = salaire * 0.33 - charges
    if taux == 0: taux = 0.01
    montant = mensualite_max * (1 - (1 + taux/12) ** -duree) / (taux/12)
    return {"montant": round(montant, 2), "mensualite_max": round(mensualite_max, 2)}

@app.post("/track")
async def track(request: Request):
    evt = await request.json()
    print(f"LOG EVENT {evt}")
    return {"ok": True}

@app.post("/wallet/buy")
async def buy_credit(data: dict):
    mode = data.get("mode", "dev")
    amount = data.get("amount", 5)
    STRIPE_KEY = os.environ.get("STRIPE_SECRET", "")
    if mode == "dev" or not STRIPE_KEY:
        return {"success": True, "credits": amount}
    else:
        stripe.api_key = STRIPE_KEY
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {"name": "Simulpret Credits"},
                    "unit_amount": 100 * amount,
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url="http://localhost:5173?payment=success",
            cancel_url="http://localhost:5173?payment=cancel",
        )
        return {"checkout_url": session.url}
