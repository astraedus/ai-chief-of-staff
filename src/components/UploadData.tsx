"use client";

import { useRef } from "react";

interface UploadDataProps {
  onUpload: (messages: unknown[]) => void;
  isProcessing: boolean;
}

export function UploadData({ onUpload, isProcessing }: UploadDataProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const messages = Array.isArray(parsed) ? parsed : parsed.messages;

      if (!Array.isArray(messages) || messages.length === 0) {
        alert("Invalid file: expected a JSON array of messages or an object with a 'messages' field.");
        return;
      }

      onUpload(messages);
    } catch {
      alert("Failed to parse the JSON file. Please check the format.");
    }

    // Reset so the same file can be re-uploaded
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFile}
        className="hidden"
        id="file-upload"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        Upload Messages
      </button>
    </>
  );
}
