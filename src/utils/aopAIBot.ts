import { 
  AOPAIResponse, 
  AOPAIContext, 
  FinancialMetrics, 
  ProjectMetrics, 
  Budget, 
  CostCenter, 
  Project,
  AOPAlert
} from '../types/aop';
import { AOPDataService } from './aopDataService';

export class AOPAIBot {
  private static readonly RESPONSE_TYPES = {
    BUDGET_GUIDANCE: 'budget_guidance',
    COST_OPTIMIZATION: 'cost_optimization',
    PROJECT_ANALYSIS: 'project_analysis',
    FINANCIAL_INSIGHTS: 'financial_insights',
    FORECASTING: 'forecasting',
    GENERAL_HELP: 'general_help'
  };

  // ===== MAIN AI RESPONSE GENERATOR =====
  
  static async generateResponse(context: AOPAIContext): Promise<AOPAIResponse> {
    const query = context.user_query.toLowerCase();
    
    // Analyze query intent
    if (this.isBudgetQuery(query)) {
      return await this.generateBudgetGuidance(context);
    } else if (this.isCostOptimizationQuery(query)) {
      return await this.generateCostOptimizationAdvice(context);
    } else if (this.isProjectQuery(query)) {
      return await this.generateProjectAnalysis(context);
    } else if (this.isFinancialQuery(query)) {
      return await this.generateFinancialInsights(context);
    } else if (this.isForecastingQuery(query)) {
      return await this.generateForecasting(context);
    } else {
      return await this.generateGeneralHelp(context);
    }
  }

  // ===== QUERY INTENT DETECTION =====
  
  private static isBudgetQuery(query: string): boolean {
    const budgetKeywords = [
      'budget', 'budgeting', 'allocation', 'spending', 'expense', 'cost center',
      'variance', 'over budget', 'under budget', 'budget planning'
    ];
    return budgetKeywords.some(keyword => query.includes(keyword));
  }

  private static isCostOptimizationQuery(query: string): boolean {
    const costKeywords = [
      'optimize', 'reduce cost', 'cost saving', 'efficiency', 'optimization',
      'cut cost', 'cost reduction', 'save money', 'efficient'
    ];
    return costKeywords.some(keyword => query.includes(keyword));
  }

  private static isProjectQuery(query: string): boolean {
    const projectKeywords = [
      'project', 'roi', 'return on investment', 'project performance',
      'project analysis', 'project metrics', 'completion', 'timeline'
    ];
    return projectKeywords.some(keyword => query.includes(keyword));
  }

  private static isFinancialQuery(query: string): boolean {
    const financialKeywords = [
      'profit', 'revenue', 'margin', 'financial', 'performance',
      'profitability', 'earnings', 'income', 'financial analysis'
    ];
    return financialKeywords.some(keyword => query.includes(keyword));
  }

  private static isForecastingQuery(query: string): boolean {
    const forecastKeywords = [
      'forecast', 'prediction', 'future', 'trend', 'projection',
      'estimate', 'predict', 'upcoming', 'next period'
    ];
    return forecastKeywords.some(keyword => query.includes(keyword));
  }

  // ===== BUDGET GUIDANCE =====
  
