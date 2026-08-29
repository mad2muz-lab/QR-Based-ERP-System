import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, AlertCircle, CheckCircle } from 'lucide-react';

interface QRScannerModalProps {
  onClose: () => void;
  onScanned: (qrCode: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ onClose, onScanned }) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      setError('Could not access camera. Please use manual entry below.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      setSuccess('QR code scanned successfully!');
      setTimeout(() => {
        onScanned(manualCode.trim());
      }, 500);
    }
  };

  const handleSimulateScan = () => {
    // Simulate a QR code scan (in real app, would use qr-scanner library)
    const sampleCodes = ['RYD-01-0001', 'JED-01-0007', 'DMM-01-0009', 'ABH-01-0010'];
    const randomCode = sampleCodes[Math.floor(Math.random() * sampleCodes.length)];
    setSuccess(`Scanned: ${randomCode}`);
    setTimeout(() => {
      onScanned(randomCode);
    }, 800);
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Scan QR Code</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          )}

          {/* Camera View */}
          <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Camera not available</p>
                </div>
              </div>
            )}
            
            {/* Scan Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto w-48 h-48 border-2 border-white border-dashed rounded-lg"></div>
              <div className="absolute top-4 left-4 right-4 text-center text-white text-sm bg-black bg-opacity-50 rounded px-3 py-1.5">
                Align QR code within the frame
              </div>
            </div>
          </div>

          {/* Simulate Button */}
          <button
            onClick={handleSimulateScan}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Simulate QR Scan
          </button>

          {/* Manual Entry */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-slate-500">OR ENTER MANUALLY</span>
            </div>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-2">
            <input
              type="text"
              placeholder="Enter SKU or QR code (e.g., RYD-01-0001)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                manualCode.trim()
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Submit Code
            </button>
          </form>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">Tip:</span> Try scanning codes like <span className="font-mono">RYD-01-0001</span>, <span className="font-mono">JED-01-0007</span>, or <span className="font-mono">DMM-01-0009</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
