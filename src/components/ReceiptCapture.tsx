"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  X,
  RotateCw,
  Check,
  Upload,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Maximize2,
  FlipHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReceiptCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  maxSizeKB?: number;
  quality?: number;
}

type CaptureMode = "camera" | "preview" | "upload";

// Compress image to target size
async function compressImage(
  file: File,
  maxSizeKB: number,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      // Calculate new dimensions (max 1920px on longest side)
      const maxDimension = 1920;
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw with white background (for transparent images)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      const attemptCompress = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not compress image"));
              return;
            }

            const sizeKB = blob.size / 1024;

            // If still too large and quality > 0.3, try again with lower quality
            if (sizeKB > maxSizeKB && q > 0.3) {
              attemptCompress(q - 0.1);
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          "image/jpeg",
          q
        );
      };

      attemptCompress(quality);
    };

    img.onerror = () => reject(new Error("Could not load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function ReceiptCapture({
  onCapture,
  onClose,
  maxSizeKB = 500,
  quality = 0.8,
}: ReceiptCaptureProps) {
  const [mode, setMode] = useState<CaptureMode>("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">(
    "environment"
  );
  const [hasCamera, setHasCamera] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setError(null);

    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasCamera(true);
    } catch (err) {
      console.error("Camera error:", err);
      setHasCamera(false);
      setError("Could not access camera. Please use file upload instead.");
    }
  }, [cameraFacing]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Initialize camera on mount
  useEffect(() => {
    if (mode === "camera") {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [mode, startCamera, stopCamera]);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame
    ctx.drawImage(video, 0, 0);

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], `receipt-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        setCapturedFile(file);
        setCapturedImage(canvas.toDataURL("image/jpeg"));
        setMode("preview");
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  }, [stopCamera]);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      setCapturedFile(file);
      setCapturedImage(URL.createObjectURL(file));
      setMode("preview");
      stopCamera();
    },
    [stopCamera]
  );

  // Confirm and process capture
  const confirmCapture = useCallback(async () => {
    if (!capturedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Compress image
      const compressed = await compressImage(capturedFile, maxSizeKB, quality);
      onCapture(compressed);
    } catch (err) {
      console.error("Processing error:", err);
      setError("Failed to process image. Please try again.");
      setIsProcessing(false);
    }
  }, [capturedFile, maxSizeKB, quality, onCapture]);

  // Retake photo
  const retake = useCallback(() => {
    setCapturedImage(null);
    setCapturedFile(null);
    setMode("camera");
  }, []);

  // Switch camera
  const switchCamera = useCallback(() => {
    setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <h2 className="text-white font-semibold">Capture Receipt</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Camera View */}
          {mode === "camera" && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {hasCamera ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-8 sm:inset-12 border-2 border-white/50 rounded-lg">
                      {/* Corner markers */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal rounded-br-lg" />
                    </div>
                    <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm text-center px-4">
                      Position receipt within the frame
                    </p>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center p-6">
                    <AlertCircle className="w-12 h-12 text-warning-amber mx-auto mb-4" />
                    <p className="text-white mb-4">{error}</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-teal text-white rounded-full font-medium"
                    >
                      Upload Image Instead
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Preview View */}
          {mode === "preview" && capturedImage && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 flex items-center justify-center bg-black p-4"
            >
              <img
                src={capturedImage}
                alt="Captured receipt"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      {error && mode === "preview" && (
        <div className="px-4 py-2 bg-loss-red/20 border-t border-loss-red/30">
          <p className="text-loss-red text-sm text-center">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 pb-8 bg-black/50 backdrop-blur-sm safe-area-bottom">
        {mode === "camera" && (
          <div className="flex items-center justify-center gap-6">
            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Upload from gallery"
            >
              <ImageIcon className="w-6 h-6" />
            </button>

            {/* Capture button */}
            <button
              onClick={capturePhoto}
              disabled={!hasCamera}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
              aria-label="Take photo"
            >
              <div className="w-16 h-16 rounded-full border-4 border-gray-300" />
            </button>

            {/* Switch camera button */}
            <button
              onClick={switchCamera}
              disabled={!hasCamera}
              className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              aria-label="Switch camera"
            >
              <FlipHorizontal className="w-6 h-6" />
            </button>
          </div>
        )}

        {mode === "preview" && (
          <div className="flex items-center justify-center gap-4">
            {/* Retake button */}
            <button
              onClick={retake}
              disabled={isProcessing}
              className="flex-1 max-w-[150px] flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-medium disabled:opacity-50"
            >
              <RotateCw className="w-5 h-5" />
              Retake
            </button>

            {/* Confirm button */}
            <button
              onClick={confirmCapture}
              disabled={isProcessing}
              className="flex-1 max-w-[150px] flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-teal text-white font-medium disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Use Photo
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Hidden elements */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </motion.div>
  );
}

// Floating Action Button for mobile receipt capture
interface MobileReceiptFABProps {
  onClick: () => void;
  className?: string;
}

export function MobileReceiptFAB({ onClick, className }: MobileReceiptFABProps) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "fixed bottom-24 right-4 z-40 md:hidden",
        "w-14 h-14 rounded-full",
        "bg-teal text-white shadow-lg shadow-teal/30",
        "flex items-center justify-center",
        "active:bg-teal/90 transition-colors",
        className
      )}
      aria-label="Capture receipt"
    >
      <Camera className="w-6 h-6" />
    </motion.button>
  );
}

