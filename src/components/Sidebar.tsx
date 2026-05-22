import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Droplets, 
  HeartHandshake, 
  Settings, 
  PlusCircle 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../context/AuthContext';

type Role = 'admin' | 'donor' | 'hospital';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewDonation: () => void;
  allowedTabs?: string[];
}

const ROLE_TABS: Record<Role, string[]> = {
  admin: ['dashboard', 'inventory', 'donors', 'requests', 'donations', 'settings'],
  donor: ['donors'],
  hospital: ['requests', 'donations'],
};

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onNewDonation, allowedTabs }) => {
  const { user } = useAuth();

  const userRole = user?.role || 'donor';
  const accessibleTabs = allowedTabs || ROLE_TABS[userRole];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'donors', label: 'Donors', icon: Users },
    { id: 'requests', label: 'Requests', icon: Droplets },
    { id: 'donations', label: 'Donations', icon: HeartHandshake },
    { id: 'settings', label: 'Settings', icon: Settings },
  ].filter(item => accessibleTabs.includes(item.id));

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col py-4 space-y-2 z-50 border-r border-surface-container-high/30">
      <div className="px-6 mb-8 mt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Droplets className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 font-headline leading-none">Central Blood Bank</h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-1">
              {user?.role === 'admin' ? 'Clinical Administrator' : user?.role === 'donor' ? 'Donor Portal' : 'Hospital Portal'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 rounded-lg text-[11px] font-semibold uppercase tracking-wider",
              activeTab === item.id 
                ? "bg-white text-secondary shadow-sm translate-x-1" 
                : "text-slate-500 hover:text-secondary"
            )}
          >
            <item.icon className={cn("w-5 h-5", activeTab === item.id && "fill-current")} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-4 mt-auto pb-4">
        <button onClick={onNewDonation} className="w-full blood-gradient text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-95 transition-all duration-150 hover:scale-[1.02]">
          <PlusCircle className="w-4 h-4" />
          New Donation
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