  private static async generateBudgetGuidance(context: AOPAIContext): Promise<AOPAIResponse> {
    const costCenters = await AOPDataService.getCostCenters();
    const budgets = await AOPDataService.getBudgets();
    const metrics = await AOPDataService.getFinancialMetrics();

    let title = 'Budget Guidance';
    let message = '';
    let suggestions: string[] = [];
    let confidenceScore = 0.8;

    if (context.cost_center_id) {
      const costCenter = costCenters.find(cc => cc.id === context.cost_center_id);
      const costCenterBudgets = budgets.filter(b => b.cost_center_id === context.cost_center_id);
      const metric = metrics.find(m => m.cost_center_id === context.cost_center_id);

      if (costCenter && metric) {
        title = `Budget Guidance for ${costCenter.name}`;
        
        if (metric.variance_percentage > 10) {
          message = `⚠️ **Budget Alert**: ${costCenter.name} is currently ${metric.variance_percentage.toFixed(1)}% over budget. `;
          message += `Actual spending is ${metric.total_actual.toLocaleString()} vs budgeted ${metric.total_budget.toLocaleString()}.`;
          
          suggestions = [
            'Review recent cost allocations to identify overspending areas',
            'Consider reallocating budget from under-utilized categories',
            'Implement cost control measures for high-spending activities',
            'Request budget increase if additional funding is justified'
          ];
          confidenceScore = 0.9;
        } else if (metric.variance_percentage < -10) {
          message = `✅ **Budget Status**: ${costCenter.name} is ${Math.abs(metric.variance_percentage).toFixed(1)}% under budget. `;
          message += `This may indicate conservative planning or delayed spending.`;
          
          suggestions = [
            'Review if under-spending is due to delayed projects',
            'Consider reallocating unused budget to other cost centers',
            'Evaluate if budget targets were set too conservatively',
            'Plan for potential year-end spending acceleration'
          ];
          confidenceScore = 0.85;
        } else {
          message = `✅ **Budget Status**: ${costCenter.name} is on track with ${metric.variance_percentage.toFixed(1)}% variance. `;
          message += `Current spending aligns well with budgeted amounts.`;
          
          suggestions = [
            'Continue monitoring spending patterns',
            'Maintain current budget allocation strategy',
            'Prepare for quarterly budget review',
            'Document successful budget management practices'
          ];
          confidenceScore = 0.8;
        }
      }
    } else {
      // General budget guidance
      const overBudgetCenters = metrics.filter(m => m.variance_percentage > 10);
      const underBudgetCenters = metrics.filter(m => m.variance_percentage < -10);
      
      message = `📊 **Overall Budget Status**: `;
      message += `${overBudgetCenters.length} cost centers are over budget, `;
      message += `${underBudgetCenters.length} are under budget. `;
      message += `Average variance across all centers is ${(metrics.reduce((sum, m) => sum + m.variance_percentage, 0) / metrics.length).toFixed(1)}%.`;
      
      suggestions = [
        'Focus on cost centers with highest variance percentages',
        'Review budget allocation methodology for next period',
        'Implement variance reporting for early warning',
        'Consider budget reallocation between centers'
      ];
    }

    return {
      id: `ai-${Date.now()}`,
      type: this.RESPONSE_TYPES.BUDGET_GUIDANCE,
      title,
      message,
      suggestions,
      confidence_score: confidenceScore,
      created_at: new Date().toISOString()
    };
  }

  // ===== COST OPTIMIZATION ADVICE =====
  
