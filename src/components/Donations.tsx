import React, { useState } from 'react';
import { Search, Filter, Plus, Heart, Calendar, Clock, CheckCircle2, MoreVertical, ArrowUpRight, Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useDonations } from '../hooks/useApi';
import { donationAPI } from '../services/api';
import { useToast } from './Toast';
import Modal from './Modal';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const Donations = () => {
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const { data: donations, loading, error, refetch } = useDonations({ status: statusFilter || undefined });

  // New Intake modal
  const [showNewIntake, setShowNewIntake] = useState(false);
  const [intakeForm, setIntakeForm] = useState({ bloodGroup: '', donationType: 'Whole Blood', volume: 450, notes: '' });
  const [intakeSubmitting, setIntakeSubmitting] = useState(false);

  // Status update menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Search filter (client-side on loaded data)
  const filteredDonations = donations.filter((d: any) => {
    if (!searchInput) return true;
    const q = searchInput.toLowerCase();
    const donorName = (d.donor?.name || '').toLowerCase();
    const id = (d._id || '').toLowerCase();
    return donorName.includes(q) || id.includes(q) || (d.bloodGroup || '').toLowerCase().includes(q);
  });

  const completedCount = donations.filter((d: any) => d.status === 'Completed').length;
  const processingCount = donations.filter((d: any) => d.status === 'Processing').length;
  const scheduledCount = donations.filter((d: any) => d.status === 'Scheduled').length;

  const handleNewIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeForm.bloodGroup) { showToast('error', 'Please select a blood group'); return; }
    setIntakeSubmitting(true);
    try {
      await donationAPI.create({
        bloodGroup: intakeForm.bloodGroup,
        donationType: intakeForm.donationType,
        volume: intakeForm.volume,
        notes: intakeForm.notes || undefined,
      });
      showToast('success', 'New donation intake recorded!');
      setShowNewIntake(false);
      setIntakeForm({ bloodGroup: '', donationType: 'Whole Blood', volume: 450, notes: '' });
      refetch();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to record intake');
    } finally {
      setIntakeSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await donationAPI.updateStatus(id, { status: newStatus });
      showToast('success', `Donation status updated to ${newStatus}`);
      setOpenMenuId(null);
      refetch();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading donations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-error-container p-6 rounded-xl text-error text-sm font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10">
      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">Donation Lifecycle</h2>
          <p className="text-on-surface-variant mt-1">Tracking the journey from donor intake to clinical readiness.</p>
        </div>
        <button onClick={() => setShowNewIntake(true)} className="flex items-center gap-2 px-6 py-2.5 blood-gradient text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
          <Plus className="w-4 h-4" /> New Intake
        </button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter(''); }}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary"><Heart className="w-6 h-6" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
          </div>
          <h3 className="text-2xl font-black text-on-surface">{donations.length}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase mt-1">Total Intakes</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('Processing')}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600"><Clock className="w-6 h-6" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lab</span>
          </div>
          <h3 className="text-2xl font-black text-on-surface">{processingCount}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase mt-1">In Processing</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('Completed')}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary"><CheckCircle2 className="w-6 h-6" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ready</span>
          </div>
          <h3 className="text-2xl font-black text-on-surface">{completedCount}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase mt-1">Validated Units</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('Scheduled')}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Calendar className="w-6 h-6" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheduled</span>
          </div>
          <h3 className="text-2xl font-black text-on-surface">{scheduledCount}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase mt-1">Upcoming Appointments</p>
        </div>
      </div>

      {/* Active filter indicator */}
      {statusFilter && (
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider">Showing:</span>
          <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full font-bold flex items-center gap-1">
            {statusFilter} <button onClick={() => setStatusFilter('')} className="ml-1 hover:text-secondary/70">×</button>
          </span>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-container-high/30 flex justify-between items-center">
          <h3 className="text-lg font-bold text-on-surface">Recent Donation Records</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search ID or Donor..."
                value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-xs w-48 focus:ring-1 focus:ring-secondary/20" />
            </div>
            <div className="relative">
              <button onClick={() => setShowFilterMenu(!showFilterMenu)} className="p-2 bg-surface-container-low rounded-lg text-slate-500 hover:text-on-surface transition-colors">
                <Filter className="w-4 h-4" />
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-xl border border-surface-container-high/30 py-2 z-20 min-w-[140px]">
                  {['', 'Completed', 'Processing', 'Cancelled', 'Scheduled'].map((s) => (
                    <button key={s} onClick={() => { setStatusFilter(s); setShowFilterMenu(false); }}
                      className={cn("w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-surface-container-low", statusFilter === s && "text-secondary bg-secondary/5")}>
                      {s || 'All Status'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Record ID</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Donor</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Group</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volume</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {filteredDonations.length === 0 ? (
                <tr><td colSpan={7} className="px-8 py-8 text-center text-sm text-slate-400">{searchInput ? 'No matching records' : 'No donation records yet'}</td></tr>
              ) : (
                filteredDonations.map((record: any) => {
                  const donorName = record.donor?.name || 'Unknown Donor';
                  const recordId = record._id?.slice(-6)?.toUpperCase() || 'N/A';
                  return (
                    <tr key={record._id} className="hover:bg-surface-container-low/30 transition-colors group">
                      <td className="px-8 py-5 text-xs font-black text-secondary">DX-{recordId}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {donorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-sm font-bold text-on-surface">{donorName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="text-sm font-black text-primary">{record.bloodGroup}</span>
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-on-surface">{record.volume || 450} mL</td>
                      <td className="px-8 py-5 text-xs text-slate-500">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td className="px-8 py-5">
                        <span className={cn(
                          "px-3 py-1 text-[9px] font-black uppercase rounded-full",
                          record.status === 'Completed' ? "bg-tertiary/10 text-tertiary" : 
                          record.status === 'Processing' ? "bg-secondary/10 text-secondary" : 
                          record.status === 'Scheduled' ? "bg-amber-100 text-amber-700" :
                          "bg-error-container text-error"
                        )}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right relative">
                        <button onClick={() => setOpenMenuId(openMenuId === record._id ? null : record._id)}
                          className="p-2 text-slate-400 hover:text-on-surface rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === record._id && (
                          <div className="absolute right-8 top-full mt-1 bg-white shadow-lg rounded-xl border border-surface-container-high/30 py-2 z-20 min-w-[160px]">
                            {record.status === 'Processing' && (
                              <button onClick={() => handleStatusChange(record._id, 'Completed')}
                                className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-surface-container-low text-tertiary">
                                ✓ Mark Completed
                              </button>
                            )}
                            {record.status === 'Scheduled' && (
                              <button onClick={() => handleStatusChange(record._id, 'Processing')}
                                className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-surface-container-low text-secondary">
                                → Start Processing
                              </button>
                            )}
                            {(record.status === 'Processing' || record.status === 'Scheduled') && (
                              <button onClick={() => handleStatusChange(record._id, 'Cancelled')}
                                className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-surface-container-low text-error">
                                ✕ Cancel
                              </button>
                            )}
                            <button onClick={() => setOpenMenuId(null)} className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-surface-container-low text-slate-500">
                              Close
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-low p-8 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h3 className="text-2xl font-headline font-extrabold text-on-surface">Intake Efficiency</h3>
            <p className="text-sm text-on-surface-variant max-w-sm">Average processing time from collection to storage has decreased by <span className="font-bold text-tertiary">18%</span> this month.</p>
            <div className="flex gap-4 pt-2">
              <div className="text-center">
                <p className="text-2xl font-black text-on-surface">2.4h</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Avg. Lab Time</p>
              </div>
              <div className="w-px h-10 bg-surface-container-high"></div>
              <div className="text-center">
                <p className="text-2xl font-black text-on-surface">
                  {donations.length > 0 ? Math.round((completedCount / donations.length) * 100) : 0}%
                </p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Success Rate</p>
              </div>
            </div>
          </div>
          <div className="relative z-10 w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-tertiary/20">
            <div className="text-center">
              <ArrowUpRight className="w-8 h-8 text-tertiary mx-auto" />
              <p className="text-[10px] font-bold text-tertiary uppercase mt-1">Optimal</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-on-surface">Recent Activity</h3>
          <div className="space-y-4">
            {donations.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
            ) : (
              donations.slice(0, 3).map((d: any) => {
                const donorName = d.donor?.name || 'Unknown';
                return (
                  <div key={d._id} className="flex items-center gap-4 p-3 bg-surface-container-low/30 rounded-xl">
                    <div className="text-center w-10">
                      <p className="text-xs font-black text-primary">
                        {new Date(d.createdAt).toLocaleString('default', { month: 'short' }).toUpperCase()}
                      </p>
                      <p className="text-lg font-black text-on-surface leading-none">
                        {new Date(d.createdAt).getDate()}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-on-surface">{donorName}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">
                        {d.donationType || 'Whole Blood'} • {d.bloodGroup} • <span className={cn(
                          d.status === 'Completed' ? "text-tertiary" : d.status === 'Processing' ? "text-secondary" : "text-slate-400"
                        )}>{d.status}</span>
                      </p>
                    </div>
                    <button onClick={() => {
                      if (d.status === 'Processing') handleStatusChange(d._id, 'Completed');
                      else showToast('info', `Donation ${d.status}`);
                    }} className="p-2 text-secondary hover:bg-secondary/5 rounded-lg transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <button onClick={() => setShowNewIntake(true)} className="w-full py-3 text-xs font-bold uppercase tracking-widest text-white bg-secondary rounded-xl hover:bg-secondary/90 transition-colors shadow-sm">
            Record New Intake
          </button>
        </div>
      </div>

      {/* New Intake Modal */}
      <Modal isOpen={showNewIntake} onClose={() => setShowNewIntake(false)} title="Record New Donation Intake" subtitle="Log a new blood donation">
        <form onSubmit={handleNewIntake} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blood Group *</label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button key={bg} type="button" onClick={() => setIntakeForm({ ...intakeForm, bloodGroup: bg })}
                  className={cn("py-2.5 rounded-lg text-xs font-bold transition-all", intakeForm.bloodGroup === bg ? "bg-primary text-white shadow-sm" : "bg-surface-container-low text-slate-600 hover:bg-surface-container-high")}>
                  {bg}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Donation Type</label>
            <select value={intakeForm.donationType} onChange={(e) => setIntakeForm({ ...intakeForm, donationType: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20">
              <option>Whole Blood</option>
              <option>Platelets</option>
              <option>Plasma</option>
              <option>Double Red Cells</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volume (mL)</label>
            <input type="number" min={200} max={550} value={intakeForm.volume}
              onChange={(e) => setIntakeForm({ ...intakeForm, volume: +e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Notes (optional)</label>
            <textarea value={intakeForm.notes} onChange={(e) => setIntakeForm({ ...intakeForm, notes: e.target.value })} rows={2}
              className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowNewIntake(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 hover:bg-surface-container-low rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={intakeSubmitting} className="flex-1 py-2.5 blood-gradient text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
              {intakeSubmitting ? 'Recording...' : 'Record Intake'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Donations;
