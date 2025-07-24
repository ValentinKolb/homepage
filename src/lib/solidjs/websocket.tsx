import { createSignal, onCleanup, createEffect } from "solid-js";

export type WSState =
  | "Connecting"
  | "Connected"
  | "Disconnecting"
  | "Disconnected";

export type WSEvent =
  | { type: "message"; data: string; timestamp: Date }
  | { type: "open"; timestamp: Date }
  | { type: "close"; code: number; reason: string; timestamp: Date }
  | { type: "error"; message: string; timestamp: Date };

export interface WSInstance {
  state: () => WSState;
  connect: () => void;
  disconnect: () => void;
  send: (data: string) => boolean;
}

export const isValidWebSocketUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "ws:" || parsed.protocol === "wss:";
  } catch {
    return false;
  }
};

export const createWS = (
  url: () => string,
  onEvent?: (event: WSEvent) => void,
  options?: {
    protocols?: string | string[];
    binaryType?: "blob" | "arraybuffer";
    autoConnect?: boolean;
  },
): WSInstance => {
  const [state, setState] = createSignal<WSState>("Disconnected");

  let ws: WebSocket | null = null;

  const connect = () => {
    if (
      ws &&
      (ws.readyState === WebSocket.CONNECTING ||
        ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    const currentUrl = url();
    if (!currentUrl || !currentUrl.trim()) {
      setState("Disconnected");
      return;
    }

    if (!isValidWebSocketUrl(currentUrl)) {
      setState("Disconnected");
      return;
    }

    setState("Connecting");

    try {
      ws = new WebSocket(currentUrl, options?.protocols);
      if (options?.binaryType) {
        ws.binaryType = options.binaryType;
      }

      ws.onopen = () => {
        setState("Connected");
        onEvent?.({ type: "open", timestamp: new Date() });
      };

      ws.onmessage = (event) => {
        onEvent?.({ type: "message", data: event.data, timestamp: new Date() });
      };

      ws.onclose = (event) => {
        setState("Disconnected");
        onEvent?.({
          type: "close",
          code: event.code,
          reason: event.reason,
          timestamp: new Date(),
        });
      };

      ws.onerror = () => {
        setState("Disconnected");
        onEvent?.({
          type: "error",
          message: "WebSocket connection error",
          timestamp: new Date(),
        });
      };
    } catch (error) {
      setState("Disconnected");
      onEvent?.({
        type: "error",
        message: `Failed to connect: ${error}`,
        timestamp: new Date(),
      });
    }
  };

  const disconnect = () => {
    if (ws) {
      setState("Disconnecting");
      ws.close();
    } else {
      setState("Disconnected");
    }
  };

  const send = (data: string): boolean => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(data);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  // Auto-reconnect when URL changes
  createEffect(() => {
    const currentUrl = url();
    const wasConnected = ws && ws.readyState === WebSocket.OPEN;
    const shouldAutoConnect = options?.autoConnect !== false; // Default to true

    if (wasConnected) {
      disconnect();
      if (currentUrl && currentUrl.trim() && shouldAutoConnect) {
        setTimeout(() => connect(), 100);
      }
    } else if (currentUrl && currentUrl.trim() && shouldAutoConnect) {
      connect();
    }
  });

  // Cleanup on component unmount
  onCleanup(() => {
    if (ws) {
      ws.close();
    }
  });

  return {
    state,
    connect,
    disconnect,
    send,
  };
};
