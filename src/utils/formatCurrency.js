

export function formatCurrency(
  value,
  { decimals = 2, showSymbol = true } = {},
) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return showSymbol ? "₹0.00" : "0.00";
  }
  const formatted = Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return showSymbol ? `₹${formatted}` : formatted;
}

// Compact form for tight card spaces - 1245000 -> ₹12.45L, crosses into Cr above 1,00,00,000.
export function formatCompactCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return "₹0";
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `₹${(value / 1_000).toFixed(2)}K`;
  return formatCurrency(value, { decimals: 0 });
}

// Format compact numbers for volume, trades, etc.
// Examples: 1,500,000 -> 15L, 12,500,000 -> 1.3Cr, 5,000 -> 5K
export function formatCompactNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (num === 0) return "0";
  
  const absNum = Math.abs(num);
  
  // Crore (10,000,000)
  if (absNum >= 1_00_00_000) {
    return (num / 1_00_00_000).toFixed(1) + "Cr";
  }
  // Lakh (100,000)
  if (absNum >= 1_00_000) {
    return (num / 1_00_000).toFixed(1) + "L";
  }
  // Thousand (1,000)
  if (absNum >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }
  return num.toString();
}

// Format percentage values
export function formatPercent(value, { showSign = true } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return "0.00%";
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${Number(value).toFixed(2)}%`;
}

// Format large numbers with Indian number system (e.g., 1,23,456)
export function formatIndianNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return "0";
  
  const absNum = Math.abs(num);
  
  // Crore (10,000,000)
  if (absNum >= 1_00_00_000) {
    return (num / 1_00_00_000).toFixed(2) + " Cr";
  }
  // Lakh (100,000)
  if (absNum >= 1_00_000) {
    return (num / 1_00_000).toFixed(2) + " L";
  }
  // Thousand (1,000)
  if (absNum >= 1_000) {
    return (num / 1_000).toFixed(2) + " K";
  }
  return num.toFixed(2);
}

// Format with Indian number system (en-IN locale)
export function formatIndianCurrency(value, { decimals = 2, showSymbol = true } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return showSymbol ? "₹0.00" : "0.00";
  }
  const formatted = Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return showSymbol ? `₹${formatted}` : formatted;
}

// Short format for market highlights - keeps it clean and readable
export function formatMarketMetric(value, type = 'volume') {
  if (value === undefined || value === null || isNaN(value) || value === 0) {
    return '0';
  }
  
  const absValue = Math.abs(value);
  
  // For volume and trades
  if (type === 'volume' || type === 'trades') {
    if (absValue >= 1_00_00_000) {
      return (value / 1_00_00_000).toFixed(1) + 'Cr';
    }
    if (absValue >= 1_00_000) {
      return (value / 1_00_000).toFixed(1) + 'L';
    }
    if (absValue >= 1_000) {
      return (value / 1_000).toFixed(1) + 'K';
    }
    return value.toString();
  }
  
  // For monetary values (52W High/Low, price, etc.)
  if (type === 'currency') {
    if (absValue >= 1_00_00_000) {
      return '₹' + (value / 1_00_00_000).toFixed(1) + 'Cr';
    }
    if (absValue >= 1_00_000) {
      return '₹' + (value / 1_00_000).toFixed(1) + 'L';
    }
    if (absValue >= 1_000) {
      return '₹' + (value / 1_000).toFixed(1) + 'K';
    }
    return '₹' + value.toFixed(2);
  }
  
  // Default
  return value.toString();
}