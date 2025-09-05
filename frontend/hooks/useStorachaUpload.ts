"use client";
import { useCallback, useState } from "react";

export function useStorachaUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "upload failed");
      return data as { cid: string; gateway: string };
    } catch (e: any) {
      setError(e?.message || "upload failed");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { upload, loading, error };
}


