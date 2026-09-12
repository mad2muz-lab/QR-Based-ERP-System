import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  HelpCircle,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Users,
  DollarSign,
  Percent,
} from 'lucide-react';
import {
  ApprovalWorkflowConfig,
  ApprovalTier,
  ApproverRole,
  approvalWorkflowService,
} from '../../utils/approvalWorkflowService';

const ROLE_LABELS: Record<ApproverRole, { label: string; badgeClass: string; desc: string }> = {
  operator: {
    label: 'Warehouse Operator',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    desc: 'Line staff, standard execution & self-verification',
  },
  supervisor: {
    label: 'Shift / Floor Supervisor',
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    desc: 'Authorized to review discrepancies, deviations & mid-value transfers',
  },
  manager: {
    label: 'Operations Manager',
    badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    desc: 'High-value sign-off, scrap disposal & contract dispatches',
  },
  admin: {
    label: 'System Admin / Director',
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    desc: 'Full fiduciary authority, major write-offs & governance override',
  },
};

export const ApprovalWorkflowManager: React.FC = () => {
  const [workflows, setWorkflows] = useState<ApprovalWorkflowConfig[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('wf_inbound_grn');
  const [isSaved, setIsSaved] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Test matrix calculator
  const [testAmount, setTestAmount] = useState<number>(3500);
  const [testVariance, setTestVariance] = useState<number>(0);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = () => {
    const loaded = approvalWorkflowService.getWorkflows();
    setWorkflows(loaded);
    if (loaded.length > 0 && !loaded.some((w) => w.id === activeWorkflowId)) {
      setActiveWorkflowId(loaded[0].id);
    }
  };

  const handleSave = () => {
    approvalWorkflowService.saveWorkflows(workflows);
    setIsSaved(true);
    setNotification('Workflow changes saved successfully.');
    setTimeout(() => {
      setIsSaved(false);
      setNotification(null);
    }, 3000);
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all approval workflows to industry standard defaults? Custom thresholds will be cleared.'
      )
    ) {
      const reset = approvalWorkflowService.resetToDefaults();
      setWorkflows(reset);
      setNotification('Reset to standard best-practice defaults.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const currentWorkflow = workflows.find((w) => w.id === activeWorkflowId);

  const updateCurrentWorkflow = (updated: Partial<ApprovalWorkflowConfig>) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === activeWorkflowId ? { ...w, ...updated, updatedAt: new Date().toISOString() } : w))
    );
  };

  const updateTier = (index: number, updated: Partial<ApprovalTier>) => {
    if (!currentWorkflow) return;
    const newTiers = [...currentWorkflow.tiers];
    newTiers[index] = { ...newTiers[index], ...updated };
    updateCurrentWorkflow({ tiers: newTiers });
  };

  const addTier = () => {
    if (!currentWorkflow) return;
    const lastTier = currentWorkflow.tiers[currentWorkflow.tiers.length - 1];
    const newMin = lastTier?.maxAmount ? lastTier.maxAmount + 1 : 10000;
    const newTier: ApprovalTier = {
      id: `tier_${Date.now()}`,
      name: `Custom Tier ${currentWorkflow.tiers.length + 1}`,
      minAmount: newMin,
      maxAmount: null,
      requiredRole: 'manager',
      requiresDualSignoff: false,
    };
    // Adjust previous tier max if it was null
    const newTiers = currentWorkflow.tiers.map((t, idx) => {
      if (idx === currentWorkflow.tiers.length - 1 && t.maxAmount === null) {
        return { ...t, maxAmount: newMin - 1 };
      }
      return t;
    });
    newTiers.push(newTier);
    updateCurrentWorkflow({ tiers: newTiers });
  };

  const removeTier = (index: number) => {
    if (!currentWorkflow || currentWorkflow.tiers.length <= 1) return;
    const newTiers = currentWorkflow.tiers.filter((_, idx) => idx !== index);
    // Make sure the last tier has maxAmount: null if needed
    if (newTiers[newTiers.length - 1].maxAmount !== null) {
      newTiers[newTiers.length - 1].maxAmount = null;
    }
    updateCurrentWorkflow({ tiers: newTiers });
  };

  // Live simulation of active workflow
  const simulationResult = currentWorkflow
    ? approvalWorkflowService.evaluateRequiredApproval(
        currentWorkflow.category,
        testAmount,
        testVariance
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Approval Authority & Hierarchy
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Customizable Matrix
                </span>
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
                Configure spending tiers, role-based authorization thresholds, dual sign-offs, and discrepancy escalation rules across inbound, outbound, transfer, and adjustment operations.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
              title="Revert back to standard industry presets"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaved ? 'Saved!' : 'Save Matrix'}
            </button>
          </div>
        </div>

        {notification && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {notification}
          </div>
        )}
      </div>

      {/* Main Grid: Category Nav + Config Details */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Workflow Selector */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 mb-2">
            Workflow Categories
          </h3>
          {workflows.map((wf) => {
            const isActive = wf.id === activeWorkflowId;
            return (
              <button
                key={wf.id}
                onClick={() => setActiveWorkflowId(wf.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                  isActive
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500/50 shadow-sm text-blue-900 dark:text-blue-100'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm">{wf.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {wf.tiers.length} Tiers • {wf.currency}
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    isActive ? 'text-blue-600 dark:text-blue-400 translate-x-0.5' : 'text-slate-400 group-hover:translate-x-0.5'
                  }`}
                />
              </button>
            );
          })}

          {/* Quick Info Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2 mt-4">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              Standard Best Practices
            </div>
            <p>
              Pre-configured thresholds follow ISO 9001 and standard ERP warehouse governance:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400">
              <li>Low-value inbound auto-verified on matching PO</li>
              <li>High-value shipments require dual sign-off</li>
              <li>Variance beyond threshold auto-escalates</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Active Workflow Details & Tiers */}
        {currentWorkflow && (
          <div className="lg:col-span-3 space-y-6">
            {/* Header / Enable Toggle */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {currentWorkflow.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  {currentWorkflow.description}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Currency
                  </label>
                  <select
                    value={currentWorkflow.currency}
                    onChange={(e) => updateCurrentWorkflow({ currency: e.target.value })}
                    className="text-xs font-medium bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="AED">AED (د.إ)</option>
                  </select>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentWorkflow.enabled}
                    onChange={(e) => updateCurrentWorkflow({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {currentWorkflow.enabled ? 'Active' : 'Disabled'}
                  </span>
                </label>
              </div>
            </div>

            {/* Threshold Tiers List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Value-Based Approval Tiers
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define monetary limits and corresponding authority levels required to approve transactions.
                  </p>
                </div>
                <button
                  onClick={addTier}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg flex items-center gap-1 border border-blue-200 dark:border-blue-800/60 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Tier
                </button>
              </div>

              <div className="space-y-3">
                {currentWorkflow.tiers.map((tier, idx) => {
                  const roleMeta = ROLE_LABELS[tier.requiredRole];
                  return (
                    <div
                      key={tier.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Tier Title */}
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={tier.name}
                            onChange={(e) => updateTier(idx, { name: e.target.value })}
                            className="text-sm font-semibold bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:outline-none text-slate-800 dark:text-slate-100 flex-1"
                            placeholder="Tier Name"
                          />
                        </div>

                        {/* Role selector */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500 dark:text-slate-400">Authority:</label>
                          <select
                            value={tier.requiredRole}
                            onChange={(e) =>
                              updateTier(idx, { requiredRole: e.target.value as ApproverRole })
                            }
                            className="text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="operator">Operator (Line Staff)</option>
                            <option value="supervisor">Supervisor (Shift Lead)</option>
                            <option value="manager">Manager (Department Head)</option>
                            <option value="admin">Administrator / Director</option>
                          </select>
                        </div>

                        {/* Delete Tier */}
                        {currentWorkflow.tiers.length > 1 && (
                          <button
                            onClick={() => removeTier(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                            title="Remove tier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Threshold inputs & Toggles */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                        {/* Min amount */}
                        <div>
                          <label className="block text-slate-500 dark:text-slate-400 mb-1">
                            Min Amount ({currentWorkflow.currency})
                          </label>
                          <input
                            type="number"
                            value={tier.minAmount}
                            onChange={(e) => updateTier(idx, { minAmount: Number(e.target.value) })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Max amount */}
                        <div>
                          <label className="block text-slate-500 dark:text-slate-400 mb-1">
                            Max Amount ({currentWorkflow.currency})
                          </label>
                          <input
                            type="number"
                            placeholder="Unlimited (and above)"
                            value={tier.maxAmount ?? ''}
                            onChange={(e) =>
                              updateTier(idx, {
                                maxAmount: e.target.value === '' ? null : Number(e.target.value),
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Checkboxes / Rules */}
                        <div className="flex flex-col justify-center space-y-1.5 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tier.requiresDualSignoff}
                              onChange={(e) =>
                                updateTier(idx, { requiresDualSignoff: e.target.checked })
                              }
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              Requires Dual Sign-off
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!tier.autoApproveBelow}
                              onChange={(e) =>
                                updateTier(idx, { autoApproveBelow: e.target.checked })
                              }
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              Auto-Approve / Bypass Review
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Role info snippet */}
                      <div className="flex items-center gap-2 text-xs pt-1 text-slate-500 dark:text-slate-400">
                        <span
                          className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${roleMeta.badgeClass}`}
                        >
                          {roleMeta.label}
                        </span>
                        <span>{roleMeta.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Discrepancy & Variance Escalation Rule Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Variance & Discrepancy Auto-Escalation
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Automatically override standard role hierarchy if quantity, weight, or cost deviations exceed tolerance.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentWorkflow.varianceRule?.enabled ?? false}
                    onChange={(e) =>
                      updateCurrentWorkflow({
                        varianceRule: {
                          enabled: e.target.checked,
                          percentThreshold: currentWorkflow.varianceRule?.percentThreshold ?? 5,
                          escalateToRole:
                            currentWorkflow.varianceRule?.escalateToRole ?? 'supervisor',
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {currentWorkflow.varianceRule?.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" />
                      Variance Threshold (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={currentWorkflow.varianceRule.percentThreshold}
                      onChange={(e) =>
                        updateCurrentWorkflow({
                          varianceRule: {
                            ...currentWorkflow.varianceRule!,
                            percentThreshold: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Discrepancies exceeding this percentage will bypass operator approval.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Mandatory Escalation Role
                    </label>
                    <select
                      value={currentWorkflow.varianceRule.escalateToRole}
                      onChange={(e) =>
                        updateCurrentWorkflow({
                          varianceRule: {
                            ...currentWorkflow.varianceRule!,
                            escalateToRole: e.target.value as ApproverRole,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="supervisor">Supervisor (Shift Lead)</option>
                      <option value="manager">Manager (Operations Head)</option>
                      <option value="admin">Administrator (Director)</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      The role required to approve discrepancy write-offs.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Rule Simulator */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <div>
                  <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Interactive Rule Simulator
                  </h4>
                  <p className="text-xs text-slate-400">
                    Test how current rules and thresholds evaluate for a hypothetical transaction.
                  </p>
                </div>
                <span className="text-xs font-mono bg-slate-800 border border-slate-700 px-2.5 py-1 rounded text-slate-300">
                  Live Preview
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Simulated Value ({currentWorkflow.currency})
                  </label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Simulated Variance Discrepancy (%)
                  </label>
                  <input
                    type="number"
                    value={testVariance}
                    onChange={(e) => setTestVariance(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700 flex flex-col justify-center">
                  <div className="text-xs text-slate-400">Evaluation Result</div>
                  {simulationResult && (
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${
                          simulationResult.requiredRole === 'admin'
                            ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                            : simulationResult.requiredRole === 'manager'
                            ? 'bg-purple-900/60 text-purple-300 border border-purple-700'
                            : simulationResult.requiredRole === 'supervisor'
                            ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                            : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                        }`}
                      >
                        {simulationResult.requiredRole} Sign-off
                      </span>
                      {simulationResult.requiresDualSignoff && (
                        <span className="text-[11px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded border border-amber-700 font-semibold">
                          Dual Sign-off
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {simulationResult && (
                <div className="text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/60 flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{simulationResult.reason}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
