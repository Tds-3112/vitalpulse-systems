import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Bell, Database, Users, Globe, Lock, Save, CheckCircle2, Key, Trash2, Download, Upload, RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { useToast } from './Toast';

const TABS = [
  { id: 'general', label: 'General Settings', icon: SettingsIcon },
  { id: 'security', label: 'Security & Privacy', icon: Shield },
  { id: 'notifications', label: 'Notification Rules', icon: Bell },
  { id: 'data', label: 'Data Management', icon: Database },
  { id: 'permissions', label: 'User Permissions', icon: Users },
  { id: 'regional', label: 'Regional API', icon: Globe },
];

const Settings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  // General settings form
  const [generalForm, setGeneralForm] = useState({
    facilityName: user?.organizationName || 'Central Blood Bank & Research Center',
    systemId: 'VITAL-PULSE-001',
    timezone: 'UTC+05:30 (IST)',
    language: 'English (Clinical Standard)',
    criticalStockLevel: 15,
    autoDispatch: true,
  });

  // Security settings
  const [securityForm, setSecurityForm] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordMinLength: 8,
    loginAttempts: 5,
    ipWhitelisting: false,
    auditLogRetention: 90,
  });

  // Notification settings
  const [notifForm, setNotifForm] = useState({
    emailAlerts: true,
    criticalStockAlert: true,
    emergencyRequestAlert: true,
    donationComplete: true,
    weeklyReport: true,
    monthlyAnalytics: false,
    systemMaintenance: true,
  });

  // Data management
  const [dataForm, setDataForm] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 365,
    compressionEnabled: true,
  });

  // Permissions
  const [permForm, setPermForm] = useState({
    donorCanViewInventory: true,
    hospitalCanCreateRequest: true,
    adminApprovalRequired: true,
    donorSelfRegistration: true,
  });

  // Regional API
  const [regionalForm, setRegionalForm] = useState({
    apiEndpoint: 'https://api.vitalpulse.regional.health',
    syncEnabled: false,
    syncInterval: 60,
    dataSharing: 'anonymous',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate save for settings that don't have a backend
      // For user-related settings, update via API
      if (activeTab === 'general' && user) {
        await userAPI.update(user._id, { organizationName: generalForm.facilityName });
      }
      await new Promise(r => setTimeout(r, 500)); // Simulate network
      showToast('success', `${TABS.find(t => t.id === activeTab)?.label} saved successfully!`);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button type="button" onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", checked ? "bg-secondary" : "bg-surface-container-high")}>
      <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow", checked ? "translate-x-6" : "translate-x-1")} />
    </button>
  );

  const SettingRow = ({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between p-4 bg-surface-container-low/40 rounded-xl">
      <div>
        <p className="text-sm font-bold text-on-surface">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      {children}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-xl font-headline font-extrabold text-on-surface border-b border-surface-container-high pb-4">General Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Facility Name</label>
                  <input type="text" value={generalForm.facilityName}
                    onChange={(e) => setGeneralForm({ ...generalForm, facilityName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System ID</label>
                  <input type="text" value={generalForm.systemId} disabled
                    className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium opacity-60 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timezone</label>
                  <select value={generalForm.timezone} onChange={(e) => setGeneralForm({ ...generalForm, timezone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20">
                    <option>UTC-05:00 (Eastern Time)</option>
                    <option>UTC+00:00 (GMT)</option>
                    <option>UTC+05:30 (IST)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Default Language</label>
                  <select value={generalForm.language} onChange={(e) => setGeneralForm({ ...generalForm, language: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20">
                    <option>English (Clinical Standard)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>Hindi</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="space-y-6 pt-4">
              <h3 className="text-xl font-headline font-extrabold text-on-surface border-b border-surface-container-high pb-4">Operational Thresholds</h3>
              <SettingRow title="Critical Stock Alert Level" desc="Trigger system-wide notification when units drop below this value.">
                <div className="flex items-center gap-3">
                  <input type="number" value={generalForm.criticalStockLevel}
                    onChange={(e) => setGeneralForm({ ...generalForm, criticalStockLevel: +e.target.value })}
                    className="w-16 px-3 py-1.5 bg-white border border-surface-container-high rounded-lg text-sm font-bold text-center" />
                  <span className="text-xs font-bold text-slate-400 uppercase">Units</span>
                </div>
              </SettingRow>
              <SettingRow title="Auto-Dispatch Priority" desc="Automatically approve requests from Level 1 Trauma Centers.">
                <Toggle checked={generalForm.autoDispatch} onChange={(v) => setGeneralForm({ ...generalForm, autoDispatch: v })} />
              </SettingRow>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-headline font-extrabold text-on-surface border-b border-surface-container-high pb-4">Security & Privacy</h3>
            <SettingRow title="Two-Factor Authentication" desc="Require 2FA for all admin accounts to enhance security.">
              <Toggle checked={securityForm.twoFactorEnabled} onChange={(v) => setSecurityForm({ ...securityForm, twoFactorEnabled: v })} />
            </SettingRow>
            <SettingRow title="Session Timeout (minutes)" desc="Auto-logout inactive users after the specified period.">
              <input type="number" value={securityForm.sessionTimeout} min={5} max={120}
                onChange={(e) => setSecurityForm({ ...securityForm, sessionTimeout: +e.target.value })}
                className="w-16 px-3 py-1.5 bg-white border border-surface-container-high rounded-lg text-sm font-bold text-center" />
            </SettingRow>
            <SettingRow title="Password Minimum Length" desc="Enforce a minimum password length for all users.">
              <input type="number" value={securityForm.passwordMinLength} min={6} max={32}
                onChange={(e) => setSecurityForm({ ...securityForm, passwordMinLength: +e.target.value })}
                className="w-16 px-3 py-1.5 bg-white border border-surface-container-high rounded-lg text-sm font-bold text-center" />
            </SettingRow>
            <SettingRow title="Maximum Login Attempts" desc="Lock account after this many failed login attempts.">
              <input type="number" value={securityForm.loginAttempts} min={3} max={10}
                onChange={(e) => setSecurityForm({ ...securityForm, loginAttempts: +e.target.value })}
                className="w-16 px-3 py-1.5 bg-white border border-surface-container-high rounded-lg text-sm font-bold text-center" />
            </SettingRow>
            <SettingRow title="IP Whitelisting" desc="Restrict API access to approved IP addresses only.">
              <Toggle checked={securityForm.ipWhitelisting} onChange={(v) => setSecurityForm({ ...securityForm, ipWhitelisting: v })} />
            </SettingRow>
            <SettingRow title="Audit Log Retention (days)" desc="How long to retain security audit logs.">
              <input type="number" value={securityForm.auditLogRetention} min={30} max={730}
                onChange={(e) => setSecurityForm({ ...securityForm, auditLogRetention: +e.target.value })}
                className="w-16 px-3 py-1.5 bg-white border border-surface-container-high rounded-lg text-sm font-bold text-center" />
            </SettingRow>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-surface-container-low p-5 rounded-xl">
                <div className="flex items-center gap-2 text-primary mb-2"><Lock className="w-4 h-4" /><span className="font-bold text-sm">Last Audit</span></div>
                <p className="text-xs text-slate-600">March 12, 2026 — All protocols compliant.</p>
              </div>
              <div className="bg-surface-container-low p-5 rounded-xl">
                <div className="flex items-center gap-2 text-tertiary mb-2"><Key className="w-4 h-4" /><span className="font-bold text-sm">Encryption</span></div>
                <p className="text-xs text-slate-600">AES-256 encryption active for all data at rest.</p>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-headline font-extrabold text-on-surface border-b border-surface-container-high pb-4">Notification Rules</h3>
            <SettingRow title="Email Alerts" desc="Send email notifications for important events.">
              <Toggle checked={notifForm.emailAlerts} onChange={(v) => setNotifForm({ ...notifForm, emailAlerts: v })} />
            </SettingRow>
            <SettingRow title="Critical Stock Alerts" desc="Notify when blood units drop below critical threshold.">
              <Toggle checked={notifForm.criticalStockAlert} onChange={(v) => setNotifForm({ ...notifForm, criticalStockAlert: v })} />
            </SettingRow>
            <SettingRow title="Emergency Request Alerts" desc="Immediate notification for emergency blood requests.">
              <Toggle checked={notifForm.emergencyRequestAlert} onChange={(v) => setNotifForm({ ...notifForm, emergencyRequestAlert: v })} />
            </SettingRow>
            <SettingRow title="Donation Completion" desc="Notify when a donation is processed and validated.">
              <Toggle checked={notifForm.donationComplete} onChange={(v) => setNotifForm({ ...notifForm, donationComplete: v })} />
            </SettingRow>
            <SettingRow title="Weekly Summary Report" desc="Automated weekly report sent to admin accounts.">
              <Toggle checked={notifForm.weeklyReport} onChange={(v) => setNotifForm({ ...notifForm, weeklyReport: v })} />
            </SettingRow>
            <SettingRow title="Monthly Analytics Digest" desc="Comprehensive monthly analytics and trends.">
              <Toggle checked={notifForm.monthlyAnalytics} onChange={(v) => setNotifForm({ ...notifForm, monthlyAnalytics: v })} />
            </SettingRow>
            <SettingRow title="System Maintenance Alerts" desc="Notify about scheduled maintenance and downtime.">
              <Toggle checked={notifForm.systemMaintenance} onChange={(v) => setNotifForm({ ...notifForm, systemMaintenance: v })} />
            </SettingRow>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-headline font-extrabold text-on-surface border-b border-surface-container-high pb-4">Data Management</h3>
            <SettingRow title="Automated Backup" desc="Enable automatic database backups at regular intervals.">
              <Toggle checked={dataForm.autoBackup} onChange={(v) => setDataForm({ ...dataForm, autoBackup: v })} />
            </SettingRow>
            <SettingRow title="Backup Frequency" desc="How often to perform automated backups.">
              <select value={dataForm.backupFrequency} onChange={(e) => setDataForm({ ...dataForm, backupFrequency: e.target.value })}
                className="px-3 py-1.5 bg-white border border-surface-container-high rounded-lg text-sm font-medium">
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </SettingRow>
            <SettingRow title="Data Retention (days)" desc="How long to keep historical records before archiving.">
              <input type="number" value={dataForm.retentionDays} min={30}
                onChange={(e) => setDataForm({ ...dataForm, retentionDays: +e.target.value })}
                className="w-20 px-3 py-1.5 bg-white border border-surface-container-high rounded-lg text-sm font-bold text-center" />
            </SettingRow>
            <SettingRow title="Data Compression" desc="Compress archived data to save storage space.">
              <Toggle checked={dataForm.compressionEnabled} onChange={(v) => setDataForm({ ...dataForm, compressionEnabled: v })} />
            </SettingRow>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <button onClick={() => showToast('success', 'Manual backup initiated!')} className="p-4 bg-surface-container-low rounded-xl text-center hover:bg-surface-container-high transition-colors">
                <Download className="w-5 h-5 text-secondary mx-auto mb-2" />
                <p className="text-xs font-bold text-on-surface">Export Data</p>
              </button>
              <button onClick={() => showToast('info', 'Import feature ready. Select a backup file.')} className="p-4 bg-surface-container-low rounded-xl text-center hover:bg-surface-container-high transition-colors">
                <Upload className="w-5 h-5 text-secondary mx-auto mb-2" />
                <p className="text-xs font-bold text-on-surface">Import Data</p>
              </button>
              <button onClick={() => showToast('info', 'Database maintenance mode not recommended during active hours.')} className="p-4 bg-surface-container-low rounded-xl text-center hover:bg-surface-container-high transition-colors">
                <RefreshCw className="w-5 h-5 text-secondary mx-auto mb-2" />
                <p className="text-xs font-bold text-on-surface">Optimize DB</p>
              </button>
            </div>
          </div>
        );

      case 'permissions':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-headline font-extrabold text-on-surface border-b border-surface-container-high pb-4">User Permissions</h3>
            <SettingRow title="Donor Can View Inventory" desc="Allow donors to see current blood inventory levels.">
              <Toggle checked={permForm.donorCanViewInventory} onChange={(v) => setPermForm({ ...permForm, donorCanViewInventory: v })} />
            </SettingRow>
            <SettingRow title="Hospital Can Create Requests" desc="Allow hospital accounts to submit blood requests directly.">
              <Toggle checked={permForm.hospitalCanCreateRequest} onChange={(v) => setPermForm({ ...permForm, hospitalCanCreateRequest: v })} />
            </SettingRow>
            <SettingRow title="Admin Approval Required" desc="Require admin approval for all non-emergency requests.">
              <Toggle checked={permForm.adminApprovalRequired} onChange={(v) => setPermForm({ ...permForm, adminApprovalRequired: v })} />
            </SettingRow>
            <SettingRow title="Donor Self-Registration" desc="Allow donors to register themselves through the login page.">
              <Toggle checked={permForm.donorSelfRegistration} onChange={(v) => setPermForm({ ...permForm, donorSelfRegistration: v })} />
            </SettingRow>
            <div className="bg-surface-container-low p-6 rounded-xl mt-4">
              <h4 className="font-bold text-on-surface mb-3">Role Overview</h4>
              <div className="space-y-2">
                {[
                  { role: 'Admin', perms: 'Full access — manage all resources, users, settings', color: 'text-primary' },
                  { role: 'Donor', perms: 'View own donations, update profile, schedule appointments', color: 'text-tertiary' },
                  { role: 'Hospital', perms: 'Create requests, view request status, manage organization', color: 'text-secondary' },
                ].map((r) => (
                  <div key={r.role} className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-lg">
                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider", r.color, `bg-current/10`)}
                      style={{ backgroundColor: `color-mix(in srgb, currentColor 10%, transparent)` }}>
                      {r.role}
                    </span>
                    <span className="text-xs text-slate-600">{r.perms}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'regional':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-headline font-extrabold text-on-surface border-b border-surface-container-high pb-4">Regional API Configuration</h3>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Regional Health API Endpoint</label>
              <input type="url" value={regionalForm.apiEndpoint}
                onChange={(e) => setRegionalForm({ ...regionalForm, apiEndpoint: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary/20" />
            </div>
            <SettingRow title="Enable Data Sync" desc="Synchronize inventory data with the regional health authority.">
              <Toggle checked={regionalForm.syncEnabled} onChange={(v) => setRegionalForm({ ...regionalForm, syncEnabled: v })} />
            </SettingRow>
            <SettingRow title="Sync Interval (minutes)" desc="How frequently to sync data with the regional API.">
              <input type="number" value={regionalForm.syncInterval} min={5} max={1440}
                onChange={(e) => setRegionalForm({ ...regionalForm, syncInterval: +e.target.value })}
                className="w-20 px-3 py-1.5 bg-white border border-surface-container-high rounded-lg text-sm font-bold text-center" />
            </SettingRow>
            <SettingRow title="Data Sharing Level" desc="Control what data is shared with the regional authority.">
              <select value={regionalForm.dataSharing} onChange={(e) => setRegionalForm({ ...regionalForm, dataSharing: e.target.value })}
                className="px-3 py-1.5 bg-white border border-surface-container-high rounded-lg text-sm font-medium">
                <option value="none">None</option>
                <option value="anonymous">Anonymous (Aggregate only)</option>
                <option value="full">Full (Including identifiers)</option>
              </select>
            </SettingRow>
            <div className="bg-surface-container-low p-5 rounded-xl border-l-4 border-secondary">
              <p className="text-sm font-bold text-on-surface">API Connectivity Status</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn("w-2 h-2 rounded-full", regionalForm.syncEnabled ? "bg-tertiary animate-pulse" : "bg-slate-300")}></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{regionalForm.syncEnabled ? 'Connected & Syncing' : 'Disconnected'}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Last sync: {regionalForm.syncEnabled ? 'Just now' : 'Never'}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-10">
      <section>
        <h2 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">System Configuration</h2>
        <p className="text-on-surface-variant mt-1">Manage administrative controls, security protocols, and integration settings.</p>
      </section>

      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <div className="col-span-12 lg:col-span-3 space-y-2">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id ? "bg-white text-secondary shadow-sm" : "text-slate-500 hover:bg-surface-container-low"
              )}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="col-span-12 lg:col-span-9 space-y-8">
          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-surface-container-high/30 space-y-8">
            {renderTabContent()}

            <div className="flex justify-end gap-4 pt-6 border-t border-surface-container-high/30">
              <button onClick={() => showToast('info', 'Changes discarded')} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-surface-container-low rounded-xl transition-colors">
                Discard Changes
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-8 py-2.5 bg-secondary text-white rounded-xl font-bold text-sm shadow-lg shadow-secondary/20 flex items-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
