// Executor QR Scanner Component
// For scanning executor ID cards to assign them to executions

import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Camera, X, CheckCircle, AlertTriangle, User, Play, Square } from 'lucide-react';
import { assignExecutorByQR } from '../../utils/resourceMovementDataService';
import QrScanner from 'qr-scanner';

interface ExecutorQRScannerProps {
  executionId: string;
  executionType: string;
  onSuccess: (executor: any) => void;
  onCancel: () => void;
}

const ExecutorQRScanner: React.FC<ExecutorQRScannerProps> = ({
  executionId,
  executionType,
  onSuccess,
  onCancel
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // Remove auto-start scanning - let user choose when to start
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setError(null);
      setCameraPermission('prompt');
      
      // First check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No camera found on this device');
      }
      
      if (videoRef.current) {
        // Initialize QR Scanner with better error handling
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('QR Code detected:', result);
            handleQRCodeDetected(result.data);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5
          }
        );
        
        // Start the scanner
        await qrScannerRef.current.start();
        setCameraPermission('granted');
        setIsScanning(true);
        
        // Add a timeout to check if video is actually playing
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState < 2) {
            setError('Camera failed to start. Please check permissions and try again.');
            setCameraPermission('denied');
            setIsScanning(false);
            stopScanning();
          }
        }, 3000);
      }
    } catch (err) {
      console.error('Error starting QR scanner:', err);
      let errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        }
      }
      
      setError(errorMessage);
      setCameraPermission('denied');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleQRCodeDetected = async (qrData: string) => {
    if (isProcessing || scanResult) return;
    
    console.log('Processing QR data:', qrData);
    setScanResult(qrData);
    setIsProcessing(true);
    setError(null);

    try {
      const result = await assignExecutorByQR(executionId, qrData);
      console.log('Assignment result:', result);
      
      if (result.success && result.executor) {
        setSuccess(result.executor);
        stopScanning();
        // Auto-close after 2 seconds
        setTimeout(() => {
          onSuccess(result.executor);
        }, 2000);
      } else {
        setError(result.error || 'Failed to assign executor');
        setScanResult(null);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Error processing QR code:', err);
      setError('Error processing QR code');
      setScanResult(null);
      setIsProcessing(false);
    }
  };



  // Request camera permission manually
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission
      setCameraPermission('granted');
      setError(null);
      startScanning();
    } catch (err) {
      console.error('Camera permission request failed:', err);
      setCameraPermission('denied');
      setError('Camera permission denied. Please allow camera access in your browser settings.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <QrCode className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Scan Executor ID
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Execution Info */}
        <div className="bg-blue-50 p-3 rounded-md mb-4">
          <p className="text-sm text-blue-800">
            <strong>Execution:</strong> {executionId}<br/>
            <strong>Type:</strong> {executionType}
          </p>
        </div>

        {/* Scanner Area */}
        <div className="relative">
          {/* Initial State - Not Scanning */}
          {!isScanning && !scanResult && !success && !isProcessing && (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-700 mb-2">
                  Ready to Scan
                </h4>
                <p className="text-gray-600 mb-4">
                  Click "Start Scanning" to begin scanning the executor's ID card
                </p>
                <div className="space-y-2">
                  <button
                    onClick={startScanning}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 mx-auto"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Start Scanning</span>
                  </button>
                  {cameraPermission === 'denied' && (
                    <button
                      onClick={requestCameraPermission}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
                    >
                      Grant Camera Permission
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Scanning */}
          {isScanning && !scanResult && !success && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-900 rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-blue-500 w-48 h-48 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 right-2 text-center">
                <p className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                  Position executor ID card within the frame
                </p>
              </div>
                              <button
                  onClick={stopScanning}
                  className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-1"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </button>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing executor assignment...</p>
                {scanResult && (
                  <p className="text-xs text-gray-500 mt-2">Scanned: {scanResult.substring(0, 50)}...</p>
                )}
              </div>
            </div>
          )}

          {/* Success State */}
          {success && (
            <div className="w-full h-64 bg-green-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-green-800 mb-2">
                  Executor Assigned Successfully!
                </h4>
                <div className="bg-white p-3 rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">{success.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">{success.role}</p>
                  <p className="text-sm text-gray-600">{success.department}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="w-full h-64 bg-red-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-red-800 mb-2">
                  Assignment Failed
                </h4>
                <p className="text-red-600 mb-4">{error}</p>
                {scanResult && (
                  <p className="text-xs text-gray-500 mb-4">Scanned: {scanResult.substring(0, 50)}...</p>
                )}
                <button
                  onClick={() => {
                    setError(null);
                    setScanResult(null);
                    setIsProcessing(false);
                    startScanning();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-4">
          {!success && !isProcessing && !isScanning && (
            <>
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          )}
          

        </div>

        {/* Instructions */}
        <div className="mt-4 text-sm text-gray-600">
          <p className="mb-2"><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Click "Start Scanning" to activate the camera</li>
            <li>Point camera at executor's ID card QR code</li>
            <li>Hold steady until code is detected</li>
            <li>System will automatically assign the executor</li>
          </ul>
        </div>

        {/* Debug Info */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <p><strong>Debug Info:</strong></p>
            <p>Execution ID: {executionId}</p>
            <p>Scanning: {isScanning ? 'Yes' : 'No'}</p>
            <p>Processing: {isProcessing ? 'Yes' : 'No'}</p>
            <p>Camera Permission: {cameraPermission}</p>
            {scanResult && <p>Last Scan: {scanResult.substring(0, 30)}...</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutorQRScanner; 