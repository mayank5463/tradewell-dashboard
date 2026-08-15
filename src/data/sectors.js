// sectors.js - With manual symbol to sector mapping
// This allows you to map Upstox symbols to sectors

import BankIcon from "../assets/sectors/bank.svg";
import FinancialIcon from "../assets/sectors/financial.svg";
import AutoIcon from "../assets/sectors/auto.svg";
import HealthcareIcon from "../assets/sectors/healthcare.svg";
import ItIcon from "../assets/sectors/it.svg";
import PetroleumIcon from "../assets/sectors/petroleum.svg";
import MetalsIcon from "../assets/sectors/metals.svg";
import PowerIcon from "../assets/sectors/power.svg";
import ConsumerIcon from "../assets/sectors/consumer.svg";
import ConstructionIcon from "../assets/sectors/construction.svg";
import CapitalIcon from "../assets/sectors/capital.svg";
import TelecomIcon from "../assets/sectors/telecom.svg";
import RealtyIcon from "../assets/sectors/realty.svg";
import DefenseIcon from "../assets/sectors/defense.svg";
import ChemicalsIcon from "../assets/sectors/chemicals.svg";
import TextilesIcon from "../assets/sectors/textiles.svg";
import MediaIcon from "../assets/sectors/media.svg";
import LogisticsIcon from "../assets/sectors/logistics.svg";
import FoodIcon from "../assets/sectors/food.svg";
import InsuranceIcon from "../assets/sectors/insurance.svg";