  private static async generateCostOptimizationAdvice(context: AOPAIContext): Promise<AOPAIResponse> {
    const metrics = await AOPDataService.getFinancialMetrics();
    const allocations = await AOPDataService.getCostAllocations();

    const title = 'Cost Optimization Recommendations';
    let message = '';
    let suggestions: string[] = [];
    let confidenceScore = 0.85;

    // Analyze cost breakdowns
    const totalPersonnelCost = metrics.reduce((sum, m) => sum + m.personnel_cost, 0);
    const totalEquipmentCost = metrics.reduce((sum, m) => sum + m.equipment_cost, 0);
    const totalMaterialCost = metrics.reduce((sum, m) => sum + m.material_cost, 0);
    const totalOverheadCost = metrics.reduce((sum, m) => sum + m.overhead_cost, 0);
    const totalMaintenanceCost = metrics.reduce((sum, m) => sum + m.maintenance_cost, 0);

    const totalCost = totalPersonnelCost + totalEquipmentCost + totalMaterialCost + totalOverheadCost + totalMaintenanceCost;

    message = `💰 **Cost Analysis**: Total costs breakdown:\n`;
    message += `• Personnel: ${((totalPersonnelCost / totalCost) * 100).toFixed(1)}%\n`;
    message += `• Equipment: ${((totalEquipmentCost / totalCost) * 100).toFixed(1)}%\n`;
    message += `• Materials: ${((totalMaterialCost / totalCost) * 100).toFixed(1)}%\n`;
    message += `• Overhead: ${((totalOverheadCost / totalCost) * 100).toFixed(1)}%\n`;
    message += `• Maintenance: ${((totalMaintenanceCost / totalCost) * 100).toFixed(1)}%`;

    // Generate optimization suggestions based on cost distribution
    if (totalPersonnelCost / totalCost > 0.4) {
      suggestions.push('Consider automation to reduce personnel costs');
      suggestions.push('Review staffing levels and productivity metrics');
      suggestions.push('Implement training programs to improve efficiency');
    }

    if (totalEquipmentCost / totalCost > 0.3) {
      suggestions.push('Optimize equipment utilization rates');
      suggestions.push('Consider equipment sharing between cost centers');
      suggestions.push('Review equipment maintenance schedules');
    }

    if (totalMaterialCost / totalCost > 0.25) {
      suggestions.push('Negotiate better supplier contracts');
      suggestions.push('Implement inventory management systems');
      suggestions.push('Consider bulk purchasing for common materials');
    }

    if (totalOverheadCost / totalCost > 0.2) {
      suggestions.push('Streamline administrative processes');
      suggestions.push('Review overhead allocation methods');
      suggestions.push('Consider shared services for common functions');
    }

    if (totalMaintenanceCost / totalCost > 0.15) {
      suggestions.push('Implement preventive maintenance programs');
      suggestions.push('Review maintenance contracts and service levels');
      suggestions.push('Consider predictive maintenance technologies');
    }

    // Add general optimization suggestions
    suggestions.push('Implement cost tracking dashboards for real-time monitoring');
    suggestions.push('Set up automated alerts for cost overruns');
    suggestions.push('Regular cost-benefit analysis for major expenditures');

    return {
      id: `ai-${Date.now()}`,
      type: this.RESPONSE_TYPES.COST_OPTIMIZATION,
      title,
      message,
      suggestions,
      confidence_score: confidenceScore,
      created_at: new Date().toISOString()
    };
  }

  // ===== PROJECT ANALYSIS =====
  
  private static async generateProjectAnalysis(context: AOPAIContext): Promise<AOPAIResponse> {
    const projects = await AOPDataService.getProjects();
    const projectMetrics = await AOPDataService.getProjectMetrics();

    let title = 'Project Performance Analysis';
    let message = '';
    let suggestions: string[] = [];
    let confidenceScore = 0.8;

    if (context.project_id) {
      const project = projects.find(p => p.id === context.project_id);
      const metric = projectMetrics.find(m => m.project_id === context.project_id);

      if (project && metric) {
        title = `Project Analysis: ${project.name}`;
        
        message = `📈 **Project Performance**:\n`;
        message += `• Budget: ${metric.total_budget.toLocaleString()}\n`;
        message += `• Actual: ${metric.total_actual.toLocaleString()}\n`;
        message += `• Variance: ${metric.variance_percentage.toFixed(1)}%\n`;
        message += `• Revenue: ${metric.revenue.toLocaleString()}\n`;
        message += `• Profit: ${metric.profit.toLocaleString()}\n`;
        message += `• ROI: ${metric.roi_percentage.toFixed(1)}%\n`;
        message += `• Completion: ${metric.completion_percentage.toFixed(1)}%\n`;
        message += `• Days Remaining: ${metric.days_remaining}`;

        if (metric.variance_percentage > 10) {
          suggestions.push('Review project scope and timeline');
          suggestions.push('Identify cost overrun root causes');
          suggestions.push('Consider scope reduction or additional funding');
        }

        if (metric.completion_percentage < 50 && metric.days_remaining < 30) {
          suggestions.push('Accelerate project execution');
          suggestions.push('Reallocate resources to critical path activities');
          suggestions.push('Consider extending project timeline');
        }

        if (metric.roi_percentage < 0) {
          suggestions.push('Review project viability and business case');
          suggestions.push('Consider project termination if losses continue');
          suggestions.push('Implement corrective actions to improve profitability');
        }
      }
    } else {
      // Overall project analysis
      const activeProjects = projectMetrics.filter(m => m.completion_percentage < 100);
      const profitableProjects = projectMetrics.filter(m => m.profit > 0);
      const overBudgetProjects = projectMetrics.filter(m => m.variance_percentage > 10);

      message = `📊 **Overall Project Portfolio**:\n`;
      message += `• Active Projects: ${activeProjects.length}\n`;
      message += `• Profitable Projects: ${profitableProjects.length}\n`;
      message += `• Over Budget Projects: ${overBudgetProjects.length}\n`;
      message += `• Average ROI: ${(projectMetrics.reduce((sum, m) => sum + m.roi_percentage, 0) / projectMetrics.length).toFixed(1)}%`;

      suggestions = [
        'Focus resources on high-ROI projects',
        'Implement project portfolio management',
        'Regular project health checks and reviews',
        'Standardize project management processes'
      ];
    }

    return {
      id: `ai-${Date.now()}`,
      type: this.RESPONSE_TYPES.PROJECT_ANALYSIS,
      title,
      message,
      suggestions,
      confidence_score: confidenceScore,
      created_at: new Date().toISOString()
    };
  }

