'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MinusIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/solid';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdvisor } from '@/contexts/AdvisorContext';

interface ChatResponse {
  session_id: string;
  reply: string;
  products: { name: string; name_sv?: string; price_sek?: number; sku?: string }[];
  gathered_enough: boolean;
}

export function OilAdvisorWidget() {
  const { locale } = useLocale();
  const { open, setOpen, messages, setMessages, sessionId, setSessionId, products, setProducts, reset } = useAdvisor();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const greeting = locale === 'sv'
    ? 'Hej! Jag heter Essie och är din personliga oljerådgivare här på FortuneEssence 🌿 Berätta gärna vad du söker — bättre sömn, mindre stress, mer energi eller något annat? Jag hjälper dig hitta rätt!'
    : "Hi there! I'm Essie, your personal oil advisor at FortuneEssence 🌿 Tell me a little about what you're looking for — better sleep, less stress, more energy, or something else? I'd love to help you find the perfect match!";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, products, loading]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
      if (messages.length === 0) {
        setMessages([{ role: 'advisor', content: greeting }]);
      }
    }
  }, [open, greeting, messages.length, setMessages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);
      const res = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`${res.status} ${res.statusText}: ${body}`);
      }
      const data: ChatResponse = await res.json();
      setSessionId(data.session_id);
      setMessages(prev => [...prev, { role: 'advisor', content: data.reply }]);
      if (data.products?.length) setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Chat panel */}
      {open && (
        <div className="w-[22rem] sm:w-[24rem] max-w-[calc(100vw-48px)] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#3f4946] bg-white dark:bg-[#242a28]"
          style={{ maxHeight: 'min(520px, calc(100vh - 120px))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#3f4946]">
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-[#E8EDE8]">
                {locale === 'sv' ? 'Oljerådgivare' : 'Oil Advisor'}
              </p>
              <p className="text-xs text-gray-400 dark:text-[#6B7B6B] mt-0.5">
                Powered by AI
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => reset(greeting)}
                className="text-xs text-gray-400 dark:text-[#6B7B6B] hover:text-gray-600 dark:hover:text-[#C5D4C5] transition-colors px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-[#2a3330]"
              >
                {locale === 'sv' ? 'Börja om' : 'Reset'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a3330] transition-colors"
                aria-label="Close"
              >
                <MinusIcon className="w-4 h-4 text-gray-500 dark:text-[#8A9A8A]" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'advisor' && (
                  <div className="w-7 h-7 rounded-full bg-forest-600 dark:bg-sage-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-gray-900 dark:bg-[#1a1f1e] text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-[#2a3330] text-gray-800 dark:text-[#E8EDE8] rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-forest-600 dark:bg-sage-600 flex items-center justify-center shrink-0">
                  <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-[#2a3330] rounded-2xl rounded-bl-sm px-4 py-3">
                  <span className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-[#6B7B6B] rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-[#6B7B6B] rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-[#6B7B6B] rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            {/* Product recommendations */}
            {products.length > 0 && (
              <div className="mt-1 space-y-1.5">
                <p className="text-xs font-semibold text-gray-400 dark:text-[#6B7B6B] uppercase tracking-wide px-1">
                  {locale === 'sv' ? 'Rekommenderade produkter' : 'Recommended products'}
                </p>
                {products.map((p, i) => (
                  <Link
                    key={i}
                    href={`/products?search=${encodeURIComponent(p.sku || p.name)}`}
                    className="flex justify-between items-center px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1f1e] border border-gray-200 dark:border-[#3f4946] hover:border-forest-400 dark:hover:border-sage-500 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-800 dark:text-[#E8EDE8] group-hover:text-forest-600 dark:group-hover:text-sage-400 transition-colors truncate">
                      {locale === 'sv' && p.name_sv ? p.name_sv : p.name}
                    </span>
                    {p.price_sek && (
                      <span className="text-xs text-gray-400 dark:text-[#6B7B6B] ml-3 shrink-0">
                        {p.price_sek} kr
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-[#3f4946] flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={locale === 'sv' ? 'Skriv ett meddelande…' : 'Type a message…'}
              disabled={loading}
              className="flex-1 text-sm px-4 py-2.5 rounded-full border border-gray-200 dark:border-[#4a5552] bg-gray-50 dark:bg-[#1a1f1e] text-gray-800 dark:text-[#E8EDE8] placeholder-gray-400 dark:placeholder-[#6B7B6B] focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-sage-500 disabled:opacity-50 transition"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-full bg-gray-900 dark:bg-sage-600 text-white hover:bg-gray-700 dark:hover:bg-sage-700 disabled:opacity-30 transition-colors shrink-0"
              aria-label="Send"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Pill trigger button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Open oil advisor chat"
        className="flex items-center gap-2.5 bg-gray-900 dark:bg-[#2a3330] text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-[#343c39] transition-colors"
      >
        <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
        <span className="text-sm font-medium">
          {locale === 'sv' ? 'Chatta' : 'Chat'}
        </span>
      </button>

    </div>
  );
}
