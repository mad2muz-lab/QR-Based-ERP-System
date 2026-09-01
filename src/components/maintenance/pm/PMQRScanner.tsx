import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, X, AlertTriangle } from 'lucide-react';

interface PMQRScannerProps {
  onScan: (data: string) => void;
  onClose?: () => void;
}

const PMQRScanner: React.FC<PMQRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        result => {
          onScan(result.data);
          stopScanning();
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      startScanning();
    }

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    setCameraError(null);
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setCameraError('The camera stream is only accessible if the page is transferred via HTTPS or running on localhost.');
      return;
    }

    try {
      await qrScannerRef.current?.start();
      setIsScanning(true);
    } catch (err: any) {
      console.error('QR scan error:', err);
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please grant camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found. Please ensure a camera is connected and enabled.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is already in use or not accessible. Please close other applications using the camera.');
      } else {
        setCameraError(`Failed to start camera: ${err.message || 'Unknown error'}`);
      }
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    qrScannerRef.current?.stop();
    qrScannerRef.current?.destroy();
    setIsScanning(false);
  };

  return (
    <div className="relative p-6 bg-white rounded-lg shadow-md text-center">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Scan Equipment QR Code</h2>
      <p className="text-gray-600 mb-4">Point your camera at the equipment's QR code to begin PM.</p>

      {cameraError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {cameraError}
          </p>
        </div>
      )}

      <div className="relative w-full max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
        <video ref={videoRef} className="w-full h-auto object-cover"></video>
        {!isScanning && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-75">
            <button
              onClick={startScanning}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Camera className="w-5 h-5 mr-2" />
              Start Camera
            </button>
          </div>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <X className="inline-block w-4 h-4 mr-2" />
          Close Scanner
        </button>
      )}
    </div>
  );
};

export default PMQRScanner; 