  // ===== FINANCIAL INSIGHTS =====
  
  private static async generateFinancialInsights(context: AOPAIContext): Promise<AOPAIResponse> {
    const metrics = await AOPDataService.getFinancialMetrics();
    const dashboardData = await AOPDataService.getAOPDashboardData();

    const title = 'Financial Performance Insights';
    let message = '';
    let suggestions: string[] = [];
    let confidenceScore = 0.85;

    message = `📊 **Financial Overview**:\n`;
    message += `• Total Budget: ${dashboardData.total_budget.toLocaleString()}\n`;
    message += `• Total Actual: ${dashboardData.total_actual.toLocaleString()}\n`;
    message += `• Total Variance: ${dashboardData.total_variance.toLocaleString()}\n`;
    message += `• Budget Utilization: ${dashboardData.budget_utilization.toFixed(1)}%\n`;
    message += `• Overall Profit Margin: ${dashboardData.overall_profit_margin.toFixed(1)}%`;

    // Identify top and bottom performers
    const sortedMetrics = [...metrics].sort((a, b) => b.profit_margin - a.profit_margin);
    const topPerformer = sortedMetrics[0];
    const bottomPerformer = sortedMetrics[sortedMetrics.length - 1];

    if (topPerformer && bottomPerformer) {
      message += `\n\n🏆 **Top Performer**: ${topPerformer.cost_center_name} (${topPerformer.profit_margin.toFixed(1)}% margin)`;
      message += `\n⚠️ **Needs Attention**: ${bottomPerformer.cost_center_name} (${bottomPerformer.profit_margin.toFixed(1)}% margin)`;
    }

    suggestions = [
      'Analyze best practices from top-performing cost centers',
      'Develop improvement plans for underperforming areas',
      'Implement benchmarking against industry standards',
      'Regular financial performance reviews and reporting'
    ];

    if (dashboardData.budget_utilization > 90) {
      suggestions.push('Consider budget increases for high-utilization areas');
    }

    if (dashboardData.overall_profit_margin < 10) {
      suggestions.push('Focus on revenue generation and cost reduction strategies');
    }

    return {
      id: `ai-${Date.now()}`,
      type: this.RESPONSE_TYPES.FINANCIAL_INSIGHTS,
      title,
      message,
      suggestions,
      confidence_score: confidenceScore,
      created_at: new Date().toISOString()
    };
  }

  // ===== FORECASTING =====
  
