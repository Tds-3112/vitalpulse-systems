import React, { useState } from 'react';
import { Filter, Edit, History, TrendingUp, AlertTriangle, Activity, Loader2, Plus, X, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useInventory } from '../hooks/useApi';
import { inventoryAPI } from '../services/api';
import { useToast } from './Toast';
import Modal from './Modal';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const RARE_GROUPS = ['AB-', 'B-', 'A-', 'O-'];

const InventoryView = () => {
  const { showToast } = useToast();
  const [filterTab, setFilterTab] = useState<'all' | 'rare'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const { data: inventory, loading, error, refetch } = useInventory();

  // Filter logic
  const filtered = inventory.filter((item: any) => {
    if (filterTab === 'rare' && !RARE_GROUPS.includes(item.bloodGroup)) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    return true;
  });

  const totalUnits = inventory.reduce((sum, item: any) => sum + (item.units || 0), 0);
  const criticalItems = inventory.filter((item: any) => item.status === 'Critical');
  const lowStockItems = inventory.filter((item: any) => item.status === 'Low Stock');

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ bloodGroup: '', units: 0, capacity: 500, source: 'Manual Audit' });
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm, setEditForm] = useState({ units: 0, capacity: 500, source: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Audit log modal
  const [showAuditLog, setShowAuditLog] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.bloodGroup) { showToast('error', 'Please select a blood group'); return; }
    if (addForm.units <= 0) { showToast('error', 'Units must be greater than 0'); return; }
    setAddSubmitting(true);
    try {
      await inventoryAPI.add(addForm);
      showToast('success', `Added ${addForm.units} units of ${addForm.bloodGroup} to inventory`);
      setShowAddModal(false);
      setAddForm({ bloodGroup: '', units: 0, capacity: 500, source: 'Manual Audit' });
      refetch();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to add inventory');
    } finally {
      setAddSubmitting(false);
    }
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setEditForm({ units: item.units, capacity: item.capacity, source: item.source });
    setShowEditModal(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setEditSubmitting(true);
    try {
      await inventoryAPI.update(editItem._id, editForm);
      showToast('success', `Updated ${editItem.bloodGroup} inventory`);
      setShowEditModal(false);
      refetch();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update inventory');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading inventory...</p>
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
          <h2 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">Inventory Matrix</h2>
          <p className="text-on-surface-variant mt-1">Live monitoring of systemic blood reserves and storage conditions.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-2.5 blood-gradient text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
          <Plus className="w-4 h-4" /> Add Stock
        </button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 md:col-span-2 bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-primary">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Total System Inventory</p>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-5xl font-extrabold text-on-surface tracking-tight">{totalUnits.toLocaleString()}<span className="text-lg font-medium ml-2 text-slate-400">units</span></h2>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-tertiary" /> Live data from API
              </p>
            </div>
            <div className="h-16 w-32 opacity-30">
              <svg className="w-full h-full" viewBox="0 0 100 40">
                <path d="M0 40 Q 25 35, 40 20 T 70 10 T 100 0" fill="none" stroke="#93000b" strokeWidth="3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-amber-500">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">Low Stock Alerts</p>
          <h2 className="text-4xl font-extrabold text-on-surface">{String(lowStockItems.length).padStart(2, '0')}</h2>
          <p className="text-xs text-slate-500 mt-2 italic">
            {lowStockItems.map((i: any) => i.bloodGroup).join(', ') || 'None'}
          </p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-error">
          <p className="text-[10px] font-bold text-error uppercase tracking-widest mb-2">Critical Shortage</p>
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-extrabold text-on-surface">{String(criticalItems.length).padStart(2, '0')}</h2>
            {criticalItems.length > 0 && <AlertTriangle className="w-6 h-6 text-error animate-pulse fill-current" />}
          </div>
          <p className="text-xs text-slate-500 mt-2 font-bold uppercase">
            {criticalItems.map((i: any) => i.bloodGroup).join(', ') || 'None'}
          </p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b border-surface-container-high/30">
          <div className="flex bg-surface-container-low rounded-lg p-1">
            <button onClick={() => setFilterTab('all')} className={cn("px-4 py-2 text-xs font-bold uppercase rounded-md transition-all", filterTab === 'all' ? "bg-surface-container-lowest shadow-sm text-secondary" : "text-slate-500 hover:text-slate-700")}>
              All Groups
            </button>
            <button onClick={() => setFilterTab('rare')} className={cn("px-4 py-2 text-xs font-bold uppercase rounded-md transition-all", filterTab === 'rare' ? "bg-surface-container-lowest shadow-sm text-secondary" : "text-slate-500 hover:text-slate-700")}>
              Rare Groups
            </button>
          </div>
          <div className="relative">
            <button onClick={() => setShowFilterMenu(!showFilterMenu)} className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">
              <Filter className="w-4 h-4" /> {statusFilter || 'All Status'} <ChevronDown className="w-3 h-3" />
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-xl border border-surface-container-high/30 py-2 z-20 min-w-[160px]">
                {['', 'Critical', 'Low Stock', 'Available'].map((st) => (
                  <button key={st} onClick={() => { setStatusFilter(st); setShowFilterMenu(false); }}
                    className={cn("w-full text-left px-4 py-2 text-xs font-semibold hover:bg-surface-container-low transition-colors", statusFilter === st && "text-secondary bg-secondary/5")}>
                    {st || 'All Status'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blood Group</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Units</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Updated</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">No inventory items match the filter</td></tr>
            ) : (
              filtered.map((item: any) => (
                <tr key={item._id} className="group hover:bg-surface-container-low/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-black text-lg",
                        item.status === 'Critical' ? "bg-error-container text-error" : 
                        item.status === 'Low Stock' ? "bg-amber-100 text-amber-700" : 
                        "bg-surface-container text-slate-700"
                      )}>
                        {item.bloodGroup}
                      </div>
                      <span className="font-bold text-on-surface">
                        {item.bloodGroup === 'O-' ? 'Universal Donor' : `Type ${item.bloodGroup} ${item.bloodGroup.includes('+') ? 'Positive' : 'Negative'}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-lg font-bold text-on-surface">{item.units}</span>
                    <span className="text-[10px] text-slate-400 ml-1">/ {item.capacity} cap</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase",
                      item.status === 'Critical' ? "bg-error-container text-error" : 
                      item.status === 'Low Stock' ? "bg-amber-100 text-amber-700" : 
                      "bg-tertiary/10 text-tertiary"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", 
                        item.status === 'Critical' ? "bg-error animate-ping" : 
                        item.status === 'Low Stock' ? "bg-amber-500" : 
                        "bg-tertiary"
                      )}></span>
                      {item.status}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-medium text-on-surface">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-slate-400">via {item.source}</p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setShowAuditLog(true)} className="p-2 text-slate-400 hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors" title="History">
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-on-surface">Inventory Audit Trail</h3>
          <div className="space-y-4">
            {inventory.slice(0, 3).map((item: any, i: number) => (
              <div key={item._id} className="flex items-start gap-4 p-4 bg-surface-container-low/40 rounded-xl">
                <div className="mt-1 w-8 h-8 rounded-full bg-tertiary-container/10 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-tertiary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-on-surface">
                    {item.bloodGroup}: <span className="font-bold">{item.units} units</span> — {item.status}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">
                    Source: {item.source} • Updated {new Date(item.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-md font-bold text-on-surface">System Health</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span>Storage Utilization</span>
                <span className="text-tertiary">{(inventory as any[]).length > 0 ? Math.round((inventory as any[]).reduce((s: number, i: any) => s + (Number(i.units) / Number(i.capacity)) * 100, 0) / (inventory as any[]).length) : 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-tertiary" style={{ width: `${(inventory as any[]).length > 0 ? Math.round((inventory as any[]).reduce((s: number, i: any) => s + (Number(i.units) / Number(i.capacity)) * 100, 0) / (inventory as any[]).length) : 0}%` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span>Groups Stocked</span>
                <span className="text-secondary">{inventory.length}/8</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-secondary" style={{ width: `${(inventory.length / 8) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Stock Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Blood Stock" subtitle="Add new blood units to inventory">
        <form onSubmit={handleAdd} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blood Group *</label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button key={bg} type="button" onClick={() => setAddForm({ ...addForm, bloodGroup: bg })}
                  className={cn("py-2.5 rounded-lg text-xs font-bold transition-all", addForm.bloodGroup === bg ? "bg-primary text-white shadow-sm" : "bg-surface-container-low text-slate-600 hover:bg-surface-container-high")}>
                  {bg}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Units *</label>
              <input type="number" min={1} value={addForm.units} onChange={(e) => setAddForm({ ...addForm, units: +e.target.value })} className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capacity</label>
              <input type="number" min={1} value={addForm.capacity} onChange={(e) => setAddForm({ ...addForm, capacity: +e.target.value })} className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source</label>
            <select value={addForm.source} onChange={(e) => setAddForm({ ...addForm, source: e.target.value })} className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20">
              <option>Manual Audit</option>
              <option>Donor Portal</option>
              <option>Hospital Transfer</option>
              <option>Camp Collection</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 hover:bg-surface-container-low rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={addSubmitting} className="flex-1 py-2.5 blood-gradient text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
              {addSubmitting ? 'Adding...' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Stock Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit ${editItem?.bloodGroup || ''} Inventory`} subtitle="Update stock levels">
        <form onSubmit={handleEdit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Units</label>
            <input type="number" min={0} value={editForm.units} onChange={(e) => setEditForm({ ...editForm, units: +e.target.value })} className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capacity</label>
            <input type="number" min={1} value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: +e.target.value })} className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source</label>
            <select value={editForm.source} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20">
              <option>Manual Audit</option>
              <option>Donor Portal</option>
              <option>Hospital Transfer</option>
              <option>Camp Collection</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 hover:bg-surface-container-low rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={editSubmitting} className="flex-1 py-2.5 bg-secondary text-white rounded-xl font-bold text-sm shadow-lg shadow-secondary/20 disabled:opacity-50">
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Audit Log Modal */}
      <Modal isOpen={showAuditLog} onClose={() => setShowAuditLog(false)} title="Inventory Audit Log" subtitle="Recent changes to inventory" size="lg">
        <div className="space-y-4">
          {inventory.map((item: any) => (
            <div key={item._id} className="flex items-start gap-4 p-4 bg-surface-container-low/40 rounded-xl">
              <div className="mt-1 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-on-surface">
                  <span className="font-bold">{item.bloodGroup}</span>: {item.units} units / {item.capacity} capacity — <span className={cn(
                    item.status === 'Critical' ? "text-error font-bold" : item.status === 'Low Stock' ? "text-amber-600 font-bold" : "text-tertiary"
                  )}>{item.status}</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Source: {item.source} • Last updated: {new Date(item.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default InventoryView;
