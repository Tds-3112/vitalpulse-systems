import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/Toast';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import Donors from './components/Donors';
import InventoryView from './components/Inventory';
import Requests from './components/Requests';
import Donations from './components/Donations';
import Settings from './components/Settings';
import Modal from './components/Modal';
import { donationAPI } from './services/api';
import { cn } from '@/src/lib/utils';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const ROLE_TABS = {
  admin: ['dashboard', 'inventory', 'donors', 'requests', 'donations', 'settings'],
  donor: ['donors'],
  hospital: ['requests', 'donations'],
} as const;

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');

  const userRole = (user?.role || 'donor') as keyof typeof ROLE_TABS;
  const allowedTabs: readonly string[] = ROLE_TABS[userRole];

  React.useEffect(() => {
    if (isAuthenticated && userRole === 'donor' && allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
      setActiveTab('donors');
    }
  }, [isAuthenticated, userRole, allowedTabs, activeTab]);

  // New Donation modal (triggered from Sidebar button)
  const [showNewDonation, setShowNewDonation] = useState(false);
  const [donForm, setDonForm] = useState({ bloodGroup: '', donationType: 'Whole Blood', volume: 450, notes: '' });
  const [donSubmitting, setDonSubmitting] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading VitalPulse...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNewDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donForm.bloodGroup) { showToast('error', 'Please select a blood group'); return; }
    setDonSubmitting(true);
    try {
      await donationAPI.create({
        bloodGroup: donForm.bloodGroup,
        donationType: donForm.donationType,
        volume: donForm.volume,
        notes: donForm.notes || undefined,
      });
      showToast('success', 'Donation recorded successfully!');
      setShowNewDonation(false);
      setDonForm({ bloodGroup: '', donationType: 'Whole Blood', volume: 450, notes: '' });
      // Navigate to donations tab to see the new record
      setActiveTab('donations');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create donation');
    } finally {
      setDonSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'donors':
        return <Donors />;
      case 'inventory':
        return <InventoryView />;
      case 'requests':
        return <Requests />;
      case 'donations':
        return <Donations />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'VitalPulse Systems';
      case 'donors': return 'Donor Registry';
      case 'inventory': return 'Inventory Matrix';
      case 'requests': return 'Operational Queue';
      case 'donations': return 'Donation Lifecycle';
      case 'settings': return 'System Configuration';
      default: return 'VitalPulse Systems';
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onNewDonation={() => setShowNewDonation(true)} allowedTabs={allowedTabs} />
      
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <TopBar title={getTitle()} onNavigate={setActiveTab} allowedTabs={allowedTabs} />
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
        
        <footer className="px-8 py-6 border-t border-surface-container-high/30 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex justify-between items-center bg-surface-container-lowest/50">
          <span>© 2026 VitalPulse Clinical Systems • v4.2.0-stable</span>
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> System Online</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </footer>
      </main>

      {/* Global New Donation Modal (from Sidebar) */}
      <Modal isOpen={showNewDonation} onClose={() => setShowNewDonation(false)} title="Record New Donation" subtitle="Quick donation intake from sidebar">
        <form onSubmit={handleNewDonation} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blood Group *</label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button key={bg} type="button" onClick={() => setDonForm({ ...donForm, bloodGroup: bg })}
                  className={cn("py-2.5 rounded-lg text-xs font-bold transition-all",
                    donForm.bloodGroup === bg ? "bg-primary text-white shadow-sm" : "bg-surface-container-low text-slate-600 hover:bg-surface-container-high"
                  )}>
                  {bg}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Donation Type</label>
            <select value={donForm.donationType} onChange={(e) => setDonForm({ ...donForm, donationType: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20">
              <option>Whole Blood</option>
              <option>Platelets</option>
              <option>Plasma</option>
              <option>Double Red Cells</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volume (mL)</label>
            <input type="number" min={200} max={550} value={donForm.volume} onChange={(e) => setDonForm({ ...donForm, volume: +e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Notes (optional)</label>
            <textarea value={donForm.notes} onChange={(e) => setDonForm({ ...donForm, notes: e.target.value })} rows={2}
              className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowNewDonation(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 hover:bg-surface-container-low rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={donSubmitting}
              className="flex-1 py-2.5 blood-gradient text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {donSubmitting ? 'Recording...' : 'Record Donation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
