"use client";

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Send, PhoneCall, AlertTriangle, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

export default function SupportChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy';

  // Do not show widget on staff portal pages
  if (pathname?.startsWith('/staff')) {
    return null;
  }

  // Scroll to the bottom of the chat when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMessageText = message.trim();
    setMessage('');
    
    // Add user message to history
    const updatedHistory: Message[] = [...chatHistory, { role: 'user', content: userMessageText }];
    setChatHistory(updatedHistory);
    setLoading(true);

    try {
      const response = await fetch('/api/proxy/support/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessageText,
          conversation_history: chatHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Could not connect to support assistant.');
      }

      const data = await response.json();
      setChatHistory([
        ...updatedHistory,
        { role: 'model', content: data.response || "No response received." }
      ]);
    } catch (err: any) {
      setChatHistory([
        ...updatedHistory,
        { role: 'model', content: "Sorry, I couldn't reach support. Please verify your connection or try again later." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-teal-500/20 hover:shadow-teal-400/40 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          title="Open Support Chat"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[550px] max-h-[calc(100vh-120px)] rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm tracking-wide leading-tight">
                  Support Assistant
                </h3>
                <span className="text-xxs text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ask about orders, FAQ, site
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Persistent Warning Banner (Safety boundary) */}
          <div className="px-4 py-2 bg-amber-500/5 border-b border-amber-500/10 flex items-start gap-2 text-xxs text-amber-400/80">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-400 mt-0.5" />
            <span>
              <strong>AI Assistant:</strong> Not a substitute for medical advice. I cannot discuss dosages, symptoms, or diagnoses.
            </span>
          </div>

          {/* Message List */}
          <div className="flex-grow overflow-y-auto p-6 space-y-4 scrollbar-thin">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 px-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-500">
                  💬
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-300">How can I help you today?</p>
                  <p className="text-xxs text-slate-500 leading-normal max-w-[240px]">
                    Ask about order tracking, refunds, prescription uploads, or navigation tips.
                  </p>
                </div>
              </div>
            ) : (
              chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-teal-500 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-800/50 text-slate-200 border border-slate-800 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-slate-800/50 border border-slate-800 rounded-tl-none flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Persistent Contact & Footer Fallback */}
          <div className="px-6 py-2.5 bg-slate-950/40 border-t border-slate-800/50 flex items-center justify-between text-xxs text-slate-500">
            <span>Need human support?</span>
            <a
              href="/#footer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 font-bold text-teal-400 hover:text-teal-300 transition-colors uppercase tracking-wider"
            >
              <PhoneCall className="h-3 w-3" />
              Contact Store
            </a>
          </div>

          {/* Form Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-slate-900 border-t border-slate-800/60 flex items-center gap-2"
          >
            <input
              type="text"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              placeholder="Ask support..."
              className="flex-grow bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50 disabled:opacity-50 transition-all duration-300"
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 disabled:opacity-50 disabled:hover:bg-teal-500 transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
