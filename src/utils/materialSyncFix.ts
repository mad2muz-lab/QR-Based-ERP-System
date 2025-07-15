/**
 * Material Sync Fix - Ensures material updates sync to Supabase
 * This module fixes the issue where material IN/OUT operations update material_logs but not materials table
 */

import { AuthManager } from './authUtils';
import { offlineSyncManager } from './offlineSync';
import { DataStorage } from './dataStorage';
import { Material } from '../types';

export class MaterialSyncFix {
  private static isInitialized = false;
  
  /**
   * Initialize the material sync fix
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🔧 Initializing Material Sync Fix...');
    
    try {
      // Force Supabase mode if not already enabled
      await this.ensureSupabaseMode();
      
      // Verify sync manager is working
      await this.verifySyncManager();
      
      // Set up material update interceptor
      this.setupMaterialUpdateInterceptor();
      
      this.isInitialized = true;
      console.log('✅ Material Sync Fix initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Material Sync Fix:', error);
      throw error;
    }
  }
  
  /**
   * Ensure the system is in Supabase mode
   */
  private static async ensureSupabaseMode(): Promise<void> {
    console.log('🔍 Checking Supabase mode...');
    
    const isSupabaseMode = AuthManager.useSupabase();
    if (!isSupabaseMode) {
      console.log('🔄 Enabling Supabase mode...');
      AuthManager.setUseSupabase(true);
      
      // Verify the change
      const newMode = AuthManager.useSupabase();
      if (newMode) {
        console.log('✅ Supabase mode enabled');
      } else {
        throw new Error('Failed to enable Supabase mode');
      }
    } else {
      console.log('✅ Already in Supabase mode');
    }
    
    // Check authentication
    const currentUser = AuthManager.getCurrentUserSync();
    if (!currentUser) {
      console.warn('⚠️ No authenticated user found. Material sync may not work properly.');
    } else {
      console.log(`✅ Authenticated user: ${currentUser.username || currentUser.email}`);
    }
  }
  
  /**
   * Verify the sync manager is working
   */
  private static async verifySyncManager(): Promise<void> {
    console.log('🔍 Verifying sync manager...');
    
    const status = offlineSyncManager.getStatus();
    console.log(`Sync status - Online: ${status.isOnline}, Pending: ${status.pendingOperations}`);
    
    if (!status.isOnline) {
      console.warn('⚠️ Sync manager is offline. Material updates will be queued but not synced immediately.');
    }
    
    if (status.errors && status.errors.length > 0) {
      console.warn(`⚠️ Found ${status.errors.length} sync errors:`);
      status.errors.forEach((error, index) => {
        console.warn(`  ${index + 1}. ${error.error} (${error.operation.entityType})`);
      });
    }
  }
  
  /**
   * Set up material update interceptor to ensure sync
   */
  private static setupMaterialUpdateInterceptor(): void {
    console.log('🔧 Setting up material update interceptor...');
    
    // Listen for material updates
    window.addEventListener('materialUpdated', async (event: any) => {
      const { material, action } = event.detail;
      
      if (action === 'update') {
        console.log(`📦 Material updated: ${material.name} (ID: ${material.id})`);
        
        // Force sync if there are pending operations
        setTimeout(async () => {
          const status = offlineSyncManager.getStatus();
          if (status.pendingOperations > 0 && status.isOnline) {
            console.log('🔄 Forcing sync for material update...');
            try {
              await offlineSyncManager.forcSync();
              console.log('✅ Material sync completed');
            } catch (error) {
              console.error('❌ Material sync failed:', error);
            }
          }
        }, 1000);
      }
    });
    
    console.log('✅ Material update interceptor set up');
  }
  
  /**
   * Test material sync by performing a test operation
   */
  static async testMaterialSync(): Promise<boolean> {
    console.log('🧪 Testing material sync...');
    
    try {
      // Get a test material
      const materials = DataStorage.loadMaterials();
      if (materials.length === 0) {
        console.error('❌ No materials found for testing');
        return false;
      }
      
      const testMaterial = materials[0];
      const originalQuantity = testMaterial.quantity;
      
      console.log(`Testing with material: ${testMaterial.name} (Quantity: ${originalQuantity})`);
      
      // Record initial sync queue
      const initialStatus = offlineSyncManager.getStatus();
      const initialPending = initialStatus.pendingOperations;
      
      // Update material quantity
      const updatedMaterial: Material = {
        ...testMaterial,
        quantity: originalQuantity + 1,
        lastUpdated: new Date().toISOString()
      };
      
      // Import and use OfflineDataManager
      const { OfflineDataManager } = await import('./offlineDataManager');
      const operationId = await OfflineDataManager.updateMaterial(updatedMaterial);
      
      console.log(`✅ Material update queued with operation ID: ${operationId}`);
      
      // Check if operation was queued
      const newStatus = offlineSyncManager.getStatus();
      const newPending = newStatus.pendingOperations;
      
      if (newPending > initialPending) {
        console.log(`✅ Operation queued successfully (+${newPending - initialPending} operations)`);
        
        // Force sync if online
        if (newStatus.isOnline) {
          console.log('🔄 Forcing sync...');
          await offlineSyncManager.forcSync();
          
          // Check final status
          const finalStatus = offlineSyncManager.getStatus();
          if (finalStatus.pendingOperations < newPending) {
            console.log('✅ Material sync test completed successfully!');
            return true;
          } else {
            console.error('❌ Sync did not complete');
            return false;
          }
        } else {
          console.log('✅ Operation queued (will sync when online)');
          return true;
        }
      } else {
        console.error('❌ Operation was not queued properly');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Material sync test failed:', error);
      return false;
    }
  }
  
  /**
   * Force sync all pending material operations
   */
  static async forceSyncMaterials(): Promise<void> {
    console.log('🔄 Forcing sync of all pending material operations...');
    
    try {
      const status = offlineSyncManager.getStatus();
      
      if (!status.isOnline) {
        throw new Error('Cannot sync - system is offline');
      }
      
      if (status.pendingOperations === 0) {
        console.log('ℹ️ No pending operations to sync');
        return;
      }
      
      console.log(`Syncing ${status.pendingOperations} pending operations...`);
      await offlineSyncManager.forcSync();
      
      const finalStatus = offlineSyncManager.getStatus();
      const syncedOps = status.pendingOperations - finalStatus.pendingOperations;
      
      console.log(`✅ Successfully synced ${syncedOps} operations`);
      
      if (finalStatus.errors && finalStatus.errors.length > 0) {
        console.warn(`⚠️ ${finalStatus.errors.length} sync errors occurred:`);
        finalStatus.errors.forEach((error, index) => {
          console.warn(`  ${index + 1}. ${error.error}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Force sync failed:', error);
      throw error;
    }
  }
  
  /**
   * Get current sync status
   */
  static getSyncStatus(): any {
    return offlineSyncManager.getStatus();
  }
  
  /**
   * Clear all sync errors
   */
  static clearSyncErrors(): void {
    console.log('🧹 Clearing sync errors...');
    offlineSyncManager.clearErrors();
    console.log('✅ Sync errors cleared');
  }
}

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  // Wait for the app to be ready
  const initWhenReady = () => {
    if (document.readyState === 'complete') {
      setTimeout(() => {
        MaterialSyncFix.initialize().catch(console.error);
      }, 2000);
    } else {
      setTimeout(initWhenReady, 500);
    }
  };
  
  initWhenReady();
  
  // Make available globally for debugging
  (window as any).MaterialSyncFix = MaterialSyncFix;
}

export default MaterialSyncFix;