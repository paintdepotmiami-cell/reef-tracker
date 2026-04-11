'use client';

import { useState, useRef } from 'react';
import { getAuthHeaders } from '@/lib/supabase';

export interface IdentifyResult {
  type: 'equipment' | 'supplement' | 'fish' | 'coral' | 'invertebrate' | 'unknown';
  name: string;
  brand: string | null;
  scientific_name?: string | null;
  category: string;
  confidence: number;
  details: string;
}

interface ImageIdentifierProps {
  context?: 'equipment' | 'supplement' | 'fish' | 'coral' | 'invertebrate' | 'auto';
  onResult: (result: IdentifyResult, imageBase64: string) => void;
  onResults?: (results: IdentifyResult[], imageBase64: string) => void;
  onClose: () => void;
}

export default function ImageIdentifier({ context = 'auto', onResult, onResults, onClose }: ImageIdentifierProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Compress image to max 800px and JPEG quality 0.7 to avoid timeouts
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
          let w = img.width, h = img.height;
          if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
          else { if (h > MAX) { w = w * MAX / h; h = MAX; } }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setError(null);
    const compressed = await compressImage(file);
    setPreview(compressed);
  };

  const identify = async () => {
    if (!preview) return;
    setIdentifying(true);
    setError(null);

    try {
      const auth = await getAuthHeaders();
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({ image: preview, context }),
      });

      if (!res.ok) {
        throw new Error('Identification failed');
      }

      const data = await res.json();

      // Handle multi-item format: { items: [...] }
      const items: IdentifyResult[] = data.items || (data.name ? [data] : []);
      const validItems = items.filter(i => i.type !== 'unknown' && i.name);

      if (validItems.length === 0) {
        setError('Could not identify this image. Try a clearer photo or closer angle.');
        setIdentifying(false);
        return;
      }

      // If parent supports multi-results, send all; otherwise send first
      if (onResults) {
        onResults(validItems, preview);
      } else {
        onResult(validItems[0], preview);
      }
    } catch {
      setError('Failed to identify. Check your connection and try again.');
    } finally {
      setIdentifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[70] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-gradient-to-b from-[#112036] to-[#041329] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto border-t border-[#FF7F50]/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 space-y-5">
          {/* Handle */}
          <div className="flex justify-center sm:hidden">
            <div className="w-10 h-1 rounded-full bg-[#27354c]"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF7F50]/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#FF7F50] text-xl">photo_camera</span>
              </div>
              <div>
                <h2 className="text-lg font-[family-name:var(--font-headline)] font-bold text-white">AI Identify</h2>
                <p className="text-[#c5c6cd]/50 text-xs">Take a photo or upload an image</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1c2a41] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#c5c6cd] text-sm">close</span>
            </button>
          </div>

          {/* Image preview or capture buttons */}
          {!preview ? (
            <div className="space-y-3">
              {/* Camera */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full bg-gradient-to-br from-[#FF7F50] to-[#d35e32] text-white rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform shadow-lg shadow-[#FF7F50]/20"
              >
                <span className="material-symbols-outlined text-3xl">photo_camera</span>
                <div className="text-left">
                  <p className="font-[family-name:var(--font-headline)] font-bold text-base">Take Photo</p>
                  <p className="text-white/70 text-xs">Use camera to capture</p>
                </div>
              </button>

              {/* Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-[#0d1c32] border border-[#1c2a41] text-white rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform"
              >
                <span className="material-symbols-outlined text-3xl text-[#4cd6fb]">upload</span>
                <div className="text-left">
                  <p className="font-[family-name:var(--font-headline)] font-bold text-base">Upload Image</p>
                  <p className="text-[#c5c6cd]/50 text-xs">Choose from gallery</p>
                </div>
              </button>

              {/* Hidden inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              {/* Tips */}
              <div className="bg-[#041329] rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-bold text-[#c5c6cd]/40 uppercase tracking-widest">Tips for best results</p>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#F1C40F] text-sm mt-0.5">tips_and_updates</span>
                  <p className="text-[#c5c6cd] text-xs">Clear, well-lit photo of the item</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#F1C40F] text-sm mt-0.5">tips_and_updates</span>
                  <p className="text-[#c5c6cd] text-xs">Show the label/brand for products</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#F1C40F] text-sm mt-0.5">tips_and_updates</span>
                  <p className="text-[#c5c6cd] text-xs">Full body shot for fish & corals</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative rounded-2xl overflow-hidden">
                <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
                <button
                  onClick={() => { setPreview(null); setError(null); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-white text-sm">close</span>
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-xl p-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#ff4444] text-sm mt-0.5">error</span>
                  <p className="text-[#ff4444] text-xs">{error}</p>
                </div>
              )}

              {/* Identify button */}
              <button
                onClick={identify}
                disabled={identifying}
                className="w-full bg-gradient-to-br from-[#FF7F50] to-[#d35e32] text-white font-[family-name:var(--font-headline)] font-bold py-4 rounded-xl text-sm tracking-widest uppercase shadow-xl shadow-[#FF7F50]/20 active:scale-[0.98] transition-transform duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {identifying ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                    Identifying...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                    Identify with AI
                  </>
                )}
              </button>

              {/* Retake */}
              <button
                onClick={() => { setPreview(null); setError(null); }}
                className="w-full py-3 rounded-xl bg-[#0d1c32] text-[#c5c6cd] text-sm font-medium flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Take Another Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
