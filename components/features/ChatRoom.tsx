import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, formatTime } from '../../services/firebase';
import { Button } from '../ui/Button';
import { useSound } from '../../hooks/useSound';

// GIF API — uses Tenor free tier (no key needed for basic)
const TENOR_PROXY = 'https://tenor.googleapis.com/v2';
const TENOR_KEY = 'AIzaSyC8GUPFWDDqg1Z5rFGWQtW9sV2T9s7qTcM'; // public demo key

interface ChatMessage {
  id: string;
  uid: string;
  username: string;
  text: string;
  gif?: string;
  createdAt: any;
}

interface ChatRoomProps {
  uid?: string;
  username?: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ uid, username }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sounds = useSound();

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'chat'), orderBy('createdAt', 'desc'), limit(50)),
      (snap) => {
        const msgs: ChatMessage[] = [];
        snap.forEach(d => msgs.push({ id: d.id, ...d.data() } as ChatMessage));
        setMessages(msgs.reverse());
      }
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Search GIFs via Tenor
  useEffect(() => {
    if (!gifSearch.trim()) { setGifs([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `${TENOR_PROXY}/search?q=${encodeURIComponent(gifSearch)}&key=${TENOR_KEY}&limit=12`
        );
        const data = await res.json();
        setGifs(data.results || []);
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [gifSearch]);

  const handleSend = async (gifUrl?: string) => {
    if ((!input.trim() && !gifUrl) || !uid || !username) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'chat'), {
        uid,
        username,
        text: input.trim(),
        gif: gifUrl || '',
        createdAt: serverTimestamp(),
      });
      setInput('');
      setShowGifPicker(false);
      sounds.success();
    } catch (e) {
      sounds.error();
    } finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-[600px] premium-card rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-black/30">
        <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
        <span className="text-xs font-heading font-black text-white uppercase tracking-wider">General Chat</span>
        <span className="text-[8px] font-mono text-muted/50 ml-auto">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/10">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted/30 font-mono text-xs uppercase tracking-widest">
            No messages yet. Say something!
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.uid === uid ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            <div className={`max-w-[80%] ${msg.uid === uid ? 'bg-brand/10 border-brand/20' : 'bg-white/5 border-white/10'} border rounded-lg p-3`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-mono font-bold ${msg.uid === uid ? 'text-brand' : 'text-cyan-400'}`}>
                  {msg.uid === uid ? 'You' : msg.username}
                </span>
                <span className="text-[8px] font-mono text-muted/30">{formatTime(msg.createdAt)}</span>
              </div>
              {msg.text && <p className="text-xs font-mono text-white/80 leading-relaxed">{msg.text}</p>}
              {msg.gif && (
                <img src={msg.gif} alt="gif" className="rounded-md mt-2 max-h-40 w-full object-cover" loading="lazy" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* GIF Picker */}
      {showGifPicker && (
        <div className="border-t border-white/5 bg-black/60 p-3 max-h-48 overflow-y-auto">
          <input
            value={gifSearch}
            onChange={e => setGifSearch(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full bg-black/60 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white mb-2 focus:border-brand/50 focus:outline-none"
            autoFocus
          />
          <div className="grid grid-cols-4 gap-2">
            {gifs.map((gif: any) => (
              <button key={gif.id} onClick={() => handleSend(gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url)} className="aspect-video bg-black/40 rounded overflow-hidden hover:ring-2 hover:ring-brand transition-all">
                <img src={gif.media_formats?.tinygif?.url || ''} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
            {gifSearch && gifs.length === 0 && <div className="col-span-4 text-[9px] font-mono text-muted/40 text-center py-4">Search for GIFs...</div>}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-white/5 bg-black/30">
        <button
          onClick={() => setShowGifPicker(!showGifPicker)}
          className={`px-3 py-2 rounded text-sm transition-all ${showGifPicker ? 'bg-brand/20 text-brand' : 'bg-white/5 text-muted hover:text-white'}`}
          title="GIF"
        >
          GIF
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message..."
          className="flex-1 bg-black/60 border border-white/10 rounded px-4 py-2 text-xs font-mono text-white focus:border-brand/50 focus:outline-none"
          disabled={!uid}
        />
        <Button onClick={() => handleSend()} disabled={!input.trim() || !uid || sending} className="!py-2 !px-4 text-[9px] tracking-widest font-heading font-black">
          SEND
        </Button>
      </div>
    </div>
  );
};
