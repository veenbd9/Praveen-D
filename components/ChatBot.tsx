import React, { useState, useRef, useEffect } from 'react';
import { Chat } from "@google/genai";
import { createSupportChatSession, sendMessageToChat } from '../services/geminiService';
import { User } from '../types';

interface ChatBotProps {
    user?: User;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  sources?: { title: string; uri: string }[];
}

export const ChatBot: React.FC<ChatBotProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
        chatSessionRef.current = createSupportChatSession(user);
        // Add initial greeting
        setMessages([{ role: 'model', text: "Hi there! I'm your Resume Optimizer assistant. How can I help you today with your resume, subscriptions, or payments?" }]);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await sendMessageToChat(chatSessionRef.current, userMsg);
      setMessages(prev => [...prev, { role: 'model', text: response.text, sources: response.sources }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-96 h-[450px] sm:h-[500px] mb-4 flex flex-col overflow-hidden animate-fade-in-up origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <div className="bg-white p-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                </div>
                <h3 className="text-white font-bold">Support Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-slate-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] px-4 py-2 rounded-lg text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-slate-700 text-slate-200 rounded-bl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-1 max-w-[85%]">
                         <p className="text-xs text-slate-500 mb-1">Sources:</p>
                         <div className="flex flex-wrap gap-1">
                            {msg.sources.map((source, i) => (
                                <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs bg-slate-800 border border-slate-600 text-indigo-400 px-2 py-0.5 rounded hover:bg-slate-700 truncate max-w-full block" title={source.title}>
                                    {source.title || source.uri}
                                </a>
                            ))}
                         </div>
                    </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start">
                 <div className="bg-slate-700 px-4 py-2 rounded-lg rounded-bl-none flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-slate-800 border-t border-slate-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about payments, access..."
                className="flex-grow bg-slate-900 border border-slate-600 rounded-full px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">AI can make mistakes. Please verify important info.</p>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-lg transition-all duration-300 ${
            isOpen ? 'bg-red-500 hover:bg-red-600 rotate-90' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isOpen ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        )}
      </button>
    </div>
  );
};