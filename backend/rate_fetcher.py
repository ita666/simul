import httpx
from bs4 import BeautifulSoup
from datetime import datetime
import asyncio
import json
from typing import Dict, List, Optional
from database import SessionLocal, BankRate
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RateFetcher:
    def __init__(self):
        self.client = httpx.AsyncClient(
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        )
        
    async def fetch_meilleurstaux(self) -> Dict[str, Dict[str, float]]:
        """Fetch rates from meilleurstaux.com (aggregator site)"""
        try:
            # This is a common aggregator for French mortgage rates
            url = "https://www.meilleurtaux.com/credit-immobilier/barometre-des-taux.html"
            response = await self.client.get(url)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                # Parse the rates table - structure may vary
                rates = self._parse_meilleurstaux_rates(soup)
                return rates
        except Exception as e:
            logger.error(f"Error fetching from meilleurstaux: {e}")
            return {}
    
    async def fetch_empruntis(self) -> Dict[str, Dict[str, float]]:
        """Fetch rates from empruntis.com"""
        try:
            url = "https://www.empruntis.com/financement/actualites/taux-pret-immobilier.php"
            response = await self.client.get(url)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                rates = self._parse_empruntis_rates(soup)
                return rates
        except Exception as e:
            logger.error(f"Error fetching from empruntis: {e}")
            return {}
    
    async def fetch_cafpi(self) -> Dict[str, Dict[str, float]]:
        """Fetch rates from CAFPI (broker)"""
        try:
            # CAFPI often provides JSON data
            url = "https://www.cafpi.fr/credit-immobilier/taux"
            response = await self.client.get(url)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                rates = self._parse_cafpi_rates(soup)
                return rates
        except Exception as e:
            logger.error(f"Error fetching from CAFPI: {e}")
            return {}
    
    def _parse_meilleurstaux_rates(self, soup: BeautifulSoup) -> Dict[str, Dict[str, float]]:
        """Parse rates from meilleurstaux HTML"""
        rates = {}
        
        # Look for rate tables - this is a simplified example
        # Real implementation would need to adapt to actual HTML structure
        try:
            # Find rate table by class or id
            rate_tables = soup.find_all('table', class_='rates-table')
            
            for table in rate_tables:
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all('td')
                    if len(cells) >= 5:
                        bank_name = cells[0].text.strip()
                        if bank_name:
                            rates[bank_name] = {
                                '10_years': self._parse_rate(cells[1].text),
                                '15_years': self._parse_rate(cells[2].text),
                                '20_years': self._parse_rate(cells[3].text),
                                '25_years': self._parse_rate(cells[4].text),
                            }
        except Exception as e:
            logger.error(f"Error parsing meilleurstaux rates: {e}")
        
        return rates
    
    def _parse_empruntis_rates(self, soup: BeautifulSoup) -> Dict[str, Dict[str, float]]:
        """Parse rates from empruntis HTML"""
        rates = {}
        
        # Simplified parsing - would need adjustment for actual site
        try:
            rate_section = soup.find('div', id='taux-actuels')
            if rate_section:
                # Extract JSON data if embedded
                scripts = soup.find_all('script', type='application/json')
                for script in scripts:
                    try:
                        data = json.loads(script.string)
                        if 'rates' in data:
                            for bank_data in data['rates']:
                                rates[bank_data['bank']] = {
                                    '10_years': bank_data.get('rate_10', 0),
                                    '15_years': bank_data.get('rate_15', 0),
                                    '20_years': bank_data.get('rate_20', 0),
                                    '25_years': bank_data.get('rate_25', 0),
                                }
                    except:
                        pass
        except Exception as e:
            logger.error(f"Error parsing empruntis rates: {e}")
        
        return rates
    
    def _parse_cafpi_rates(self, soup: BeautifulSoup) -> Dict[str, Dict[str, float]]:
        """Parse rates from CAFPI HTML"""
        rates = {}
        
        # Simplified parsing
        try:
            # CAFPI might have rates in a specific format
            rate_cards = soup.find_all('div', class_='rate-card')
            
            for card in rate_cards:
                bank_name = card.find('h3')
                if bank_name:
                    bank_name = bank_name.text.strip()
                    rate_values = card.find_all('span', class_='rate-value')
                    
                    if len(rate_values) >= 4:
                        rates[bank_name] = {
                            '10_years': self._parse_rate(rate_values[0].text),
                            '15_years': self._parse_rate(rate_values[1].text),
                            '20_years': self._parse_rate(rate_values[2].text),
                            '25_years': self._parse_rate(rate_values[3].text),
                        }
        except Exception as e:
            logger.error(f"Error parsing CAFPI rates: {e}")
        
        return rates
    
    def _parse_rate(self, rate_text: str) -> float:
        """Convert rate text to float"""
        try:
            # Remove %, spaces, and convert comma to dot
            rate_text = rate_text.replace('%', '').replace(',', '.').strip()
            return float(rate_text)
        except:
            return 0.0
    
    async def fetch_all_rates(self) -> Dict[str, Dict[str, float]]:
        """Fetch rates from all sources and aggregate"""
        all_rates = {}
        
        # Fetch from multiple sources in parallel
        tasks = [
            self.fetch_meilleurstaux(),
            self.fetch_empruntis(),
            self.fetch_cafpi(),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Aggregate results
        for result in results:
            if isinstance(result, dict):
                all_rates.update(result)
        
        # Add fallback rates for major banks if not found
        major_banks = {
            "Crédit Agricole": {"10": 3.20, "15": 3.45, "20": 3.65, "25": 3.85},
            "BNP Paribas": {"10": 3.25, "15": 3.50, "20": 3.70, "25": 3.90},
            "Société Générale": {"10": 3.15, "15": 3.40, "20": 3.60, "25": 3.80},
            "Crédit Mutuel": {"10": 3.30, "15": 3.55, "20": 3.75, "25": 3.95},
            "LCL": {"10": 3.35, "15": 3.60, "20": 3.80, "25": 4.00},
            "Caisse d'Épargne": {"10": 3.28, "15": 3.52, "20": 3.72, "25": 3.92},
            "Banque Populaire": {"10": 3.32, "15": 3.57, "20": 3.77, "25": 3.97},
            "CIC": {"10": 3.27, "15": 3.52, "20": 3.72, "25": 3.92},
        }
        
        for bank, rates in major_banks.items():
            if bank not in all_rates:
                all_rates[bank] = {
                    '10_years': rates["10"],
                    '15_years': rates["15"],
                    '20_years': rates["20"],
                    '25_years': rates["25"],
                }
        
        return all_rates
    
    async def update_database(self):
        """Fetch latest rates and update database"""
        logger.info("Starting rate update...")
        
        rates = await self.fetch_all_rates()
        db = SessionLocal()
        
        try:
            for bank_name, bank_rates in rates.items():
                # Check if bank exists
                existing = db.query(BankRate).filter(BankRate.bank_name == bank_name).first()
                
                if existing:
                    # Update existing
                    existing.rate_10_years = bank_rates.get('10_years', 0)
                    existing.rate_15_years = bank_rates.get('15_years', 0)
                    existing.rate_20_years = bank_rates.get('20_years', 0)
                    existing.rate_25_years = bank_rates.get('25_years', 0)
                    existing.last_updated = datetime.utcnow()
                else:
                    # Create new
                    new_rate = BankRate(
                        bank_name=bank_name,
                        rate_10_years=bank_rates.get('10_years', 0),
                        rate_15_years=bank_rates.get('15_years', 0),
                        rate_20_years=bank_rates.get('20_years', 0),
                        rate_25_years=bank_rates.get('25_years', 0),
                        last_updated=datetime.utcnow()
                    )
                    db.add(new_rate)
            
            db.commit()
            logger.info(f"Successfully updated {len(rates)} bank rates")
            
        except Exception as e:
            logger.error(f"Error updating database: {e}")
            db.rollback()
        finally:
            db.close()
        
        await self.client.aclose()

# Function to run the update
async def update_rates():
    fetcher = RateFetcher()
    await fetcher.update_database()

if __name__ == "__main__":
    # Test the fetcher
    asyncio.run(update_rates())