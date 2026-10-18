import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  ChatMessage,
  getStoredConversations,
  subscribeToChatUpdates,
  appendMessage,
} from '@/lib/chatService';

export const CustomerChatWidget = ({ defaultOrderId }: { defaultOrderId?: string }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const conversationId = user ? `conv_customer_${user.id}` : '';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const customerName = user?.fullName || user?.firstName || 'Customer';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const syncMessages = useCallback(async () => {
    if (!user?.id) {
      setMessages([]);
      return;
    }
    try {
      const convs = await getStoredConversations(true, user.id);
      const active = convs.find((c) => c.id === conversationId) || convs[0];
      if (active && active.messages) {
        setMessages(active.messages);
      }
    } catch (error) {
      console.error('Customer chat sync failed:', error);
    }
  }, [user]);

  useEffect(() => {
    syncMessages();
    const unsubscribe = subscribeToChatUpdates(() => {
      syncMessages();
    });
    // Realtime is used for low-latency updates, while polling guarantees
    // delivery when a tab or websocket temporarily goes offline.
    const refreshTimer = window.setInterval(() => {
      syncMessages();
    }, 4000);
    return () => {
      unsubscribe();
      window.clearInterval(refreshTimer);
    };
  }, [syncMessages]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');

    if (!user) return;
    try {
      await appendMessage(conversationId, 'customer', text, customerName, user.id);
      await syncMessages();
    } catch (error) {
      console.error('Customer chat send failed:', error);
      toast.error('Message could not be sent. Please try again.');
    }
  };

  return (
    <div className="fixed bottom-24 right-4 md:bottom-4 md:right-6 z-[100] flex flex-col items-end pointer-events-auto">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[calc(100vw-2rem)] max-w-sm sm:w-96 h-[460px] glass bg-background/95 backdrop-blur-2xl border border-[#186049]/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4 border-solid"
          >
            {/* Header */}
            <div className="p-4 border-b border-foreground/10 flex items-center justify-between bg-[#186049]/15">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#186049] text-white flex items-center justify-center font-bold shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">HAMAASH Support</div>
                  <div className="text-[10px] text-[#186049] font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#186049] animate-pulse" /> Store Owner Online
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-foreground/10 text-foreground/70 hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender_type === 'customer' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      msg.sender_type === 'customer'
                        ? 'bg-[#186049] text-white font-medium rounded-br-none'
                        : 'glass bg-foreground/10 text-foreground rounded-bl-none border border-foreground/10'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[9px] text-foreground/40 mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-700 bg-slate-900/90 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={user ? 'Ask owner a question...' : 'Sign in to chat with the owner'}
                disabled={!user}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-full h-10 px-4 text-xs text-white font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#186049]"
              />
              <button
                onClick={handleSend}
                disabled={!user || !inputText.trim()}
                className="w-10 h-10 rounded-full bg-[#186049] text-white flex items-center justify-center shadow-md disabled:opacity-40 hover:bg-[#0f3d2c] hover:scale-105 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-[#186049] text-white flex items-center justify-center shadow-2xl hover:bg-[#0f3d2c] hover:scale-110 active:scale-95 transition-all relative border border-[#186049]/40"
      >
        <MessageSquare className="w-6 h-6 text-white" />
        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#186049] rounded-full border-2 border-background animate-pulse" />
      </button>
    </div>
  );
};