// India's Top 20 Most Important Sectors
export const SECTORS = [
  {
    id: "banks",
    name: "Banks",
    icon: BankIcon,
    iconAlt: "🏛️",
    color: "#2563eb",
    weightage: "12.46%",
    companies: 34,
    description: "Financial backbone of India's economy"
  },
  {
    id: "financial-services",
    name: "Financial Services",
    icon: FinancialIcon,
    iconAlt: "📊",
    color: "#7c3aed",
    weightage: "8.04%",
    companies: 54,
    description: "NBFCs, asset management, and brokerage firms"
  },
  {
    id: "automobiles",
    name: "Automobiles",
    icon: AutoIcon,
    iconAlt: "🚗",
    color: "#ef4444",
    weightage: "7.73%",
    companies: 54,
    description: "India's largest manufacturing sector"
  },
  {
    id: "healthcare",
    name: "Healthcare",
    icon: HealthcareIcon,
    iconAlt: "🏥",
    color: "#10b981",
    weightage: "7.29%",
    companies: 56,
    description: "Pharma, hospitals, and medical equipment"
  },
  {
    id: "information-technology",
    name: "Information Technology",
    icon: ItIcon,
    iconAlt: "💻",
    color: "#06b6d4",
    weightage: "5.94%",
    companies: 36,
    description: "India's global IT services powerhouse"
  },
  {
    id: "petroleum-products",
    name: "Petroleum Products",
    icon: PetroleumIcon,
    iconAlt: "🛢️",
    color: "#f59e0b",
    weightage: "5.01%",
    companies: 7,
    description: "Refining and oil marketing companies"
  },
  {
    id: "metals-mining",
    name: "Metals & Mining",
    icon: MetalsIcon,
    iconAlt: "⚒️",
    color: "#f97316",
    weightage: "4.76%",
    companies: 23,
    description: "Steel, aluminum, and mineral extraction"
  },
  {
    id: "power",
    name: "Power",
    icon: PowerIcon,
    iconAlt: "⚡",
    color: "#14b8a6",
    weightage: "4.73%",
    companies: 21,
    description: "Electricity generation and distribution"
  },
  {
    id: "consumer-goods",
    name: "Consumer Goods",
    icon: ConsumerIcon,
    iconAlt: "🛍️",
    color: "#ec4899",
    weightage: "4.45%",
    companies: 56,
    description: "FMCG, durables, and retail products"
  },
  {
    id: "construction",
    name: "Construction",
    icon: ConstructionIcon,
    iconAlt: "🏗️",
    color: "#78716c",
    weightage: "3.98%",
    companies: 39,
    description: "Infrastructure and real estate development"
  },
  {
    id: "capital-goods",
    name: "Capital Goods",
    icon: CapitalIcon,
    iconAlt: "🏭",
    color: "#6b7280",
    weightage: "3.95%",
    companies: 44,
    description: "Industrial machinery and equipment"
  },
  {
    id: "telecom",
    name: "Telecom",
    icon: TelecomIcon,
    iconAlt: "📱",
    color: "#8b5cf6",
    weightage: "3.78%",
    companies: 13,
    description: "Mobile and internet service providers"
  },
  {
    id: "realty",
    name: "Realty",
    icon: RealtyIcon,
    iconAlt: "🏠",
    color: "#f97316",
    weightage: "1.49%",
    companies: 16,
    description: "Residential and commercial real estate"
  },
  {
    id: "aerospace-defense",
    name: "Aerospace & Defense",
    icon: DefenseIcon,
    iconAlt: "✈️",
    color: "#1e293b",
    weightage: "2.38%",
    companies: 14,
    description: "Defense manufacturing and aerospace"
  },
  {
    id: "chemicals",
    name: "Chemicals",
    icon: ChemicalsIcon,
    iconAlt: "🧪",
    color: "#14b8a6",
    weightage: "2.27%",
    companies: 43,
    description: "Industrial and specialty chemicals"
  },
  {
    id: "textiles",
    name: "Textiles",
    icon: TextilesIcon,
    iconAlt: "🧵",
    color: "#a855f7",
    weightage: "0.41%",
    companies: 12,
    description: "Garment and textile manufacturing"
  },
  {
    id: "media-entertainment",
    name: "Media & Entertainment",
    icon: MediaIcon,
    iconAlt: "📺",
    color: "#e11d48",
    weightage: "0.21%",
    companies: 8,
    description: "Television, film, and digital media"
  },
  {
    id: "logistics",
    name: "Logistics",
    icon: LogisticsIcon,
    iconAlt: "🚚",
    color: "#2563eb",
    weightage: "0.23%",
    companies: 5,
    description: "Shipping, cargo, and supply chain"
  },
  {
    id: "food-agriculture",
    name: "Food & Agriculture",
    icon: FoodIcon,
    iconAlt: "🌾",
    color: "#22c55e",
    weightage: "1.12%",
    companies: 11,
    description: "Food processing and agri-products"
  },
  {
    id: "insurance",
    name: "Insurance",
    icon: InsuranceIcon,
    iconAlt: "🛡️",
    color: "#f59e0b",
    weightage: "2.87%",
    companies: 12,
    description: "Life and general insurance providers"
  }
];

// ============================================================
// IMPORTANT: MANUAL SYMBOL TO SECTOR MAPPING
// Add your Upstox symbols here to map them to sectors
// ============================================================

