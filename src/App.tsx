import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./components/paysec/WalletContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Send from "./pages/Send";
import Received from "./pages/Received";
import Invoices from "./pages/Invoices";
import Payroll from "./pages/Payroll";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/send" element={<Send />} />
          <Route path="/received" element={<Received />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </WalletProvider>
    </BrowserRouter>
  );
}
