import { useState } from 'react';

interface UsePythonApiOptions {
  endpoint: string;
}

interface UsePythonApiResult {
  loading: boolean;
  error: string | null;
  data: any;
  uploadFile: (file: File) => Promise<void>;
  reset: () => void;
}

export function usePythonApi({ endpoint }: UsePythonApiOptions): UsePythonApiResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
  };

  const uploadFile = async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/python-proxy${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error uploading file:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    data,
    uploadFile,
    reset,
  };
} 