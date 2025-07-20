import { PreventiveMaintenanceService } from './preventiveMaintenanceService';

/**
 * Auto-start the preventive maintenance service
 * This should be called when the application initializes
 */
export const startPreventiveMaintenanceService = () => {
  try {
    const service = PreventiveMaintenanceService.getInstance();
    
    // Start automatic checking every 30 minutes (1800000 ms)
    service.startAutoCheck(30);
    
    console.log('✅ Preventive maintenance service started automatically');
    
    // Listen for maintenance notifications
    window.addEventListener('maintenanceNotification', (event: any) => {
      const { title, message, schedules } = event.detail;
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          tag: 'maintenance-notification'
        });
      }
      
      // Log to console for debugging
      console.log('🔔 Maintenance Notification:', { title, message, schedules });
    });
    
    // Listen for schedule generation events
    window.addEventListener('preventiveMaintenanceSchedulesGenerated', (event: any) => {
      const { schedules } = event.detail;
      console.log('📋 New maintenance schedules generated:', schedules);
    });
    
  } catch (error) {
    console.error('❌ Failed to start preventive maintenance service:', error);
  }
};

/**
 * Stop the preventive maintenance service
 * This should be called when the application is shutting down
 */
export const stopPreventiveMaintenanceService = () => {
  try {
    const service = PreventiveMaintenanceService.getInstance();
    service.stopAutoCheck();
    console.log('⏹️ Preventive maintenance service stopped');
  } catch (error) {
    console.error('❌ Failed to stop preventive maintenance service:', error);
  }
};

/**
 * Request notification permission for maintenance alerts
 */
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Notification permission granted for maintenance alerts');
      } else {
        console.log('❌ Notification permission denied for maintenance alerts');
      }
    } else if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
    } else {
      console.log('❌ Notification permission denied');
    }
  } else {
    console.log('⚠️ Notifications not supported in this browser');
  }
}; 