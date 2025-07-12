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
      
      const currentTime = new Date().getTime();
      
      // If there's a significant delay between keystrokes, reset the buffer
      if (currentTime - lastKeyTime > 500) {
        scanBuffer = '';
      }
      
      lastKeyTime = currentTime;
      
      // Handle Enter key as the end of scan
      if (e.key === 'Enter') {
        if (scanBuffer.length > 0) {
          // If the scan has our expected prefix, process it
          if (!prefix || scanBuffer.startsWith(prefix)) {
            onScan(scanBuffer);
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
          // If the scan has our expected prefix, process it
          if (!prefix || scanBuffer.startsWith(prefix)) {
            onScan(scanBuffer);
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