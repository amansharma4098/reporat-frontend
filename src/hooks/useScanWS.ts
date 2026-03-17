import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { WSMessage } from "@/types";

export function useScanWS(scanId: string | null) {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!scanId) return;
    const ws = new WebSocket(api.getWSUrl(scanId));
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        if (data.status) {
          setMessages((prev) => [...prev, data]);
        }
      } catch {}
    };
  }, [scanId]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { messages, connected, latest: messages[messages.length - 1] || null };
}
