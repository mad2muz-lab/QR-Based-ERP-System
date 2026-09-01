import React, { useState, useRef, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, Camera, Upload, QrCode, CreditCard, LogIn } from 'lucide-react';
import { AuthManager } from '../../utils/authUtils';
import { User as UserTypes } from '../../types';
import QrScanner from 'qr-scanner';

type LoginTab = 'username' | 'employeeId' | 'qrCode';

interface LoginFormProps {
  onLogin: (user: UserTypes) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<LoginTab>('username');
  
  // Username + Password state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Employee ID + PIN state
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  
  // QR Code state
  const [isScanning, setIsScanning] = useState(false);
  const [qrMessage, setQrMessage] = useState('');
  
  // Common state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for QR scanner
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);
  
  // Stop scanning when switching tabs
  useEffect(() => {
    if (activeTab !== 'qrCode' && qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
      setIsScanning(false);
    }
  }, [activeTab]);
  
  // Username + Password login
  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await AuthManager.login(username, password);
      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err: unknown) {
      let message = 'An unexpected error occurred';
      if (err instanceof Error) message = err.message;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Employee ID + PIN login
  const handleEmployeeIdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await AuthManager.loginByEmployeeId(employeeId, pin);
      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err: unknown) {
      let message = 'An unexpected error occurred';
      if (err instanceof Error) message = err.message;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start QR scanning
  const startScanning = async () => {
    if (!videoRef.current) return;
    
    try {
      setError('');
      setQrMessage('Initializing camera...');
      setIsScanning(true);
      
      await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' }
      });
      
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          await handleQRScanResult(result.data);
          stopScanning();
        },
        { highlightScanRegion: true, highlightCodeOutline: true }
      );
      
      await qrScannerRef.current.start();
      setQrMessage('Point camera at QR code...');
    } catch (err: unknown) {
      let message = 'Failed to start camera.';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') message = 'Camera permission denied. Please allow camera access.';
        else if (err.name === 'NotFoundError') message = 'No camera found on this device.';
        else message = err.message;
      }
      setError(message);
      setIsScanning(false);
      setQrMessage('');
    }
  };
  
  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };
  
  // Handle QR scan result
  const handleQRScanResult = async (qrData: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await AuthManager.loginByQR(qrData);
      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setError(result.error || 'QR login failed');
        setQrMessage('');
      }
    } catch (err: unknown) {
      let message = 'QR login failed';
      if (err instanceof Error) message = err.message;
      setError(message);
      setQrMessage('');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle file upload for QR
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      QrScanner.scanImage(file)
        .then(async result => await handleQRScanResult(result))
        .catch(() => setError('No QR code found in image'));
    }
  };
  
  const tabs = [
    { id: 'username' as const, label: 'Username', icon: User },
    { id: 'employeeId' as const, label: 'Employee ID', icon: CreditCard },
    { id: 'qrCode' as const, label: 'QR Code', icon: QrCode },
  ];
  
  return (
    <div className="min-h-screen flex items-stretch bg-slate-50">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white p-12 flex-col justify-between">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide uppercase text-white/60">CIRM</div>
              <div className="text-base font-semibold">QR-Based ERP System</div>
            </div>
          </div>
          <h2 className="mt-12 text-4xl font-bold leading-tight">Operate your site with confidence.</h2>
          <p className="mt-4 text-white/70 max-w-md">Unified sign-in for supervisors and field workers. Scan badges, manage inventory, track equipment — all from one place.</p>
        </div>
        <div className="relative grid grid-cols-3 gap-3">
          {[
            { label: 'Active Sites', value: '4' },
            { label: 'Tracked Assets', value: '540+' },
            { label: 'Uptime', value: '99.9%' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
              <div className="text-2xl font-semibold">{s.value}</div>
              <div className="text-xs text-white/60 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md">
        {/* Mobile brand header */}
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide uppercase text-slate-500">CIRM</div>
            <div className="text-base font-semibold text-slate-900">QR-Based ERP</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your account to continue</p>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="text-rose-800 text-sm">{error}</span>
          </div>
        )}
        
        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(''); }}
                className={`flex-1 py-2 px-3 text-xs font-medium flex items-center justify-center gap-1.5 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Username + Password Tab */}
          {activeTab === 'username' && (
            <form onSubmit={handleUsernameLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition text-sm"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              </button>
            </form>
          )}
          
          {/* Employee ID + PIN Tab */}
          {activeTab === 'employeeId' && (
            <form onSubmit={handleEmployeeIdLogin} className="space-y-4">
<div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Employee ID</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition text-sm"
                    placeholder="e.g., EMP-001"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Enter your employee ID (e.g., EMP-001)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">PIN</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition text-sm"
                    placeholder="Enter your 4-6 digit PIN"
                    maxLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">PIN is optional if not set</p>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              </button>
            </form>
          )}
          
          {/* QR Code Tab */}
          {activeTab === 'qrCode' && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-sm text-slate-600">
                  Scan your employee QR badge to log in instantly
                </p>
              </div>
              
              {/* Camera / Scanner Preview */}
              <div className="bg-slate-900 rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-48 object-cover"
                  style={{ display: isScanning ? 'block' : 'none' }}
                />
                
                {!isScanning && (
                  <div className="h-48 flex items-center justify-center bg-slate-800">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Camera preview</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Status Message */}
              {(qrMessage || isLoading) && (
                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    {isLoading ? 'Verifying...' : qrMessage}
                  </p>
                </div>
              )}
              
              {/* Scanner Controls */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={isScanning ? stopScanning : startScanning}
                  className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm ${
                    isScanning
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>{isScanning ? 'Stop Scanner' : 'Start Scanner'}</span>
                </button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-slate-500">or</span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload QR Image</span>
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              <p className="text-xs text-slate-500 text-center">
                Point your camera at your employee QR badge
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default LoginForm;
