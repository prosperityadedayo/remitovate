"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoUploadProps {
  onChange: (file: File | null) => void;
  value?: string | null;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function LogoUpload({ onChange, value }: LogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const [hasCustomFile, setHasCustomFile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value && !hasCustomFile) {
      setPreview(value);
    }
  }, [value, hasCustomFile]);

  const cropToSquare = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const size = Math.min(img.width, img.height);
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to crop image"));
                return;
              }
              const croppedFile = new File([blob], file.name, {
                type: file.type,
              });
              resolve(croppedFile);
            },
            file.type || "image/png",
            0.9,
          );
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError(null);

    if (!file) {
      setPreview(null);
      onChange(null);
      setHasCustomFile(false);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Logo must be less than 2MB");
      onChange(null);
      return;
    }

    try {
      const croppedFile = await cropToSquare(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(croppedFile);
      onChange(croppedFile);
      setHasCustomFile(true);
    } catch {
      setError("Failed to process image. Please try another file.");
      onChange(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={cn(
          "relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-border transition-colors hover:border-primary/50",
          preview && "border-solid",
        )}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Logo preview"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <span className="text-xs">Logo</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        id="logo-upload"
      />
      <label
        htmlFor="logo-upload"
        className="cursor-pointer text-sm font-medium text-primary hover:underline"
      >
        {preview ? "Change logo" : "Upload logo"}
      </label>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
