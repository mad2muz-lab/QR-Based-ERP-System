export type WorkflowCategory = 'inbound_grn' | 'outbound_gdn' | 'transfer' | 'adjustment';

export type ApproverRole = 'operator' | 'supervisor' | 'manager' | 'admin';

export interface ApprovalTier {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number | null; // null = and above
  requiredRole: ApproverRole;
  requiresDualSignoff: boolean;
  autoApproveBelow?: boolean;
}

export interface VarianceRule {
  enabled: boolean;
  percentThreshold: number; // e.g. 5% variance triggers supervisor
  escalateToRole: ApproverRole;
}

export interface ApprovalWorkflowConfig {
  id: string;
  category: WorkflowCategory;
  title: string;
  description: string;
  enabled: boolean;
  currency: string;
  tiers: ApprovalTier[];
  varianceRule?: VarianceRule;
  updatedAt: string;
}

const STORAGE_KEY = 'erp_approval_workflow_configs';

export const STANDARD_DEFAULT_WORKFLOWS: ApprovalWorkflowConfig[] = [
  {
    id: 'wf_inbound_grn',
    category: 'inbound_grn',
    title: 'Inbound Goods Receipt (GRN)',
    description: 'Approval rules for receiving purchase orders, physical inspection, and stock entry.',
    enabled: true,
    currency: 'USD',
    varianceRule: {
      enabled: true,
      percentThreshold: 5,
      escalateToRole: 'supervisor',
    },
    tiers: [
      {
        id: 'tier_grn_1',
        name: 'Standard PO Receipt',
        minAmount: 0,
        maxAmount: 2500,
        requiredRole: 'operator',
        requiresDualSignoff: false,
        autoApproveBelow: true,
      },
      {
        id: 'tier_grn_2',
        name: 'Mid-Value PO Inbound',
        minAmount: 2500,
        maxAmount: 15000,
        requiredRole: 'supervisor',
        requiresDualSignoff: false,
      },
      {
        id: 'tier_grn_3',
        name: 'High-Value / Capital Receipt',
        minAmount: 15000,
        maxAmount: null,
        requiredRole: 'manager',
        requiresDualSignoff: true,
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wf_outbound_gdn',
    category: 'outbound_gdn',
    title: 'Outbound Dispatch (GDN)',
    description: 'Dispatch authorization for customer sales shipments and external transfers.',
    enabled: true,
    currency: 'USD',
    varianceRule: {
      enabled: true,
      percentThreshold: 0, // Any quantity mismatch requires supervisor
      escalateToRole: 'supervisor',
    },
    tiers: [
      {
        id: 'tier_gdn_1',
        name: 'Standard Sales Order Dispatch',
        minAmount: 0,
        maxAmount: 5000,
        requiredRole: 'operator',
        requiresDualSignoff: false,
      },
      {
        id: 'tier_gdn_2',
        name: 'Commercial Shipment',
        minAmount: 5000,
        maxAmount: 25000,
        requiredRole: 'supervisor',
        requiresDualSignoff: false,
      },
      {
        id: 'tier_gdn_3',
        name: 'High-Value Consignment',
        minAmount: 25000,
        maxAmount: null,
        requiredRole: 'manager',
        requiresDualSignoff: true,
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wf_transfer',
    category: 'transfer',
    title: 'Inter-Warehouse & Bin Transfers',
    description: 'Sign-off requirements for moving items between zones, aisles, or external warehouse facilities.',
    enabled: true,
    currency: 'USD',
    tiers: [
      {
        id: 'tier_trans_1',
        name: 'Intra-Warehouse Relocation (Bin-to-Bin)',
        minAmount: 0,
        maxAmount: 10000,
        requiredRole: 'operator',
        requiresDualSignoff: false,
        autoApproveBelow: true,
      },
      {
        id: 'tier_trans_2',
        name: 'Inter-Facility Transfer',
        minAmount: 10000,
        maxAmount: 50000,
        requiredRole: 'supervisor',
        requiresDualSignoff: false,
      },
      {
        id: 'tier_trans_3',
        name: 'Major Stock Re-allocation',
        minAmount: 50000,
        maxAmount: null,
        requiredRole: 'manager',
        requiresDualSignoff: false,
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wf_adjustment',
    category: 'adjustment',
    title: 'Inventory Adjustments & Scrap',
    description: 'Write-off, cycle count variances, damaged stock disposal, and manual stock updates.',
    enabled: true,
    currency: 'USD',
    varianceRule: {
      enabled: true,
      percentThreshold: 2,
      escalateToRole: 'manager',
    },
    tiers: [
      {
        id: 'tier_adj_1',
        name: 'Minor Cycle Count Discrepancy',
        minAmount: 0,
        maxAmount: 200,
        requiredRole: 'operator',
        requiresDualSignoff: false,
      },
      {
        id: 'tier_adj_2',
        name: 'Material Variance / Damaged Write-off',
        minAmount: 200,
        maxAmount: 2000,
        requiredRole: 'supervisor',
        requiresDualSignoff: false,
      },
      {
        id: 'tier_adj_3',
        name: 'Major Inventory Write-off',
        minAmount: 2000,
        maxAmount: null,
        requiredRole: 'admin',
        requiresDualSignoff: true,
      },
    ],
    updatedAt: new Date().toISOString(),
  },
];

export const approvalWorkflowService = {
  /**
   * Fetch all workflow configs (from LocalStorage or fallback to industry defaults)
   */
  getWorkflows(): ApprovalWorkflowConfig[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load approval workflows from storage, returning defaults:', e);
    }
    return STANDARD_DEFAULT_WORKFLOWS;
  },

  /**
   * Save workflow configs
   */
  saveWorkflows(workflows: ApprovalWorkflowConfig[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    } catch (e) {
      console.error('Failed to persist approval workflows:', e);
    }
  },

  /**
   * Reset configurations to standard industry best-practice defaults
   */
  resetToDefaults(): ApprovalWorkflowConfig[] {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to reset workflows:', e);
    }
    return STANDARD_DEFAULT_WORKFLOWS;
  },

  /**
   * Evaluates a transaction's value and variance to identify the required approval authority
   */
  evaluateRequiredApproval(
    category: WorkflowCategory,
    totalValue: number,
    variancePercent: number = 0
  ): {
    requiresApproval: boolean;
    requiredRole: ApproverRole;
    tierName: string;
    requiresDualSignoff: boolean;
    escalatedDueToVariance: boolean;
    reason: string;
  } {
    const workflows = this.getWorkflows();
    const config = workflows.find((w) => w.category === category);

    if (!config || !config.enabled) {
      return {
        requiresApproval: false,
        requiredRole: 'operator',
        tierName: 'Disabled/Auto',
        requiresDualSignoff: false,
        escalatedDueToVariance: false,
        reason: 'Approval workflow is not enabled for this category.',
      };
    }

    // Check tiers based on value
    const matchedTier = config.tiers.find((tier) => {
      const min = tier.minAmount;
      const max = tier.maxAmount;
      if (max === null) {
        return totalValue >= min;
      }
      return totalValue >= min && totalValue <= max;
    }) || config.tiers[config.tiers.length - 1];

    let requiredRole = matchedTier.requiredRole;
    let escalatedDueToVariance = false;
    let reason = `Triggered by ${matchedTier.name} (Value: $${totalValue.toLocaleString()})`;

    // Check variance rule escalation
    if (
      config.varianceRule &&
      config.varianceRule.enabled &&
      variancePercent > config.varianceRule.percentThreshold
    ) {
      escalatedDueToVariance = true;
      requiredRole = config.varianceRule.escalateToRole;
      reason += ` - Escalated to ${requiredRole} due to ${variancePercent.toFixed(1)}% variance (threshold: ${config.varianceRule.percentThreshold}%)`;
    }

    const requiresApproval = !matchedTier.autoApproveBelow || escalatedDueToVariance;

    return {
      requiresApproval,
      requiredRole,
      tierName: matchedTier.name,
      requiresDualSignoff: matchedTier.requiresDualSignoff,
      escalatedDueToVariance,
      reason,
    };
  },
};
