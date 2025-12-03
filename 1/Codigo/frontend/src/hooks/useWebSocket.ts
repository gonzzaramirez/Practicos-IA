/**
 * Hook personalizado para manejar la conexión WebSocket con reconexión automática
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { WSMessage, WSRequest } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_URL = API_URL.replace("http", "ws") + "/ws/run";
const RECONNECT_DELAY = 2000; // 2 segundos

interface UseWebSocketReturn {
  connected: boolean;
  send: (request: WSRequest) => void;
  messages: WSMessage[];
  error: string | null;
  clearMessages: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);
  const reconnectAttemptsRef = useRef(0);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const connect = useCallback(() => {
    if (!shouldReconnectRef.current) return;

    // Cerrar conexión anterior si existe
    if (wsRef.current) {
      wsRef.current.onclose = null; // Evitar que se dispare el reconnect automático
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("WebSocket conectado");
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          setMessages((prev) => [...prev, message]);
        } catch (err) {
          console.error("Error parseando mensaje WebSocket:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("Error en WebSocket:", err);
        setError("Error de conexión WebSocket");
        setConnected(false);
      };

      ws.onclose = (event) => {
        console.log("WebSocket desconectado", event.code, event.reason);
        setConnected(false);

        // Solo reconectar si no fue una desconexión intencional
        // El servidor cierra la conexión después de enviar 'done', eso es normal
        if (shouldReconnectRef.current && !event.wasClean) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(
            RECONNECT_DELAY * reconnectAttemptsRef.current,
            10000
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `Reintentando conexión WebSocket (intento ${reconnectAttemptsRef.current})...`
            );
            connect();
          }, delay);
        } else {
          // Si fue una desconexión limpia (como después de 'done'), reconectar después de un breve delay
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
              console.log("Reconectando después de desconexión limpia...");
              connect();
            }
          }, 500);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Error creando WebSocket:", err);
      setError("Error al conectar WebSocket");

      // Reintentar después de un delay
      reconnectTimeoutRef.current = setTimeout(() => {
        if (shouldReconnectRef.current) {
          connect();
        }
      }, RECONNECT_DELAY);
    }
  }, []);

  const send = useCallback(
    (request: WSRequest) => {
      // Si el WebSocket está cerrado, crear una nueva conexión
      if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
        console.log("WebSocket cerrado, creando nueva conexión...");
        clearMessages();
        connect();

        // Esperar a que se conecte antes de enviar
        const checkConnection = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection);
            wsRef.current.send(JSON.stringify(request));
            clearMessages();
          }
        }, 100);

        // Timeout después de 5 segundos
        setTimeout(() => clearInterval(checkConnection), 5000);
        return;
      }

      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(request));
        clearMessages();
      } else if (wsRef.current.readyState === WebSocket.CONNECTING) {
        // Esperar a que se conecte
        wsRef.current.addEventListener(
          "open",
          () => {
            if (wsRef.current) {
              wsRef.current.send(JSON.stringify(request));
              clearMessages();
            }
          },
          { once: true }
        );
      } else {
        setError("WebSocket no está listo. Intentando reconectar...");
        connect();
      }
    },
    [clearMessages, connect]
  );

  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // Evitar reconexión en cleanup
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { connected, send, messages, error, clearMessages };
}
