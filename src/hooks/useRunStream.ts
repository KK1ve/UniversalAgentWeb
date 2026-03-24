import { useState, useEffect, useCallback } from 'react';

export type StreamEvent = 
  | { type: 'token'; data: string }
  | { type: 'done'; data: string }
  | { type: 'error'; data: string };

export function useRunStream(sessionId: string | null, runId: string | null) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'streaming' | 'completed' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !runId) {
      setContent('');
      setStatus('idle');
      return;
    }

    const token = localStorage.getItem('token');
    // Note: EventSource doesn't support headers natively, but the API doc mentions it.
    // In a real browser, you might need a polyfill or use fetch with readable streams.
    // However, the doc specifically provides a JavaScript example using EventSource with headers (which is non-standard).
    // I will implement a fetch-based stream reader to be safe and support headers.

    let isCancelled = false;
    setStatus('streaming');
    setContent('');

    const stream = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/sessions/${sessionId}/runs/${runId}/stream`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream'
          }
        });

        if (!response.ok) throw new Error('Failed to connect to stream');
        
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done || isCancelled) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event: StreamEvent = JSON.parse(line.slice(6));
                if (event.type === 'token') {
                  setContent(prev => prev + event.data);
                } else if (event.type === 'done') {
                  setContent(event.data);
                  setStatus('completed');
                } else if (event.type === 'error') {
                  setError(event.data);
                  setStatus('error');
                }
              } catch (e) {
                console.error('Error parsing SSE line:', line);
              }
            }
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Stream error');
          setStatus('error');
        }
      }
    };

    stream();

    return () => {
      isCancelled = true;
    };
  }, [sessionId, runId]);

  return { content, status, error };
}