  private static async generateForecasting(context: AOPAIContext): Promise<AOPAIResponse> {
    const metrics = await AOPDataService.getFinancialMetrics();
    const projectMetrics = await AOPDataService.getProjectMetrics();

    const title = 'Financial Forecasting';
    let message = '';
    let suggestions: string[] = [];
    let confidenceScore = 0.75;

    // Simple trend-based forecasting
    const avgVariance = metrics.reduce((sum, m) => sum + m.variance_percentage, 0) / metrics.length;
    const avgProfitMargin = projectMetrics.reduce((sum, m) => sum + m.profit_margin, 0) / projectMetrics.length;

    message = `🔮 **Forecast Analysis**:\n`;
    message += `• Current average variance: ${avgVariance.toFixed(1)}%\n`;
    message += `• Current average profit margin: ${avgProfitMargin.toFixed(1)}%\n`;
    message += `• Trend: ${avgVariance > 0 ? 'Costs trending above budget' : 'Costs trending below budget'}\n`;
    message += `• Profitability: ${avgProfitMargin > 15 ? 'Strong' : avgProfitMargin > 5 ? 'Moderate' : 'Needs improvement'}`;

    // Generate forecasting suggestions
    if (avgVariance > 5) {
      suggestions.push('Adjust future budgets upward to reflect actual spending patterns');
      suggestions.push('Implement cost control measures to reduce variance');
    } else if (avgVariance < -5) {
      suggestions.push('Consider reducing future budgets if under-spending continues');
      suggestions.push('Review if budget targets are too conservative');
    }

    if (avgProfitMargin < 10) {
      suggestions.push('Focus on revenue optimization strategies');
      suggestions.push('Review pricing strategies and market positioning');
    }

    suggestions.push('Implement rolling forecasts for better accuracy');
    suggestions.push('Use historical data for trend analysis');
    suggestions.push('Regular forecast updates based on actual performance');

    return {
      id: `ai-${Date.now()}`,
      type: this.RESPONSE_TYPES.FORECASTING,
      title,
      message,
      suggestions,
      confidence_score: confidenceScore,
      created_at: new Date().toISOString()
    };
  }

  // ===== GENERAL HELP =====
  
  private static async generateGeneralHelp(context: AOPAIContext): Promise<AOPAIResponse> {
    const title = 'AOP Assistant Help';
    const message = `🤖 **I'm your AOP (Annual Operating Plan) AI Assistant!**\n\n`;
    const message2 = `I can help you with:\n`;
    const message3 = `• **Budget Management**: Track spending, analyze variances, and optimize allocations\n`;
    const message4 = `• **Cost Optimization**: Identify savings opportunities and efficiency improvements\n`;
    const message5 = `• **Project Analysis**: Evaluate ROI, performance, and completion status\n`;
    const message6 = `• **Financial Insights**: Monitor profitability, margins, and overall performance\n`;
    const message7 = `• **Forecasting**: Predict future trends and plan accordingly\n\n`;
    const message8 = `**Try asking me questions like:**\n`;
    const message9 = `• "How is my budget performing?"\n`;
    const message10 = `• "What cost optimization opportunities do you see?"\n`;
    const message11 = `• "Analyze project ROI for me"\n`;
    const message12 = `• "What are the financial trends?"\n`;
    const message13 = `• "Forecast next quarter's performance"`;

    const suggestions = [
      'Ask specific questions about your cost centers or projects',
      'Request budget variance analysis',
      'Get cost optimization recommendations',
      'Analyze project performance and ROI',
      'Review financial metrics and trends'
    ];

    return {
      id: `ai-${Date.now()}`,
      type: this.RESPONSE_TYPES.GENERAL_HELP,
      title,
      message: message + message2 + message3 + message4 + message5 + message6 + message7 + message8 + message9 + message10 + message11 + message12 + message13,
      suggestions,
      confidence_score: 0.9,
      created_at: new Date().toISOString()
    };
  }

  // ===== UTILITY METHODS =====
  
  static async getQuickInsights(): Promise<string[]> {
    const metrics = await AOPDataService.getFinancialMetrics();
    const projectMetrics = await AOPDataService.getProjectMetrics();
    const alerts = await AOPDataService.getAlerts();

    const insights: string[] = [];

    // Budget insights
    const overBudgetCenters = metrics.filter(m => m.variance_percentage > 10);
    if (overBudgetCenters.length > 0) {
      insights.push(`⚠️ ${overBudgetCenters.length} cost centers are over budget`);
    }

    // Project insights
    const lowROIProjects = projectMetrics.filter(m => m.roi_percentage < 5);
    if (lowROIProjects.length > 0) {
      insights.push(`📉 ${lowROIProjects.length} projects have low ROI (< 5%)`);
    }

    // Alert insights
    const unreadAlerts = alerts.filter(a => !a.is_read);
    if (unreadAlerts.length > 0) {
      insights.push(`🔔 ${unreadAlerts.length} unread alerts require attention`);
    }

    return insights;
  }
} 