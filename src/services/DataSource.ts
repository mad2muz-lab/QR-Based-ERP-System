export type DataSourceType = 'supabase' | 'localstorage';

class DataSourceService {
  private static readonly STORAGE_KEY = 'selectedDataSource';
  private static readonly DEFAULT_SOURCE: DataSourceType = 'supabase';

  static get(): DataSourceType {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return (stored === 'supabase' || stored === 'localstorage') ? stored : this.DEFAULT_SOURCE;
  }

  static set(source: DataSourceType): void {
    localStorage.setItem(this.STORAGE_KEY, source);
  }

  static init(): void {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      this.set(this.DEFAULT_SOURCE);
    }
  }
}

export default DataSourceService;