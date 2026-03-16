import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Languages, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, UserProfile } from '../types';
import { summarizeChat, translateText } from '../services/aiService';
import ReactMarkdown from 'react-markdown';

interface ChatOverlayProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  userProfile: UserProfile | null;
}

export function ChatOverlay({ messages, onSendMessage, userProfile }: ChatOverlayProps) {
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [targetLang, setTargetLang] = useState('English');
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isExpanded) scrollToBottom();
  }, [messages, isExpanded]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    const textList = messages.map(m => `${m.senderName}: ${m.text}`);
    const result = await summarizeChat(textList);
    setSummary(result);
    setIsSummarizing(false);
  };

  const handleTranslate = async (msgId: string, text: string) => {
    const result = await translateText(text, targetLang);
    setTranslatedMessages(prev => ({ ...prev, [msgId]: result }));
  };

  return (
    <div className="absolute bottom-6 left-6 w-full max-w-sm z-40 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        {/* AI Summary Panel */}
        <AnimatePresence>
          {summary && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-950/40 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-4 mb-2 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">AI Summary</span>
                <button onClick={() => setSummary(null)} className="ml-auto text-emerald-400/50 hover:text-emerald-400 text-xs">Dismiss</button>
              </div>
              <div className="text-xs text-emerald-50 leading-relaxed max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Box */}
        <div className={`bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl overflow-hidden transition-all duration-500 ${isExpanded ? 'h-[450px]' : 'h-14'}`}>
          <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-white">Live Dimension Chat</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="p-2 text-zinc-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
                title="Summarize Chat"
              >
                <Sparkles size={16} className={isSummarizing ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
              >
                {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>
          </div>

          {isExpanded && (
            <>
              <div className="flex-1 h-[320px] overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === userProfile?.uid ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{msg.senderName}</span>
                    </div>
                    <div className={`group relative max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.senderId === userProfile?.uid 
                        ? 'bg-white text-black rounded-tr-none' 
                        : 'bg-zinc-800 text-white rounded-tl-none'
                    }`}>
                      <p>{translatedMessages[msg.id] || msg.text}</p>
                      
                      {/* Translation Trigger */}
                      <button 
                        onClick={() => handleTranslate(msg.id, msg.text)}
                        className="absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800 border border-zinc-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Languages size={12} className="text-zinc-400" />
                      </button>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 bg-zinc-950/50 border-t border-zinc-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <select 
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="bg-transparent text-[10px] font-bold text-zinc-500 uppercase tracking-widest outline-none cursor-pointer hover:text-zinc-300"
                  >
                    <option value="English">English</option>
                    <option value="Hebrew">Hebrew</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                  <div className="h-[1px] flex-1 bg-zinc-800" />
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                  <button 
                    onClick={handleSend}
                    className="p-2 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all active:scale-90"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
