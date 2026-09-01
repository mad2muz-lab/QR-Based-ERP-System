export interface AppError {
  id: string;
  message: string;
  code?: string;
  timestamp: Date;
  context?: Record<string, any>;
  stack?: string;
}

export class ErrorHandler {
  private static errors: AppError[] = [];
  private static maxErrors = 100;

  static logError(
    message: string, 
    error?: Error | unknown, 
    context?: Record<string, any>
  ): AppError {
    const appError: AppError = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      timestamp: new Date(),
      context,
      code: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined
    };

    this.errors.push(appError);
    
    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application Error:', appError);
    }

    // Store in localStorage for persistence
    this.persistErrors();

    return appError;
  }

  static getErrors(): AppError[] {
    return [...this.errors];
  }

  static clearErrors(): void {
    this.errors = [];
    this.persistErrors();
  }

  static getRecentErrors(count: number = 10): AppError[] {
    return this.errors.slice(-count);
  }

  private static persistErrors(): void {
    try {
      localStorage.setItem('qr_system_errors', JSON.stringify(this.errors));
    } catch (error) {
      console.warn('Failed to persist errors:', error);
    }
  }

  static loadPersistedErrors(): void {
    try {
      const stored = localStorage.getItem('qr_system_errors');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.errors = parsed.map((error: any) => ({
          ...error,
          timestamp: new Date(error.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load persisted errors:', error);
    }
  }

  // Error categorization
  static isNetworkError(error: AppError): boolean {
    return error.message.includes('Network') || 
           error.message.includes('fetch') || 
           error.message.includes('connection');
  }

  static isAuthError(error: AppError): boolean {
    return error.message.includes('auth') || 
           error.message.includes('login') || 
           error.message.includes('permission');
  }

  static isSyncError(error: AppError): boolean {
    return error.message.includes('sync') || 
           error.message.includes('queue') || 
           error.message.includes('offline');
  }
}

// Initialize error handler
ErrorHandler.loadPersistedErrors(); 