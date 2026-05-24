import { useState, useEffect, useRef, useCallback } from 'react';
import ConfigPanel from './components/ConfigPanel';
import WorksheetView from './components/WorksheetView';

export default function App() {
  const [worksheetData, setWorksheetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [autoRetry, setAutoRetry] = useState(false);
  const countdownRef = useRef(null);
  const lastConfigRef = useRef(null);
  const autoRetryRef = useRef(false);

  const handleGenerate = useCallback(async ({ grade, topic, difficulty }) => {
    lastConfigRef.current = { grade, topic, difficulty };
    autoRetryRef.current = false;
    setLoading(true);
    setError(null);
    setWorksheetData(null);
    setRetryCountdown(0);
    setAutoRetry(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, topic, difficulty }),
      });

      const data = await res.json();

      if (res.status === 429) {
        const seconds = data.retryAfter || 60;
        setRetryCountdown(seconds);
        autoRetryRef.current = true;
        setAutoRetry(true);
        throw new Error(data.error || 'Rate limit reached. Please try again shortly.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate worksheet');
      }

      setWorksheetData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (retryCountdown <= 0) {
      clearInterval(countdownRef.current);
      return;
    }
    countdownRef.current = setInterval(() => {
      setRetryCountdown((n) => {
        if (n <= 1) {
          clearInterval(countdownRef.current);
          if (autoRetryRef.current && lastConfigRef.current) {
            autoRetryRef.current = false;
            const config = lastConfigRef.current;
            setTimeout(() => {
              setAutoRetry(false);
              handleGenerate(config);
            }, 100);
          }
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [retryCountdown, handleGenerate]);

  function cancelAutoRetry() {
    autoRetryRef.current = false;
    setAutoRetry(false);
    setRetryCountdown(0);
    clearInterval(countdownRef.current);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="bg-blue-600 text-white rounded-lg p-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Math Worksheet Generator</h1>
            <p className="text-sm text-slate-500">AI-powered worksheets for Grades 1–8</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <ConfigPanel
          onGenerate={handleGenerate}
          loading={loading}
          retryCountdown={retryCountdown}
          autoRetry={autoRetry}
        />

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-slate-600 text-sm">Generating your worksheet…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="h-5 w-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-red-700 font-medium text-sm">Error generating worksheet</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              {retryCountdown > 0 && autoRetry && (
                <p className="text-red-500 text-sm mt-2">
                  Auto-retrying in <strong>{retryCountdown}s</strong>…{' '}
                  <button
                    onClick={cancelAutoRetry}
                    className="underline hover:no-underline font-medium"
                  >
                    Cancel
                  </button>
                </p>
              )}
              {retryCountdown > 0 && !autoRetry && (
                <p className="text-red-500 text-sm mt-2">
                  You can retry in <strong>{retryCountdown}s</strong>…
                </p>
              )}
            </div>
          </div>
        )}

        {/* Worksheet */}
        {worksheetData && !loading && (
          <WorksheetView data={worksheetData} />
        )}

        {/* Empty state */}
        {!worksheetData && !loading && !error && (
          <div className="text-center py-16 text-slate-400">
            <svg className="h-12 w-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Select a grade, topic, and difficulty, then click <strong>Generate Worksheet</strong></p>
          </div>
        )}
      </main>
    </div>
  );
}
