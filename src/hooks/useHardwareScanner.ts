import { useEffect, RefObject } from 'react';

interface UseHardwareScannerProps {
  onScan: (data: string) => void;
  inputRef: RefObject<HTMLInputElement>;
  enabled?: boolean;
  timeout?: number;
  prefix?: string;
}

/**
 * Hook to handle hardware barcode/QR scanners that emulate keyboard input
 * Works with devices like the Honeywell EDA-52-1 and similar scanners
 */
export const useHardwareScanner = ({
  onScan,
  inputRef,
  enabled = true,
  timeout = 20, // ms between keystrokes
  prefix = ''
}: UseHardwareScannerProps) => {
  useEffect(() => {
    if (!enabled) return;
    
    let scanBuffer = '';
    let lastKeyTime = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if we're in an input field that's not our scanner input
      if (
        document.activeElement &&
        document.activeElement.tagName === 'INPUT' &&
        document.activeElement !== inputRef.current
      ) {
        return;
      }
      
      // Debug logging for Honeywell device
      if (e.key !== 'Enter' && e.key.length === 1) {
        console.log('🔍 Hardware Scanner: Key pressed:', e.key, 'Buffer length:', scanBuffer.length);
      }
      
      const currentTime = new Date().getTime();
      
      // If there's a significant delay between keystrokes, reset the buffer
      if (currentTime - lastKeyTime > 500) {
        scanBuffer = '';
      }
      
      lastKeyTime = currentTime;
      
      // Handle Enter key as the end of scan
      if (e.key === 'Enter') {
        if (scanBuffer.length > 0) {
          console.log('🔍 Hardware Scanner: Complete scan detected:', scanBuffer);
          console.log('🔍 Hardware Scanner: Scan buffer length:', scanBuffer.length);
          console.log('🔍 Hardware Scanner: Scan buffer characters:', Array.from(scanBuffer).map(c => `"${c}"(${c.charCodeAt(0)})`).join(' '));
          
          // Clean the scan buffer for potential Honeywell device issues
          let cleanedBuffer = scanBuffer;
          
          // Remove any line breaks or carriage returns
          if (cleanedBuffer.includes('\r') || cleanedBuffer.includes('\n')) {
            console.warn('⚠️ Hardware Scanner: Scan contains line breaks, cleaning...');
            cleanedBuffer = cleanedBuffer.replace(/[\r\n]/g, '');
          }
          
          // Trim whitespace
          const trimmedBuffer = cleanedBuffer.trim();
          if (trimmedBuffer !== cleanedBuffer) {
            console.warn('⚠️ Hardware Scanner: Scan had whitespace, trimming...');
            cleanedBuffer = trimmedBuffer;
          }
          
          console.log('🔍 Hardware Scanner: Cleaned scan buffer:', cleanedBuffer);
          
          // If the scan has our expected prefix, process it
          if (!prefix || cleanedBuffer.startsWith(prefix)) {
            console.log('✅ Hardware Scanner: Processing scan:', cleanedBuffer);
            onScan(cleanedBuffer);
          } else {
            console.log('❌ Hardware Scanner: Scan does not match prefix:', cleanedBuffer, 'Expected prefix:', prefix);
          }
          scanBuffer = '';
        }
        return;
      }
      
      // Add the key to our buffer
      scanBuffer += e.key;
      
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Set a timeout to process the scan if no more keys are pressed
      timeoutId = setTimeout(() => {
        if (scanBuffer.length > 3) { // Minimum length to be considered a scan
          console.log('🔍 Hardware Scanner: Timeout-based scan completion:', scanBuffer);
          
          // Clean the scan buffer
          let cleanedBuffer = scanBuffer;
          if (cleanedBuffer.includes('\r') || cleanedBuffer.includes('\n')) {
            cleanedBuffer = cleanedBuffer.replace(/[\r\n]/g, '');
          }
          cleanedBuffer = cleanedBuffer.trim();
          
          // If the scan has our expected prefix, process it
          if (!prefix || cleanedBuffer.startsWith(prefix)) {
            console.log('✅ Hardware Scanner: Processing timeout scan:', cleanedBuffer);
            onScan(cleanedBuffer);
          } else {
            console.log('❌ Hardware Scanner: Timeout scan does not match prefix:', cleanedBuffer, 'Expected prefix:', prefix);
          }
          scanBuffer = '';
        }
      }, timeout);
    };
    
    // Focus the input when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Add event listener for keyboard input
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [onScan, inputRef, enabled, timeout, prefix]);
};