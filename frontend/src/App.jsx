import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Activity, Shield, Menu, X, Wallet, UserCheck, Bell, Scale, FileText, PlusCircle, Database, BarChart3 } from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import CreditsPage from './pages/CreditsPage';
import OperationsPage from './pages/OperationsPage';
import FederationPage from './pages/FederationPage';
import ComptesPage from './pages/ComptesPage';
import EmployesPage from './pages/EmployesPage';
import AlertesPage from './pages/AlertesPage';
import ReconciliationPage from './pages/ReconciliationPage';
import ClientFormPage from './pages/ClientFormPage';
import CreditFormPage from './pages/CreditFormPage';
import TransactionFormPage from './pages/TransactionFormPage';
import ClientDetailPage from './pages/ClientDetailPage';
import CreditDetailPage from './pages/CreditDetailPage';
import EcheanciersPage from './pages/EcheanciersPage';
import DatabasePage from './pages/DatabasePage';
import MonitoringPage from './pages/MonitoringPage';
import { getHealthCheck } from './api';

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [healthStatus, setHealthStatus] = useState('unknown');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await getHealthCheck();
        setHealthStatus(res.data.status);
      } catch {
        setHealthStatus('error');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Tableau de Bord' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/comptes', icon: Wallet, label: 'Comptes' },
    { path: '/credits', icon: CreditCard, label: 'Credits' },
    { path: '/echeanciers', icon: FileText, label: 'Echeanciers' },
    { path: '/operations', icon: Activity, label: 'Operations' },
    { path: '/employes', icon: UserCheck, label: 'Employes & Paie' },
    { path: '/alertes', icon: Bell, label: 'Alertes' },
    { path: '/reconciliation', icon: Scale, label: 'Reconciliation' },
    { path: '/federation', icon: Shield, label: 'Etat Federation' },
    { path: '/database', icon: Database, label: 'Bases de Donnees' },
    { path: '/monitoring', icon: BarChart3, label: 'Monitoring' },
  ];

  const formItems = [
    { path: '/new-client', icon: PlusCircle, label: 'Nouveau Client' },
    { path: '/new-credit', icon: PlusCircle, label: 'Nouveau Credit' },
    { path: '/new-transaction', icon: PlusCircle, label: 'Nouvelle Transaction' },
  ];

  const statusColor = healthStatus === 'healthy' ? 'bg-green-500' : healthStatus === 'degraded' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex h-screen bg-white">
      <aside className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#1e3a5f] text-white transition-transform duration-200 ease-in-out overflow-y-auto`}>
        <div className="flex items-center justify-between p-4 border-b border-[#c8a951]/30">
          <h1 className="text-lg font-bold">Banque du Togo</h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden">
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          <p className="text-xs text-gray-400 uppercase mb-2">Navigation</p>
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                location.pathname === path
                  ? 'bg-[#c8a951]/20 text-[#c8a951]'
                  : 'hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
          <p className="text-xs text-gray-400 uppercase mt-4 mb-2">Formulaires</p>
          {formItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                location.pathname === path
                  ? 'bg-[#c8a951]/20 text-[#c8a951]'
                  : 'hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between">
          <button onClick={() => setIsOpen(true)} className="md:hidden">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-600 dark:text-gray-300">Etat du systeme:</span>
            <div className={`w-3 h-3 rounded-full ${statusColor}`} title={healthStatus}></div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-white">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:icf" element={<ClientDetailPage />} />
            <Route path="/comptes" element={<ComptesPage />} />
            <Route path="/credits" element={<CreditsPage />} />
            <Route path="/credits/:id" element={<CreditDetailPage />} />
            <Route path="/echeanciers" element={<EcheanciersPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/employes" element={<EmployesPage />} />
            <Route path="/alertes" element={<AlertesPage />} />
            <Route path="/reconciliation" element={<ReconciliationPage />} />
            <Route path="/federation" element={<FederationPage />} />
            <Route path="/database" element={<DatabasePage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/new-client" element={<ClientFormPage />} />
            <Route path="/new-credit" element={<CreditFormPage />} />
            <Route path="/new-transaction" element={<TransactionFormPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navigation />
    </BrowserRouter>
  );
}
