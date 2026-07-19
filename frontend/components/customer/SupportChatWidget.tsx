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
      {/* Floating Action Button (Pill layout) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-accent hover:bg-accent/90 text-white shadow-md border border-primary-dark/10 transition-all hover:scale-102 active:scale-98 animate-pulse-once cursor-pointer font-sans text-sm font-bold"
          title="Open Support Chat"
        >
          <MessageSquare className="h-4.5 w-4.5 text-paper" />
          <span>Ask us anything</span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[550px] max-h-[calc(100vh-120px)] rounded-xl bg-white border border-primary-dark/15 shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="px-6 py-4 bg-primary-dark border-b border-primary-dark/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-paper/10 border border-paper/15 text-highlight">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-white text-sm tracking-wide leading-tight">
                  Support Assistant
                </h3>
                <span className="text-[10px] text-paper/85 font-mono flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-highlight animate-pulse" />
                  Ask about orders, Rx, FAQ
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded text-paper/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Persistent Warning Banner (Safety boundary - required to stay) */}
          <div className="px-4 py-2 bg-highlight/10 border-b border-highlight/20 flex items-start gap-2 text-[10px] text-primary-dark font-sans leading-relaxed">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-highlight mt-0.5" />
            <span>
              <strong>AI Assistant:</strong> Not a substitute for medical advice. I cannot discuss dosages, symptoms, or diagnoses.
            </span>
          </div>

          {/* Message List */}
          <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-paper/20">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 px-4">
                <div className="h-12 w-12 rounded bg-paper border border-primary-dark/10 flex items-center justify-center text-xl text-primary-dark">
                  💬
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-ink">How can we help you today?</p>
                  <p className="text-[10px] font-sans text-ink/60 leading-normal max-w-[240px]">
                    Ask about order statuses, store policies, or digital prescription uploads.
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
                    className={`max-w-[85%] rounded px-3 py-2 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-accent text-white font-medium rounded-tr-none'
                        : 'bg-white text-ink border border-primary-dark/10 rounded-tl-none shadow-xxs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded px-3 py-2 bg-white border border-primary-dark/10 rounded-tl-none flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Persistent Contact & Footer Fallback */}
          <div className="px-6 py-2 bg-white border-t border-primary-dark/10 flex items-center justify-between text-[10px] text-ink/65">
            <span>Need human assistance?</span>
            <a
              href="/#footer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 font-mono font-bold text-accent hover:text-accent/90 transition-colors uppercase tracking-wider"
            >
              <PhoneCall className="h-3 w-3" />
              Contact Store
            </a>
          </div>

          {/* Form Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-white border-t border-primary-dark/10 flex items-center gap-2"
          >
            <input
              type="text"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              placeholder="Ask support..."
              className="flex-grow bg-paper/40 border border-primary-dark/15 rounded px-3 py-2 text-xs text-ink placeholder-ink/40 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:opacity-50 transition-all font-sans"
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="p-2 rounded bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:hover:bg-accent transition-colors cursor-pointer border border-transparent shadow-sm"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
