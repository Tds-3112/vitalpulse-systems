import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, History, Edit, Mail, ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, Activity, Loader2, X, ChevronDown, Eye } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useDonors } from '../hooks/useApi';
import { authAPI, userAPI } from '../services/api';
import { useToast } from './Toast';
import Modal from './Modal';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const Donors = () => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [bgFilter, setBgFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const { data: donors, loading, error, refetch, pagination } = useDonors({
    search: searchQuery || undefined,
    bloodGroup: bgFilter || undefined,
    page,
    limit: 10,
  });

  const eligibleCount = donors.filter((d: any) => d.isActive).length;

  // Register modal
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', bloodGroup: '', phone: '' });
  const [regSubmitting, setRegSubmitting] = useState(false);

  // View/Edit modal
  const [showViewEdit, setShowViewEdit] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editDonorForm, setEditDonorForm] = useState({ name: '', phone: '', bloodGroup: '', isActive: true });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Search with debounce
  const [searchInput, setSearchInput] = useState('');
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    // Debounce
    const timer = setTimeout(() => {
      setSearchQuery(val);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name || !regForm.email || !regForm.password) {
      showToast('error', 'Name, email, and password are required');
      return;
    }
    setRegSubmitting(true);
    try {
      await authAPI.register({
        name: regForm.name,
        email: regForm.email,
        password: regForm.password,
        role: 'donor',
        bloodGroup: regForm.bloodGroup || undefined,
        phone: regForm.phone || undefined,
      });
      showToast('success', `Donor "${regForm.name}" registered successfully!`);
      setShowRegister(false);
      setRegForm({ name: '', email: '', password: '', bloodGroup: '', phone: '' });
      refetch();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to register donor');
    } finally {
      setRegSubmitting(false);
    }
  };

  const openViewEdit = (donor: any, edit = false) => {
    setSelectedDonor(donor);
    setEditMode(edit);
    setEditDonorForm({
      name: donor.name,
      phone: donor.phone || '',
      bloodGroup: donor.bloodGroup || '',
      isActive: donor.isActive,
    });
    setShowViewEdit(true);
  };

  const handleEditDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonor) return;
    setEditSubmitting(true);
    try {
      await userAPI.update(selectedDonor._id, editDonorForm);
      showToast('success', `Donor "${editDonorForm.name}" updated`);
      setShowViewEdit(false);
      refetch();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update donor');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (donors.length === 0) { showToast('info', 'No donors to export'); return; }
    const headers = ['Name', 'Email', 'Blood Group', 'Phone', 'Status', 'Donations', 'Joined'];
    const rows = donors.map((d: any) => [
      d.name,
      d.email,
      d.bloodGroup || 'N/A',
      d.phone || 'N/A',
      d.isActive ? 'Active' : 'Inactive',
      d.donationCount || 0,
      new Date(d.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donors_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', `Exported ${donors.length} donors to CSV`);
  };

  const totalPages = pagination?.pages || 1;

  if (loading && donors.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading donors...</p>
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
      {/* Bento Dashboard Header */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 md:col-span-2 bg-surface-container-low p-8 rounded-xl flex flex-col justify-between">
          <div>
            <span className="text-[0.75rem] tracking-wider uppercase font-bold text-slate-500">Active Registry</span>
            <h2 className="text-5xl font-extrabold text-primary mt-2">{pagination?.total || donors.length}</h2>
          </div>
          <p className="text-sm text-slate-600 mt-4 max-w-xs">Registered donors loaded from the API. <span className="text-tertiary font-bold">{eligibleCount} active</span> donors available.</p>
        </div>

        <div className="bg-primary/5 border border-primary/10 p-6 rounded-xl relative overflow-hidden">
          <div className="relative z-10">
            <AlertTriangle className="w-6 h-6 text-primary mb-2 fill-current" />
            <h3 className="font-headline font-bold text-primary">Low Stock: O-</h3>
            <p className="text-sm text-on-surface mt-1">Contact eligible O- donors for immediate availability.</p>
            <button onClick={() => showToast('info', 'Notification sent to all eligible O- donors!')} className="mt-4 text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1 hover:gap-2 transition-all">
              Blast Notification <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <AlertTriangle className="w-32 h-32" />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-center items-center text-center shadow-sm">
          <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="font-headline font-bold text-on-surface">New Registration</h3>
          <p className="text-xs text-slate-500 mt-1">Onboard a new donor</p>
          <button onClick={() => setShowRegister(true)} className="mt-4 w-full py-2 bg-secondary text-white rounded-lg text-sm font-bold hover:bg-secondary/90 transition-colors shadow-sm">Register</button>
        </div>
      </section>

      {/* Donor Directory Table */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold font-headline tracking-tight text-on-surface">Donor Directory</h2>
            <p className="text-slate-500 text-sm">Managing records for all registered blood donors.</p>
          </div>
          <div className="flex gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" placeholder="Search donors..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm w-52 focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            {/* Blood Group Filter */}
            <div className="relative">
              <button onClick={() => setShowFilter(!showFilter)} className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">
                <Filter className="w-4 h-4" /> {bgFilter || 'All'} <ChevronDown className="w-3 h-3" />
              </button>
              {showFilter && (
                <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-xl border border-surface-container-high/30 py-2 z-20 min-w-[120px]">
                  <button onClick={() => { setBgFilter(''); setShowFilter(false); setPage(1); }} className={cn("w-full text-left px-4 py-2 text-xs font-semibold hover:bg-surface-container-low", !bgFilter && "text-secondary")}>All Groups</button>
                  {BLOOD_GROUPS.map((bg) => (
                    <button key={bg} onClick={() => { setBgFilter(bg); setShowFilter(false); setPage(1); }} className={cn("w-full text-left px-4 py-2 text-xs font-semibold hover:bg-surface-container-low", bgFilter === bg && "text-secondary")}>
                      {bg}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                  <th className="px-8 py-5">Donor Name</th>
                  <th className="px-6 py-5">Blood Group</th>
                  <th className="px-6 py-5">Email</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Donations</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {donors.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-8 text-center text-sm text-slate-400">No donors found</td></tr>
                ) : (
                  donors.map((donor: any) => (
                    <tr key={donor._id} className="bg-surface-container-lowest hover:bg-surface-bright transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center font-bold text-tertiary shadow-sm">
                            {donor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{donor.name}</p>
                            <p className="text-xs text-slate-400">{donor.phone || 'No phone'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {donor.bloodGroup ? (
                          <span className="px-3 py-1 bg-primary/10 text-primary font-extrabold rounded-lg text-xs">
                            {donor.bloodGroup} {donor.bloodGroup.includes('+') ? 'POSITIVE' : 'NEGATIVE'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">{donor.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn("flex items-center gap-1.5", donor.isActive ? "text-tertiary" : "text-slate-400")}>
                          <span className={cn("w-2 h-2 rounded-full", donor.isActive ? "bg-tertiary animate-pulse" : "bg-slate-300")}></span>
                          <span className="text-xs font-bold uppercase tracking-wider">{donor.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-on-surface">{donor.donationCount || 0}</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openViewEdit(donor, false)} className="p-2 text-slate-400 hover:text-secondary hover:bg-secondary/5 rounded-lg transition-all" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openViewEdit(donor, true)} className="p-2 text-slate-400 hover:text-secondary hover:bg-secondary/5 rounded-lg transition-all" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => showToast('info', `Email sent to ${donor.email}`)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Send Email">
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Page {page} of {totalPages} • {pagination?.total || donors.length} total donors
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-slate-600 hover:bg-surface-container-high transition-colors disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors",
                  page === p ? "bg-primary text-white" : "bg-surface-container-low text-slate-600 hover:bg-surface-container-high"
                )}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
              className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-slate-600 hover:bg-surface-container-high transition-colors disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Registry Health */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-low rounded-xl p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[0.75rem] tracking-wider uppercase font-bold text-slate-400">Quick Analysis</span>
              <h3 className="text-xl font-headline font-extrabold text-on-surface mt-1">Registry Health Vitals</h3>
            </div>
            <div className="w-12 h-12 bg-surface-container-lowest rounded-xl flex items-center justify-center shadow-sm">
              <Activity className="w-6 h-6 text-secondary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest p-5 rounded-xl border-l-4 border-tertiary">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Rate</p>
              <p className="text-2xl font-headline font-bold text-on-surface mt-1">
                {donors.length > 0 ? ((eligibleCount / donors.length) * 100).toFixed(1) : 0}%
              </p>
              <div className="mt-4 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-tertiary" />
                <span className="text-[10px] text-tertiary font-bold uppercase">Based on live data</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-xl border-l-4 border-primary">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Donations</p>
              <p className="text-2xl font-headline font-bold text-on-surface mt-1">
                {donors.reduce((sum: number, d: any) => sum + (d.donationCount || 0), 0)}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Activity className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-primary font-bold uppercase">Across all donors</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border-l border-surface-container-low p-8 rounded-xl shadow-sm">
          <h3 className="font-headline font-extrabold text-on-surface mb-6">Recent Records</h3>
          <div className="space-y-6">
            {donors.slice(0, 3).map((donor: any, i: number) => (
              <div key={donor._id} className="flex gap-4">
                <div className={cn("mt-1 w-2 h-2 rounded-full shrink-0", i === 0 ? "bg-tertiary" : i === 1 ? "bg-primary" : "bg-secondary")}></div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{donor.name}</p>
                  <p className="text-xs text-slate-500">
                    {donor.bloodGroup || 'Unknown group'} • {donor.donationCount || 0} donations
                  </p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 block">
                    Joined {new Date(donor.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Register Donor Modal */}
      <Modal isOpen={showRegister} onClose={() => setShowRegister(false)} title="Register New Donor" subtitle="Onboard a new donor to the system">
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name *</label>
            <input type="text" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} required placeholder="Jane Doe"
              className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 placeholder:text-slate-300" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email *</label>
            <input type="email" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} required placeholder="jane@example.com"
              className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 placeholder:text-slate-300" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password *</label>
            <input type="password" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} required minLength={6} placeholder="Min 6 characters"
              className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 placeholder:text-slate-300" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blood Group</label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button key={bg} type="button" onClick={() => setRegForm({ ...regForm, bloodGroup: bg })}
                  className={cn("py-2 rounded-lg text-xs font-bold transition-all", regForm.bloodGroup === bg ? "bg-primary text-white" : "bg-surface-container-low text-slate-600 hover:bg-surface-container-high")}>
                  {bg}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone (optional)</label>
            <input type="tel" value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} placeholder="555-0100"
              className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 placeholder:text-slate-300" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowRegister(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 hover:bg-surface-container-low rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={regSubmitting} className="flex-1 py-2.5 blood-gradient text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
              {regSubmitting ? 'Registering...' : 'Register Donor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View/Edit Donor Modal */}
      <Modal isOpen={showViewEdit} onClose={() => setShowViewEdit(false)} title={editMode ? `Edit ${selectedDonor?.name}` : `Donor Profile`} subtitle={editMode ? 'Update donor information' : selectedDonor?.email}>
        {selectedDonor && !editMode ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-surface-container-low/40 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-tertiary-fixed flex items-center justify-center font-bold text-tertiary text-xl shadow-sm">
                {selectedDonor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">{selectedDonor.name}</h3>
                <p className="text-sm text-slate-500">{selectedDonor.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase", selectedDonor.isActive ? "bg-tertiary/10 text-tertiary" : "bg-slate-200 text-slate-500")}>
                    {selectedDonor.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {selectedDonor.bloodGroup && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-black">{selectedDonor.bloodGroup}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-low/30 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                <p className="text-sm font-semibold text-on-surface mt-1">{selectedDonor.phone || 'Not provided'}</p>
              </div>
              <div className="p-4 bg-surface-container-low/30 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Donations</p>
                <p className="text-sm font-semibold text-on-surface mt-1">{selectedDonor.donationCount || 0}</p>
              </div>
              <div className="p-4 bg-surface-container-low/30 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined</p>
                <p className="text-sm font-semibold text-on-surface mt-1">{new Date(selectedDonor.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="p-4 bg-surface-container-low/30 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Login</p>
                <p className="text-sm font-semibold text-on-surface mt-1">{selectedDonor.lastLogin ? new Date(selectedDonor.lastLogin).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditMode(true)} className="flex-1 py-2.5 bg-secondary text-white rounded-xl font-bold text-sm">Edit Profile</button>
              <button onClick={() => setShowViewEdit(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 hover:bg-surface-container-low rounded-xl transition-colors">Close</button>
            </div>
          </div>
        ) : selectedDonor && editMode ? (
          <form onSubmit={handleEditDonor} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</label>
              <input type="text" value={editDonorForm.name} onChange={(e) => setEditDonorForm({ ...editDonorForm, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone</label>
              <input type="tel" value={editDonorForm.phone} onChange={(e) => setEditDonorForm({ ...editDonorForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blood Group</label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button key={bg} type="button" onClick={() => setEditDonorForm({ ...editDonorForm, bloodGroup: bg })}
                    className={cn("py-2 rounded-lg text-xs font-bold transition-all", editDonorForm.bloodGroup === bg ? "bg-primary text-white" : "bg-surface-container-low text-slate-600 hover:bg-surface-container-high")}>
                    {bg}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Status</label>
              <button type="button" onClick={() => setEditDonorForm({ ...editDonorForm, isActive: !editDonorForm.isActive })}
                className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", editDonorForm.isActive ? "bg-tertiary" : "bg-slate-300")}>
                <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow", editDonorForm.isActive ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditMode(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 hover:bg-surface-container-low rounded-xl transition-colors">Cancel</button>
              <button type="submit" disabled={editSubmitting} className="flex-1 py-2.5 bg-secondary text-white rounded-xl font-bold text-sm shadow-lg shadow-secondary/20 disabled:opacity-50">
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
};

export default Donors;
