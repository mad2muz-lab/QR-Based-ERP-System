export class AOPDataService {
  private static instance: AOPDataService;
  private data: Record<string, any> = {};

  private constructor() {}

  static getInstance(): AOPDataService {
    if (!AOPDataService.instance) {
      AOPDataService.instance = new AOPDataService();
    }
    return AOPDataService.instance;
  }

  static initializeSampleData() {
    const instance = AOPDataService.getInstance();
    instance.loadSampleData();
  }

  private loadSampleData() {
    this.data = {
      projects: [],
      budgets: [],
      costCenters: [],
      departments: [],
      activities: [],
      markups: [],
      alerts: [],
    };
  }

  getProjects() {
    return this.data.projects || [];
  }

  getBudgets() {
    return this.data.budgets || [];
  }

  getCostCenters() {
    return this.data.costCenters || [];
  }

  getDepartments() {
    return this.data.departments || [];
  }

  getActivities() {
    return this.data.activities || [];
  }

  getMarkups() {
    return this.data.markups || [];
  }

  getAlerts() {
    return this.data.alerts || [];
  }
}
