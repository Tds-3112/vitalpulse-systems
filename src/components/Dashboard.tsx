import React, { useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip 
} from 'recharts';
import { 
  Users, Droplets, Clock, AlertTriangle, 
  ArrowRight, Hospital, CheckCircle2, History, Loader2, Plus, X 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useInventory, useDonations, useRequests, useDonors } from '../hooks/useApi';
import { donationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import Modal from './Modal';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const GROUP_COLORS: Record<string, string> = {
  'O+': '#93000b', 'O-': '#b91c1c', 'A+': '#3755c3', 'A-': '#5b6abf',
  'B+': '#005136', 'B-': '#2d8a6e', 'AB+': '#7c5800', 'AB-': '#a67c00',
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data: inventory, loading: invLoading } = useInventory();
  const { data: donations, loading: donLoading, refetch: refetchDonations } = useDonations();
  const { data: requests, loading: reqLoading } = useRequests();
  const { data: donors, loading: donorLoading } = useDonors();

  // New Donation Modal
  const [showNewDonation, setShowNewDonation] = useState(false);
  const [donForm, setDonForm] = useState({ bloodGroup: '', donationType: 'Whole Blood', volume: 450, notes: '' });
  const [donSubmitting, setDonSubmitting] = useState(false);

  const loading = invLoading || donLoading || reqLoading || donorLoading;

  const totalUnits = (inventory as any[]).reduce((sum: number, item: any) => sum + (Number(item.units) || 0), 0) as number;
  const pendingRequests = (requests as any[]).filter((r: any) => r.status === 'Pending').length;
  const emergencyRequests = requests.filter((r: any) => r.priority === 'Emergency' && r.status !== 'Fulfilled').length;

  // Live distribution data from inventory
  const distributionData = inventory.map((item: any) => ({
    name: item.bloodGroup,
    value: item.units || 0,
    color: GROUP_COLORS[item.bloodGroup] || '#94a3b8',
  })).filter((d: any) => d.value > 0);

  // Donation trends by month from real data
  const trendsData = (() => {
    const months: Record<string, number> = {};
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    // Seed last 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = monthNames[d.getMonth()];
      months[key] = 0;
    }
    donations.forEach((d: any) => {
      const date = new Date(d.createdAt);
      const key = monthNames[date.getMonth()];
      if (key in months) months[key]++;
    });
    return Object.entries(months).map(([month, value]) => ({ month, value }));
  })();

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
      refetchDonations();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create donation');
    } finally {
      setDonSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10">
      {/* Summary Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => onNavigate?.('donors')}>
          <div className="flex justify-between items-start z-10">
            <span className="text-[0.75rem] font-bold text-slate-500 uppercase tracking-wider">Total Donors</span>
            <Users className="w-5 h-5 text-secondary opacity-40" />
          </div>
          <p className="text-3xl font-extrabold text-on-surface z-10">{donors.length.toLocaleString()}</p>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors"></div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => onNavigate?.('inventory')}>
          <div className="flex justify-between items-start z-10">
            <span className="text-[0.75rem] font-bold text-slate-500 uppercase tracking-wider">Units Available</span>
            <Droplets className="w-5 h-5 text-primary opacity-40" />
          </div>
          <p className="text-3xl font-extrabold text-on-surface z-10">{totalUnits.toLocaleString()}</p>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => onNavigate?.('requests')}>
          <div className="flex justify-between items-start z-10">
            <span className="text-[0.75rem] font-bold text-slate-500 uppercase tracking-wider">Pending Requests</span>
            <Clock className="w-5 h-5 text-tertiary opacity-40" />
          </div>
          <p className="text-3xl font-extrabold text-on-surface z-10">{pendingRequests}</p>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-colors"></div>
        </div>

        <div className="bg-primary p-6 rounded-xl shadow-xl shadow-primary/20 flex flex-col justify-between h-32 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => onNavigate?.('requests')}>
          <div className="flex justify-between items-start z-10">
            <span className="text-[0.75rem] font-bold text-white/80 uppercase tracking-wider">Emergency Requests</span>
            <AlertTriangle className="w-5 h-5 text-white opacity-80 animate-pulse" />
          </div>
          <p className="text-3xl font-extrabold text-white z-10">{emergencyRequests}</p>
          <div className="absolute inset-0 bg-gradient-to-tr from-primary to-primary-container opacity-50"></div>
        </div>
      </section>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-10">
          {/* Blood Inventory Summary */}
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-extrabold tracking-tight">Blood Inventory Summary</h2>
              <button onClick={() => onNavigate?.('inventory')} className="text-[10px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1 hover:gap-2 transition-all">
                Full Inventory <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {inventory.slice(0, 8).map((item: any) => (
                <div key={item._id || item.bloodGroup} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-slate-800">{item.bloodGroup}</span>
                    <span className="text-xs font-semibold text-slate-500">{item.units} Units</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        item.status === 'Critical' ? "bg-primary" : item.status === 'Low Stock' ? "bg-amber-500" : "bg-secondary"
                      )}
                      style={{ width: `${Math.min((item.units / item.capacity) * 100, 100)}%` }}
                    />
                  </div>
                  {item.status !== 'Available' && (
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase w-max",
                      item.status === 'Critical' ? "bg-error-container text-error" : "bg-amber-100 text-amber-700"
                    )}>
                      <AlertTriangle className="w-2.5 h-2.5" /> {item.status}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Donations Table */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="p-8 pb-4 flex justify-between items-center">
              <h2 className="text-xl font-extrabold tracking-tight">Recent Donations</h2>
              <button onClick={() => setShowNewDonation(true)} className="flex items-center gap-2 px-4 py-2 blood-gradient text-white rounded-lg text-xs font-bold shadow-sm hover:scale-[1.02] transition-all">
                <Plus className="w-3.5 h-3.5" /> New Donation
              </button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Donor Name</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Group</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {donations.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-8 text-center text-sm text-slate-400">No donations recorded yet</td></tr>
                ) : (
                  donations.slice(0, 5).map((record: any) => {
                    const donorName = record.donor?.name || 'Unknown Donor';
                    return (
                      <tr key={record._id} className="hover:bg-surface-container-low transition-colors group">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-xs font-bold">
                              {donorName.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <span className="text-sm font-semibold text-on-surface">{donorName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span className="text-sm font-extrabold text-primary">{record.bloodGroup}</span>
                        </td>
                        <td className="px-8 py-4 text-sm text-slate-600">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-4">
                          <span className={cn(
                            "px-3 py-1 text-[10px] font-bold uppercase rounded-full",
                            record.status === 'Completed' ? "bg-tertiary/10 text-tertiary" : 
                            record.status === 'Processing' ? "bg-secondary/10 text-secondary" : 
                            "bg-error-container text-error"
                          )}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
          {/* Group Distribution - LIVE from inventory */}
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
            <h2 className="text-lg font-extrabold tracking-tight mb-6">Group Distribution</h2>
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData.length > 0 ? distributionData : [{ name: 'No Data', value: 1, color: '#e2e8f0' }]}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(distributionData.length > 0 ? distributionData : [{ color: '#e2e8f0' }]).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value} units`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-on-surface">{totalUnits}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Units</span>
              </div>
            </div>
            <div className="mt-8 space-y-3 max-h-32 overflow-y-auto">
              {distributionData.map((item: { name: string; value: number; color: string }) => (
                <div key={item.name} className="flex justify-between items-center text-xs font-semibold">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="text-slate-600">{item.value} units ({totalUnits > 0 ? Math.round((item.value / totalUnits) * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log - LIVE from recent data */}
          <div className="bg-surface-container-low p-8 rounded-xl relative overflow-hidden">
            <h2 className="text-lg font-extrabold tracking-tight mb-6">Activity Log</h2>
            <div className="space-y-6 relative z-10">
              {requests.filter((r: any) => r.status === 'Pending').slice(0, 1).map((r: any) => (
                <div key={r._id} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <Hospital className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-on-surface font-medium leading-snug">
                      {r.hospital?.organizationName || 'Hospital'} requested <span className="font-bold">{r.units} units of {r.bloodGroup}</span>
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 block">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {donations.slice(0, 1).map((d: any) => (
                <div key={d._id} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <History className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-on-surface font-medium leading-snug">
                      Donation: <span className="font-bold">{d.donor?.name || 'Donor'}</span> — {d.bloodGroup}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 block">
                      {new Date(d.createdAt).toLocaleDateString()} • {d.status}
                    </span>
                  </div>
                </div>
              ))}
              {inventory.filter((i: any) => i.status === 'Critical').slice(0, 1).map((i: any) => (
                <div key={i._id} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-error" />
                  </div>
                  <div>
                    <p className="text-sm text-on-surface font-medium leading-snug">
                      <span className="font-bold text-error">Critical:</span> {i.bloodGroup} at {i.units} units
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 block">Immediate attention needed</span>
                  </div>
                </div>
              ))}
              {requests.length === 0 && donations.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>

          {/* Monthly Trends - LIVE */}
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
            <h2 className="text-lg font-extrabold tracking-tight mb-4">Monthly Trends</h2>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendsData}>
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]}
                    fill="#e7e8ea"
                  >
                    {trendsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value >= 2 ? '#93000b' : '#e7e8ea'} />
                    ))}
                  </Bar>
                  <Tooltip formatter={(v: number) => [`${v} donations`, 'Count']} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-slate-400 uppercase">
              {trendsData.map(d => <span key={d.month}>{d.month}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* New Donation Modal */}
      <Modal isOpen={showNewDonation} onClose={() => setShowNewDonation(false)} title="Record New Donation" subtitle="Log a new blood donation intake">
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

export default Dashboard;
