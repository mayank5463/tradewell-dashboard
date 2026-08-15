import { useState, useCallback, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { SECTORS, getSectorForSymbol } from "../../../data/sectors";
import StockLogo from "../../common/StockLogo";
import { formatCurrency, formatPercent } from "../../../utils/formatCurrency";
import "./SectorStocks.css";

function SectorTile({ sector, isActive, onClick, stockCount }) {
  return (
    <button
      className={`sector-tile ${isActive ? "active" : ""}`}
      onClick={onClick}
      style={{ "--sector-color": sector.color }}
    >
      <div className="sector-tile__icon-wrapper">
        {sector.icon ? (
          <img 
            src={sector.icon} 
            alt={sector.name} 
            className="sector-tile__icon"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent) {
                parent.innerHTML = `<span style="font-size: 28px;">${sector.iconAlt || '📊'}</span>`;
              }
            }}
          />
        ) : (
          <span style={{ fontSize: '28px' }}>{sector.iconAlt || '📊'}</span>
        )}
      </div>
      <span className="sector-tile__name">{sector.name}</span>
      <span className="sector-tile__weight">{stockCount || 0}</span>
    </button>
  );
}

function StockItem({ stock, onClick }) {
  const isUp = stock.dayChangePercent >= 0;
  return (
    <button className="stock-item" onClick={() => onClick(stock.symbol)}>
      <div className="stock-item__identity">
        <StockLogo symbol={stock.symbol} logoUrl={stock.logoUrl} size={28} />
        <div className="stock-item__info">
          <span className="stock-item__symbol">{stock.symbol}</span>
          <span className="stock-item__name">{stock.name || stock.symbol}</span>
        </div>
      </div>
      <div className="stock-item__metrics">
        <span className="stock-item__price">{formatCurrency(stock.ltp)}</span>
        <span className={`stock-item__change ${isUp ? "is-up" : "is-down"}`}>
          {isUp ? "+" : ""}{stock.dayChangePercent?.toFixed(2) || "0.00"}%
        </span>
      </div>
    </button>
  );
}

export default function SectorStocks() {
  const navigate = useNavigate();
  const allStocks = useSelector((state) => state.market.stocks || []);
  const [activeSectorId, setActiveSectorId] = useState(SECTORS[0]?.id || null);

  // Group stocks by sector using symbol mapping
  const sectorStockMap = useMemo(() => {
    const map = {};
    
    // Initialize all sectors with empty arrays
    SECTORS.forEach(sector => {
      map[sector.id] = [];
    });
    map['other'] = [];

    if (!allStocks.length) {
      return map;
    }

    allStocks.forEach((stock) => {
      // Try to find sector from symbol mapping
      let sectorName = getSectorForSymbol(stock.symbol);
      
      // If not found, try to use sector field if available
      if (!sectorName && (stock.sector || stock.industry)) {
        sectorName = stock.sector || stock.industry;
      }
      
      // Find the sector ID
      let sectorId = 'other';
      if (sectorName) {
        const foundSector = SECTORS.find(s => s.name === sectorName);
        if (foundSector) {
          sectorId = foundSector.id;
        }
      }

      // Add stock to the sector
      if (!map[sectorId]) {
        map[sectorId] = [];
      }
      map[sectorId].push(stock);
    });

    return map;
  }, [allStocks]);

  const activeSector = SECTORS.find(s => s.id === activeSectorId);
  const activeStocks = sectorStockMap[activeSectorId] || [];

  const goToStock = useCallback((symbol) => {
    navigate(`/stock/${symbol}`);
  }, [navigate]);

  // Calculate total mapped stocks
  const mappedCount = Object.values(sectorStockMap).reduce(
    (sum, arr) => sum + arr.length, 0
  );

  return (
    <div className="sector-stocks">
      <div className="sector-stocks__header">
        <h3 className="sector-stocks__title">📈 Stocks by Sector</h3>
        <span className="sector-stocks__subtitle">
          {mappedCount} mapped stocks • {SECTORS.length} sectors
        </span>
      </div>

      <div className="sector-stocks__tiles">
        {SECTORS.map((sector) => {
          const count = sectorStockMap[sector.id]?.length || 0;
          return (
            <SectorTile
              key={sector.id}
              sector={sector}
              isActive={activeSectorId === sector.id}
              onClick={() => setActiveSectorId(sector.id)}
              stockCount={count}
            />
          );
        })}
      </div>

      {activeSector && (
        <div className="sector-stocks__detail">
          <div className="sector-stocks__detail-header">
            <div className="sector-stocks__detail-title">
              <div className="sector-stocks__detail-icon-wrapper">
                {activeSector.icon ? (
                  <img 
                    src={activeSector.icon} 
                    alt={activeSector.name}
                    className="sector-stocks__detail-icon"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span style="font-size: 24px;">${activeSector.iconAlt || '📊'}</span>`;
                      }
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '24px' }}>{activeSector.iconAlt || '📊'}</span>
                )}
              </div>
              <h4>{activeSector.name}</h4>
              <span className="sector-stocks__detail-badge">
                {activeStocks.length} stocks
              </span>
            </div>
            <div className="sector-stocks__detail-meta">
              <span>Weight: {activeSector.weightage}</span>
              <span>Companies: {activeSector.companies}</span>
            </div>
          </div>

          <div className="sector-stocks__detail-list">
            {activeStocks.length === 0 ? (
              <div className="sector-stocks__empty">
                <span>📭</span>
                <p>No stocks mapped to this sector yet</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Add symbols to SYMBOL_TO_SECTOR in sectors.js
                </p>
              </div>
            ) : (
              activeStocks.map((stock) => (
                <StockItem key={stock.symbol} stock={stock} onClick={goToStock} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}