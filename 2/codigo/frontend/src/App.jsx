import { useState, useRef, useEffect } from "react";
import { Send, Bot, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { ScrollArea } from "./components/ui/scroll-area";
import { cn } from "./lib/utils";

// Indicador de escritura
const TypingIndicator = () => (
  <div className="flex items-start gap-3 animate-fade-in">
    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
      <Bot className="w-4 h-4" />
    </div>
    <div className="bg-muted/50 rounded-lg px-4 py-2.5">
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full typing-dot"></div>
        <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full typing-dot"></div>
        <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full typing-dot"></div>
      </div>
    </div>
  </div>
);

// Componente de mensaje
const Message = ({ message, isUser }) => (
  <div
    className={cn(
      "flex items-start gap-3 animate-slide-up",
      isUser && "flex-row-reverse"
    )}
  >
    {!isUser && (
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
        <Bot className="w-4 h-4" />
      </div>
    )}
    <div
      className={cn("max-w-[80%] flex flex-col gap-2", isUser && "items-end")}
    >
      <div
        className={cn(
          "rounded-lg px-4 py-2.5",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-line">
          {message.answer || message.text}
        </p>
      </div>

      {/* Metadata */}
      {!isUser && message.career_name && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {message.career_name}
          </Badge>
          {message.field && (
            <Badge variant="outline" className="text-xs">
              {message.field.replace("_", " ")}
            </Badge>
          )}
          {message.source && (
            <a
              href={message.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Ver ficha</span>
            </a>
          )}
        </div>
      )}
    </div>
  </div>
);

// Sugerencias dinamicas basadas en el contexto
const getSuggestions = (messages, lastCareer) => {
  if (messages.length <= 1) {
    return [
      "Que carreras hay disponibles?",
      "Perfil de Licenciatura en Sistemas",
      "Cuanto dura Bioquimica?",
      "Campo laboral de Ingenieria Electronica",
    ];
  }

  if (lastCareer) {
    return [
      `Cual es el campo profesional?`,
      `Cuanto dura la carrera?`,
      `Que alcances tiene el titulo?`,
      "Ver otras carreras",
    ];
  }

  return [
    "Ingenierias disponibles",
    "Profesorados de FACENA",
    "Licenciatura en Matematica",
    "Que es Ingenieria en Agrimensura?",
  ];
};

// Componente de sugerencias
const Suggestions = ({ suggestions, onSend, disabled }) => (
  <div className="flex flex-wrap gap-2">
    {suggestions.map((suggestion, idx) => (
      <Button
        key={idx}
        variant="outline"
        size="sm"
        onClick={() => onSend(suggestion)}
        disabled={disabled}
        className="h-auto py-1.5 px-3 text-xs"
      >
        {suggestion}
      </Button>
    ))}
  </div>
);

// Componente principal
function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastCareer, setLastCareer] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector(".overflow-auto");
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Mensaje inicial
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        isUser: false,
        answer:
          "Hola! Soy el asistente de carreras de FACENA (UNNE). Puedo ayudarte con informacion sobre nuestras carreras de grado: ingenierias, licenciaturas y profesorados.\n\nPreguntame sobre perfil, campo laboral, duracion o alcances del titulo.",
      },
    ]);
  }, []);

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage = {
      id: Date.now(),
      isUser: true,
      text: messageText,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) throw new Error("Error del servidor");

      const data = await response.json();

      if (data.career_name) {
        setLastCareer(data.career_name);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          isUser: false,
          ...data,
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          isUser: false,
          answer: "Error al procesar la consulta. Intenta de nuevo.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const suggestions = getSuggestions(messages, lastCareer);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header fijo */}
      <header className="shrink-0 border-b border-border px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              Asistente FACENA
            </h1>
            <p className="text-xs text-muted-foreground">
              Universidad Nacional del Nordeste
            </p>
          </div>
        </div>
      </header>

      {/* Chat con scroll */}
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} isUser={msg.isUser} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>

      {/* Footer fijo con sugerencias e input */}
      <footer className="shrink-0 border-t border-border px-4 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Sugerencias */}
          <Suggestions
            suggestions={suggestions}
            onSend={sendMessage}
            disabled={isLoading}
          />

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta sobre las carreras..."
              disabled={isLoading}
              className="flex-1 bg-background border border-input rounded-lg px-4 py-2.5
                         text-sm text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 text-center justify-center" >
          <span>
            Puedes preguntar por nombre de carrera, perfil, duracion, campo laboral o alcances del titulo
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