export const SYMBOL_TO_SECTOR = {
  // BANKS
  "SBIN": "Banks",
  "HDFCBANK": "Banks",
  "ICICIBANK": "Banks",
  "KOTAKBANK": "Banks",
  "AXISBANK": "Banks",
  "INDUSINDBK": "Banks",
  "YESBANK": "Banks",
  "BANKBARODA": "Banks",
  "PNB": "Banks",
  "IDFCFIRSTB": "Banks",
  "FEDERALBNK": "Banks",
  "RBLBANK": "Banks",
  "BANKINDIA": "Banks",
  "CANBK": "Banks",
  "UNIONBANK": "Banks",
  
  // FINANCIAL SERVICES
  "HDFC": "Financial Services",
  "BAJFINANCE": "Financial Services",
  "BAJAJFINSV": "Financial Services",
  "SRTRANSFIN": "Financial Services",
  "CHOLAFIN": "Financial Services",
  "MUTHOOTFIN": "Financial Services",
  "L&TFH": "Financial Services",
  "PFC": "Financial Services",
  "RECLTD": "Financial Services",
  "POWERFIN": "Financial Services",
  "IIFL": "Financial Services",
  "MFSL": "Financial Services",
  
  // AUTOMOBILES
  "MARUTI": "Automobiles",
  "TATAMOTORS": "Automobiles",
  "M&M": "Automobiles",
  "HEROMOTOCO": "Automobiles",
  "BAJAJ-AUTO": "Automobiles",
  "TVSMOTOR": "Automobiles",
  "EICHERMOT": "Automobiles",
  "ASHOKLEY": "Automobiles",
  "ESCORTS": "Automobiles",
  "BOSCHLTD": "Automobiles",
  "MRF": "Automobiles",
  "APOLLOTYRE": "Automobiles",
  "CEATLTD": "Automobiles",
  "MOTHERSUMI": "Automobiles",
  "TIINDIA": "Automobiles",
  
  // HEALTHCARE
  "SUNPHARMA": "Healthcare",
  "DRREDDY": "Healthcare",
  "CIPLA": "Healthcare",
  "DIVISLAB": "Healthcare",
  "TORNTPHARM": "Healthcare",
  "ZYDUSLIFE": "Healthcare",
  "APOLLOHOSP": "Healthcare",
  "FORTIS": "Healthcare",
  "LUPIN": "Healthcare",
  "AUROPHARMA": "Healthcare",
  "BIOCON": "Healthcare",
  "GODREJCP": "Healthcare",
  "PFIZER": "Healthcare",
  "NATCOPHARM": "Healthcare",
  "CADILAHC": "Healthcare",
  
  // INFORMATION TECHNOLOGY
  "TCS": "Information Technology",
  "INFY": "Information Technology",
  "HCLTECH": "Information Technology",
  "WIPRO": "Information Technology",
  "TECHM": "Information Technology",
  "LTTS": "Information Technology",
  "MPHASIS": "Information Technology",
  "MINDTREE": "Information Technology",
  "COFORGE": "Information Technology",
  "PERSISTENT": "Information Technology",
  "ZENSARTECH": "Information Technology",
  "INFOSYS": "Information Technology",
  "TATAELXSI": "Information Technology",
  "CYIENT": "Information Technology",
  
  // PETROLEUM PRODUCTS
  "RELIANCE": "Petroleum Products",
  "ONGC": "Petroleum Products",
  "IOC": "Petroleum Products",
  "BPCL": "Petroleum Products",
  "HPCL": "Petroleum Products",
  "GAIL": "Petroleum Products",
  "PETRONET": "Petroleum Products",
  "CASTROL": "Petroleum Products",
  "GUJGAS": "Petroleum Products",
  "IGL": "Petroleum Products",
  "MGL": "Petroleum Products",
  
  // METALS & MINING
  "TATASTEEL": "Metals & Mining",
  "JSWSTEEL": "Metals & Mining",
  "HINDALCO": "Metals & Mining",
  "VEDL": "Metals & Mining",
  "JINDALSTEL": "Metals & Mining",
  "NMDC": "Metals & Mining",
  "SAIL": "Metals & Mining",
  "COALINDIA": "Metals & Mining",
  "MOIL": "Metals & Mining",
  "JSPL": "Metals & Mining",
  
  // POWER
  "NTPC": "Power",
  "POWERGRID": "Power",
  "ADANIPOWER": "Power",
  "TATAPOWER": "Power",
  "JSWENERGY": "Power",
  "NHPC": "Power",
  "SIEMENS": "Power",
  "BHEL": "Power",
  "TORNTPOWER": "Power",
  "CESC": "Power",
  
  // CONSUMER GOODS
  "HINDUNILVR": "Consumer Goods",
  "ITC": "Consumer Goods",
  "NESTLEIND": "Consumer Goods",
  "BRITANNIA": "Consumer Goods",
  "DABUR": "Consumer Goods",
  "MARICO": "Consumer Goods",
  "EMAMILTD": "Consumer Goods",
  "GODREJCP": "Consumer Goods",
  "COLPAL": "Consumer Goods",
  "PGHH": "Consumer Goods",
  "TITAN": "Consumer Goods",
  "WHIRLPOOL": "Consumer Goods",
  "BLUESTAR": "Consumer Goods",
  "HAVELLS": "Consumer Goods",
  "VOLTAS": "Consumer Goods",
  
  // CONSTRUCTION
  "L&T": "Construction",
  "LARSEN": "Construction",
  "IRB": "Construction",
  "NBCC": "Construction",
  "AFCONS": "Construction",
  "KNR": "Construction",
  "PNCINFRA": "Construction",
  "GMRINFRA": "Construction",
  "ADANIPORTS": "Construction",
  "NAVINFLUOR": "Construction",
  
  // CAPITAL GOODS
  "ABB": "Capital Goods",
  "BHEL": "Capital Goods",
  "SIEMENS": "Capital Goods",
  "KIRLOSKAR": "Capital Goods",
  "THERMAX": "Capital Goods",
  "CROMPTON": "Capital Goods",
  "HAVELLS": "Capital Goods",
  "LTTS": "Capital Goods",
  
  // TELECOM
  "BHARTIARTL": "Telecom",
  "TATACOMM": "Telecom",
  "IDEA": "Telecom",
  "JIO": "Telecom",
  "MTNL": "Telecom",
  "VODAFONE": "Telecom",
  
  // REALTY
  "DLF": "Realty",
  "GODREJPROP": "Realty",
  "OBEROIRLTY": "Realty",
  "PRESTIGE": "Realty",
  "SOBHA": "Realty",
  "BRIGADE": "Realty",
  "PHOENIXLTD": "Realty",
  
  // AEROSPACE & DEFENSE
  "HAL": "Aerospace & Defense",
  "BEL": "Aerospace & Defense",
  "BHEL": "Aerospace & Defense",
  "MAZDA": "Aerospace & Defense",
  "ASTRA": "Aerospace & Defense",
  "ADANI": "Aerospace & Defense",
  
  // CHEMICALS
  "UPL": "Chemicals",
  "PIIND": "Chemicals",
  "BASF": "Chemicals",
  "GODREJAGRO": "Chemicals",
  "INDIAGLYCO": "Chemicals",
  "AARTIIND": "Chemicals",
  "DEEPAKNTR": "Chemicals",
  "SOLARINDS": "Chemicals",
  "TATACHEM": "Chemicals",
  "RALLIS": "Chemicals",
  
  // TEXTILES
  "PAGEIND": "Textiles",
  "TRENT": "Textiles",
  "RAYMOND": "Textiles",
  "KPRMILL": "Textiles",
  "ALOKTEXT": "Textiles",
  "APOLLO": "Textiles",
  "ARVIND": "Textiles",
  
  // MEDIA & ENTERTAINMENT
  "ZEEL": "Media & Entertainment",
  "SUNTV": "Media & Entertainment",
  "PVR": "Media & Entertainment",
  "INOX": "Media & Entertainment",
  "TV18": "Media & Entertainment",
  "DISHTV": "Media & Entertainment",
  "NETWORK18": "Media & Entertainment",
  
  // LOGISTICS
  "ADANIPORTS": "Logistics",
  "CONCOR": "Logistics",
  "GMRINFRA": "Logistics",
  "DALMIA": "Logistics",
  "APSEZ": "Logistics",
  
  // FOOD & AGRICULTURE
  "KRBL": "Food & Agriculture",
  "COFCO": "Food & Agriculture",
  "NESTLE": "Food & Agriculture",
  "BRITANNIA": "Food & Agriculture",
  "GODREJAGRO": "Food & Agriculture",
  "KAVERISEED": "Food & Agriculture",
  "MCDOWELL": "Food & Agriculture",
  
  // INSURANCE
  "LIC": "Insurance",
  "HDFCLIFE": "Insurance",
  "SBI LIFE": "Insurance",
  "ICICIPRULI": "Insurance",
  "SBILIFE": "Insurance",
  "ICICIGI": "Insurance",
  "STARHEALTH": "Insurance"
};

// Get sector for a symbol (with fallback)
export const getSectorForSymbol = (symbol) => {
  if (!symbol) return null;
  const upperSymbol = symbol.toUpperCase();
  return SYMBOL_TO_SECTOR[upperSymbol] || null;
};