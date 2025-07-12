import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check, RotateCcw, AlertCircle } from 'lucide-react';

interface PhotoCaptureProps {
  onPhotoCapture: (photoDataUrl: string) => void;
  onClose: () => void;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoCapture, onClose }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    setIsCapturing(false);
    setIsLoading(false);
  }, [stream]);

  const startCamera = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      // Check for camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Request camera access with fallback constraints
      let mediaStream: MediaStream;
      
      try {
        // Try with ideal constraints first
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, min: 320 },
            height: { ideal: 480, min: 240 },
            facingMode: 'user'
          }
        });
      } catch (idealError) {
        // Fallback to basic constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        const video = videoRef.current;
        
        const handleLoadedMetadata = () => {
          setIsCapturing(true);
          setIsLoading(false);
          video.play().catch(console.error);
        };
        
        const handleError = () => {
          setError('Failed to load camera stream');
          setIsLoading(false);
          stopCamera();
        };
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        video.addEventListener('error', handleError, { once: true });
        
        // Timeout fallback
        setTimeout(() => {
          if (!isCapturing && mediaStream.active) {
            handleLoadedMetadata();
          }
        }, 3000);
      }
      
    } catch (error: any) {
      console.error('Camera error:', error);
      setIsLoading(false);
      
      if (error.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else if (error.name === 'NotSupportedError') {
        setError('Camera not supported in this browser. Please try uploading an image instead.');
      } else {
        setError('Failed to access camera. Please try uploading an image instead.');
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready. Please try again.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      setError('Canvas not supported. Please try uploading an image.');
      return;
    }

    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera not ready. Please wait a moment and try again.');
      return;
    }

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas (flip horizontally for selfie effect)
      context.save();
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();
      
      // Convert to data URL with good quality
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      if (photoDataUrl && photoDataUrl !== 'data:,') {
        setCapturedPhoto(photoDataUrl);
        stopCamera();
        setError('');
      } else {
        setError('Failed to capture photo. Please try again.');
      }
    } catch (captureError) {
      console.error('Capture error:', captureError);
      setError('Failed to capture photo. Please try again.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large. Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Create an image to validate and potentially resize
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) {
            setCapturedPhoto(result);
            return;
          }

          const context = canvas.getContext('2d');
          if (!context) {
            setCapturedPhoto(result);
            return;
          }

          // Resize if image is too large
          const maxWidth = 800;
          const maxHeight = 600;
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          context.drawImage(img, 0, 0, width, height);
          
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedPhoto(resizedDataUrl);
        };
        
        img.onerror = () => {
          setError('Invalid image file. Please try another image.');
        };
        
        img.src = result;
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read image file. Please try again.');
    };
    
    reader.readAsDataURL(file);
    
    // Reset file input
    event.target.value = '';
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoCapture(capturedPhoto);
      onClose();
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto('');
    setError('');
    // Don't automatically restart camera, let user choose
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Employee Photo</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          {!capturedPhoto ? (
            <>
              {/* Camera Preview */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                {isCapturing ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">Starting camera...</p>
                        </>
                      ) : (
                        <>
                          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">Take a photo or upload an image</p>
                          <p className="text-xs text-gray-500">Camera preview will appear here</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Capture Button */}
                {isCapturing && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={capturePhoto}
                      className="w-16 h-16 bg-white rounded-full border-4 border-blue-600 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
                    >
                      <div className="w-12 h-12 bg-blue-600 rounded-full"></div>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {!isCapturing ? (
                  <>
                    <button
                      onClick={startCamera}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isLoading ? 'Starting...' : 'Start Camera'}</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Image</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Stop Camera
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Photo Preview */}
              <div className="relative">
                <img
                  src={capturedPhoto}
                  alt="Captured"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>

              {/* Confirm/Retake Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={retakePhoto}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake</span>
                </button>
                <button
                  onClick={confirmPhoto}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Use Photo</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default PhotoCapture;