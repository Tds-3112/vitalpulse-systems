import React, { useState } from 'react';
import { Filter, Clock, CheckCircle2, Truck, AlertTriangle, ChevronRight, Hospital, ArrowRight, Loader2, Plus, ChevronDown, FileText, Building2, BarChart3 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useRequests } from '../hooks/useApi';
import { requestAPI } from '../services/api';
import { useToast } from './Toast';
import Modal from './Modal';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const Requests = () => {
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const { data: requests, loading, error, refetch } = useRequests({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });

  const statusOrder: Record<string, number> = { 'Pending': 0, 'Approved': 1, 'Dispatched': 2, 'Fulfilled': 3 };

  // Create Request modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ bloodGroup: '', units: 1, priority: 'Normal', reason: '', patientName: '' });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Quick links modals
  const [showDispatchHistory, setShowDispatchHistory] = useState(false);
  const [showHospitalDir, setShowHospitalDir] = useState(false);
  const [showSLAReport, setShowSLAReport] = useState(false);

  const emergencyCount = requests.filter((r: any) => r.priority === 'Emergency').length;
  const pendingCount = requests.filter((r: any) => r.status === 'Pending').length;
  const inProgressCount = requests.filter((r: any) => r.status === 'Approved' || r.status === 'Dispatched').length;
  const fulfilledCount = requests.filter((r: any) => r.status === 'Fulfilled').length;

  const handleStatusUpdate = async (id: string, newStatus: string, eta?: string) => {
    try {
      await requestAPI.updateStatus(id, { status: newStatus, eta });
      showToast('success', `Request status updated to ${newStatus}`);
      refetch();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || `Failed to update status`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.bloodGroup) { showToast('error', 'Please select a blood group'); return; }
    setCreateSubmitting(true);
    try {
      await requestAPI.create(createForm);
      showToast('success', 'Blood request submitted successfully!');
      setShowCreate(false);
      setCreateForm({ bloodGroup: '', units: 1, priority: 'Normal', reason: '', patientName: '' });
      refetch();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create request');
    } finally {
      setCreateSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading requests...</p>
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
          <h2 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">Operational Queue</h2>
          <p className="text-on-surface-variant mt-1">Manage incoming blood requests from hospitals and clinics.</p>
        </div>
        <div className="flex gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <button onClick={() => setShowFilterMenu(!showFilterMenu)} className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">
              <Filter className="w-4 h-4" /> Filter <ChevronDown className="w-3 h-3" />
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-xl border border-surface-container-high/30 py-2 z-20 min-w-[200px]">
                <p className="px-4 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                {['', 'Pending', 'Approved', 'Dispatched', 'Fulfilled', 'Rejected'].map((s) => (
                  <button key={s} onClick={() => { setStatusFilter(s); }}
                    className={cn("w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-surface-container-low", statusFilter === s && "text-secondary bg-secondary/5")}>
                    {s || 'All Status'}
                  </button>
                ))}
                <div className="border-t border-surface-container-high/30 my-1" />
                <p className="px-4 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Priority</p>
                {['', 'Emergency', 'Normal'].map((p) => (
                  <button key={p} onClick={() => { setPriorityFilter(p); }}
                    className={cn("w-full text-left px-4 py-1.5 text-xs font-semibold hover:bg-surface-container-low", priorityFilter === p && "text-secondary bg-secondary/5")}>
                    {p || 'All Priority'}
                  </button>
                ))}
                <div className="border-t border-surface-container-high/30 my-1" />
                <button onClick={() => { setStatusFilter(''); setPriorityFilter(''); setShowFilterMenu(false); }}
                  className="w-full text-left px-4 py-1.5 text-xs font-bold text-primary hover:bg-primary/5">Clear All Filters</button>
              </div>
            )}
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-6 py-2.5 blood-gradient text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-primary p-6 rounded-xl shadow-xl shadow-primary/20 relative overflow-hidden cursor-pointer" onClick={() => { setPriorityFilter('Emergency'); setStatusFilter(''); }}>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
              </div>
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Urgent</span>
            </div>
            <h3 className="text-2xl font-black text-white">{emergencyCount}</h3>
            <p className="text-xs font-bold text-white/80 uppercase mt-1">Emergency Requests</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-primary to-primary-container opacity-50"></div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm cursor-pointer" onClick={() => { setStatusFilter('Pending'); setPriorityFilter(''); }}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600"><Clock className="w-6 h-6" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Queue</span>
          </div>
          <h3 className="text-2xl font-black text-on-surface">{pendingCount}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase mt-1">Pending Review</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm cursor-pointer" onClick={() => { setStatusFilter('Approved'); setPriorityFilter(''); }}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary"><Truck className="w-6 h-6" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transit</span>
          </div>
          <h3 className="text-2xl font-black text-on-surface">{inProgressCount}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase mt-1">In Progress</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm cursor-pointer" onClick={() => { setStatusFilter('Fulfilled'); setPriorityFilter(''); }}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary"><CheckCircle2 className="w-6 h-6" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Done</span>
          </div>
          <h3 className="text-2xl font-black text-on-surface">{fulfilledCount}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase mt-1">Fulfilled</p>
        </div>
      </div>

      {/* Active filter indicator */}
      {(statusFilter || priorityFilter) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider">Active Filters:</span>
          {statusFilter && (
            <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full font-bold flex items-center gap-1">
              {statusFilter} <button onClick={() => setStatusFilter('')} className="ml-1 hover:text-secondary/70">×</button>
            </span>
          )}
          {priorityFilter && (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-bold flex items-center gap-1">
              {priorityFilter} <button onClick={() => setPriorityFilter('')} className="ml-1 hover:text-primary/70">×</button>
            </span>
          )}
          <button onClick={() => { setStatusFilter(''); setPriorityFilter(''); }} className="text-slate-400 hover:text-slate-600 font-bold">Clear All</button>
        </div>
      )}

      {/* Request Cards */}
      <div className="space-y-6">
        <h3 className="text-xl font-extrabold tracking-tight text-on-surface">Active Requests</h3>
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-surface-container-lowest p-8 rounded-2xl text-center text-sm text-slate-400">
              No blood requests found{(statusFilter || priorityFilter) && ' matching the selected filters.'}
            </div>
          ) : (
            requests.map((request: any) => {
              const hospitalName = request.hospital?.organizationName || request.hospital?.name || 'Unknown Hospital';
              const requestId = request._id?.slice(-6)?.toUpperCase() || 'N/A';
              return (
                <div key={request._id}
                  className={cn("bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border-l-4 transition-all hover:shadow-md",
                    request.priority === 'Emergency' ? "border-primary" : "border-secondary"
                  )}>
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        request.priority === 'Emergency' ? "bg-error-container text-error" : "bg-secondary/10 text-secondary"
                      )}>
                        <Hospital className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-on-surface">{hospitalName}</h4>
                          {request.priority === 'Emergency' && (
                            <span className="px-2 py-0.5 bg-error-container text-error text-[9px] font-black uppercase rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> Emergency
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Request ID: <span className="font-bold text-slate-600">REQ-{requestId}</span>
                          {request.patientName && <> • Patient: <span className="font-bold">{request.patientName}</span></>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-black text-primary">{request.bloodGroup}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Blood Type</p>
                      </div>
                      <div className="w-px h-10 bg-surface-container-high"></div>
                      <div className="text-center">
                        <p className="text-lg font-black text-on-surface">{request.units}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Units</p>
                      </div>
                      <div className="w-px h-10 bg-surface-container-high"></div>
                      <div>
                        <span className={cn(
                          "px-3 py-1.5 text-[10px] font-black uppercase rounded-full inline-flex items-center gap-1.5",
                          request.status === 'Pending' ? "bg-amber-100 text-amber-700" :
                          request.status === 'Approved' ? "bg-secondary/10 text-secondary" :
                          request.status === 'Dispatched' ? "bg-secondary/10 text-secondary" :
                          request.status === 'Fulfilled' ? "bg-tertiary/10 text-tertiary" :
                          "bg-error-container text-error"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full",
                            request.status === 'Pending' ? "bg-amber-500 animate-pulse" :
                            request.status === 'Approved' ? "bg-secondary" :
                            request.status === 'Dispatched' ? "bg-secondary animate-pulse" :
                            request.status === 'Fulfilled' ? "bg-tertiary" : "bg-error"
                          )}></span>
                          {request.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {request.status === 'Pending' && (
                        <button onClick={() => handleStatusUpdate(request._id, 'Approved', '30m')}
                          className="px-4 py-2 bg-secondary text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:scale-[1.02] transition-all">
                          Approve
                        </button>
                      )}
                      {request.status === 'Approved' && (
                        <button onClick={() => handleStatusUpdate(request._id, 'Dispatched')}
                          className="px-4 py-2 bg-secondary text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:scale-[1.02] transition-all">
                          Dispatch
                        </button>
                      )}
                      {request.status === 'Dispatched' && (
                        <button onClick={() => handleStatusUpdate(request._id, 'Fulfilled')}
                          className="px-4 py-2 bg-tertiary text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:scale-[1.02] transition-all">
                          Mark Fulfilled
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Steps */}
                  <div className="px-6 pb-5">
                    <div className="flex items-center gap-2">
                      {['Pending', 'Approved', 'Dispatched', 'Fulfilled'].map((step, i) => (
                        <React.Fragment key={step}>
                          <div className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider",
                            statusOrder[request.status] >= i ? "text-secondary" : "text-slate-300"
                          )}>
                            <div className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center text-[8px]",
                              statusOrder[request.status] >= i ? "bg-secondary text-white" : "bg-surface-container-high text-slate-400"
                            )}>
                              {statusOrder[request.status] >= i ? '✓' : i + 1}
                            </div>
                            {step}
                          </div>
                          {i < 3 && (
                            <div className={cn("flex-1 h-0.5 rounded-full",
                              statusOrder[request.status] > i ? "bg-secondary" : "bg-surface-container-high"
                            )}></div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-low p-8 rounded-2xl">
          <h3 className="text-lg font-bold text-on-surface mb-4">Request Processing Guidelines</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest p-5 rounded-xl border-l-4 border-primary">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Emergency Protocol</p>
              <p className="text-sm text-on-surface mt-2">Emergency requests are auto-escalated and require processing within <span className="font-bold">30 minutes</span>.</p>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-xl border-l-4 border-secondary">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Standard Protocol</p>
              <p className="text-sm text-on-surface mt-2">Normal requests follow standard review cycle with a <span className="font-bold">4-hour</span> SLA window.</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-on-surface mb-4">Quick Links</h3>
          <div className="space-y-3">
            <button onClick={() => setShowDispatchHistory(true)} className="w-full text-left flex items-center justify-between p-3 bg-surface-container-low/40 rounded-xl hover:bg-surface-container-low transition-colors group">
              <span className="text-sm font-semibold text-on-surface flex items-center gap-2"><FileText className="w-4 h-4 text-secondary" /> Dispatch History</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-secondary transition-colors" />
            </button>
            <button onClick={() => setShowHospitalDir(true)} className="w-full text-left flex items-center justify-between p-3 bg-surface-container-low/40 rounded-xl hover:bg-surface-container-low transition-colors group">
              <span className="text-sm font-semibold text-on-surface flex items-center gap-2"><Building2 className="w-4 h-4 text-secondary" /> Hospital Directory</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-secondary transition-colors" />
            </button>
            <button onClick={() => setShowSLAReport(true)} className="w-full text-left flex items-center justify-between p-3 bg-surface-container-low/40 rounded-xl hover:bg-surface-container-low transition-colors group">
              <span className="text-sm font-semibold text-on-surface flex items-center gap-2"><BarChart3 className="w-4 h-4 text-secondary" /> SLA Reports</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-secondary transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Request Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Submit Blood Request" subtitle="Create a new blood request for a hospital">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blood Group *</label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button key={bg} type="button" onClick={() => setCreateForm({ ...createForm, bloodGroup: bg })}
                  className={cn("py-2.5 rounded-lg text-xs font-bold transition-all", createForm.bloodGroup === bg ? "bg-primary text-white" : "bg-surface-container-low text-slate-600 hover:bg-surface-container-high")}>
                  {bg}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Units *</label>
              <input type="number" min={1} value={createForm.units} onChange={(e) => setCreateForm({ ...createForm, units: +e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority</label>
              <div className="flex gap-2">
                {['Normal', 'Emergency'].map((p) => (
                  <button key={p} type="button" onClick={() => setCreateForm({ ...createForm, priority: p })}
                    className={cn("flex-1 py-2.5 rounded-lg text-xs font-bold transition-all",
                      createForm.priority === p ? (p === 'Emergency' ? "bg-primary text-white" : "bg-secondary text-white") : "bg-surface-container-low text-slate-600 hover:bg-surface-container-high")}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patient Name (optional)</label>
            <input type="text" value={createForm.patientName} onChange={(e) => setCreateForm({ ...createForm, patientName: e.target.value })} placeholder="John Doe"
              className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 placeholder:text-slate-300" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reason</label>
            <textarea value={createForm.reason} onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })} rows={2} placeholder="Reason for request..."
              className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 resize-none placeholder:text-slate-300" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 hover:bg-surface-container-low rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={createSubmitting} className="flex-1 py-2.5 blood-gradient text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
              {createSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dispatch History Modal */}
      <Modal isOpen={showDispatchHistory} onClose={() => setShowDispatchHistory(false)} title="Dispatch History" subtitle="Recently dispatched and fulfilled requests" size="lg">
        <div className="space-y-4">
          {requests.filter((r: any) => r.status === 'Dispatched' || r.status === 'Fulfilled').length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No dispatched or fulfilled requests yet.</p>
          ) : (
            requests.filter((r: any) => r.status === 'Dispatched' || r.status === 'Fulfilled').map((r: any) => (
              <div key={r._id} className="flex items-center gap-4 p-4 bg-surface-container-low/40 rounded-xl">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", r.status === 'Fulfilled' ? "bg-tertiary/10 text-tertiary" : "bg-secondary/10 text-secondary")}>
                  {r.status === 'Fulfilled' ? <CheckCircle2 className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface">{r.hospital?.organizationName || 'Hospital'} — {r.bloodGroup} ({r.units} units)</p>
                  <p className="text-[10px] text-slate-500 uppercase">{r.status} • {new Date(r.updatedAt || r.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Hospital Directory Modal */}
      <Modal isOpen={showHospitalDir} onClose={() => setShowHospitalDir(false)} title="Hospital Directory" subtitle="Hospitals that have submitted requests" size="lg">
        <div className="space-y-4">
          {(() => {
            const hospitals = new Map();
            requests.forEach((r: any) => {
              const hId = r.hospital?._id;
              if (hId && !hospitals.has(hId)) {
                hospitals.set(hId, { name: r.hospital?.organizationName || r.hospital?.name, email: r.hospital?.email, requests: 0 });
              }
              if (hId) hospitals.get(hId).requests++;
            });
            return Array.from(hospitals.values()).map((h: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-low/40 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface">{h.name}</p>
                  <p className="text-xs text-slate-500">{h.email} • {h.requests} requests</p>
                </div>
              </div>
            ));
          })()}
          {requests.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No hospitals in directory.</p>}
        </div>
      </Modal>

      {/* SLA Report Modal */}
      <Modal isOpen={showSLAReport} onClose={() => setShowSLAReport(false)} title="SLA Performance Report" subtitle="Service level agreement compliance metrics">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-surface-container-low/30 rounded-xl border-l-4 border-tertiary">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fulfillment Rate</p>
              <p className="text-2xl font-black text-on-surface mt-1">
                {requests.length > 0 ? Math.round((fulfilledCount / requests.length) * 100) : 0}%
              </p>
            </div>
            <div className="p-4 bg-surface-container-low/30 rounded-xl border-l-4 border-primary">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Emergency Count</p>
              <p className="text-2xl font-black text-on-surface mt-1">{emergencyCount}</p>
            </div>
            <div className="p-4 bg-surface-container-low/30 rounded-xl border-l-4 border-secondary">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Progress</p>
              <p className="text-2xl font-black text-on-surface mt-1">{inProgressCount}</p>
            </div>
            <div className="p-4 bg-surface-container-low/30 rounded-xl border-l-4 border-amber-500">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</p>
              <p className="text-2xl font-black text-on-surface mt-1">{pendingCount}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">Report generated: {new Date().toLocaleString()}</p>
        </div>
      </Modal>
    </div>
  );
};

export default Requests;
