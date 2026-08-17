import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import { store } from "./redux/store";
import { GeneralContextProvider } from "./components/Trade/GeneralContext";
import Home from "./components/Home/Home";
import Summary from "./components/Dashboard/Summary/Summary";
import Orders from "./components/Dashboard/Orders/Orders";
import Holdings from "./components/Dashboard/Holdings/Holdings";
import Positions from "./components/Dashboard/Positions/Positions";
import Funds from "./components/Dashboard/Funds/Funds";
import Apps from "./components/Dashboard/Apps/Apps";
import NotFound from "./components/NotFound/NotFound";
import StockDetailPanel from "./components/StockDetail/StockDetailPanel";
import MyAccount from "./components/Profile/MyAccount";
import ChangePassword from "./components/Profile/ChangePassword";
import SettingsPage from "./components/Profile/SettingsPage";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <GeneralContextProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<Home />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Summary />} />
              <Route path="dashboard/orders" element={<Orders />} />
              <Route path="dashboard/holdings" element={<Holdings />} />
              <Route path="dashboard/positions" element={<Positions />} />
              <Route path="dashboard/funds" element={<Funds />} />
              <Route path="dashboard/apps" element={<Apps />} />
              <Route path="stock/:symbol" element={<StockDetailPanel />} />
              <Route path="account" element={<MyAccount />} />
              <Route path="change-password" element={<ChangePassword />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </GeneralContextProvider>
    </Provider>
  </React.StrictMode>
);