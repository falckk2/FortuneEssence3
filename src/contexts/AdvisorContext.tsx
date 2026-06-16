'use client';

import { createContext, useContext, useState, useRef, ReactNode } from 'react';

interface Message {
  role: 'user' | 'advisor';
  content: string;
}

interface Product {
  name: string;
  name_sv?: string;
  price_sek?: number;
  sku?: string;
}

interface AdvisorState {
  open: boolean;
  setOpen: (v: boolean) => void;
  messages: Message[];
  setMessages: (v: Message[] | ((prev: Message[]) => Message[])) => void;
  sessionId: string | null;
  setSessionId: (v: string | null) => void;
  sessionIdRef: React.MutableRefObject<string | null>;
  products: Product[];
  setProducts: (v: Product[] | ((prev: Product[]) => Product[])) => void;
  reset: (greeting: string) => void;
}

const AdvisorContext = createContext<AdvisorState | null>(null);

export function AdvisorProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  function setSessionId(v: string | null) {
    sessionIdRef.current = v;
    setSessionIdState(v);
  }

  function reset(greeting: string) {
    setMessages([{ role: 'advisor', content: greeting }]);
    setSessionId(null);
    setProducts([]);
  }

  return (
    <AdvisorContext.Provider value={{ open, setOpen, messages, setMessages, sessionId, setSessionId, sessionIdRef, products, setProducts, reset }}>
      {children}
    </AdvisorContext.Provider>
  );
}

export function useAdvisor() {
  const ctx = useContext(AdvisorContext);
  if (!ctx) throw new Error('useAdvisor must be used within AdvisorProvider');
  return ctx;
}
