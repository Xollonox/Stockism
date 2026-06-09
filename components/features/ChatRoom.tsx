import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, formatTime } from '../../services/firebase';
import { Button } from '../ui/Button';
import { useSound } from '../../hooks/useSound';

const TENOR_KEY = 'AIzaSyC8GUPFWDDqg1Z5rFGWQtW9sV2T9s7qTcM';

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

const TRENDING_TAGS = ['lookism', 'anime', 'fighting', 'pog', 'lol', 'wow', 'sad', 'fire'];

export const ChatRoom: React.FC<ChatRoomProps> = ({ uid, username }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [gifTab, setGifTab] = useState<'search' | 'trending'>('trending');
  const [gifLoading, setGifLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);
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

  // Load trending GIFs on mount
  useEffect(() => {
    fetchTrendingGifs();
  }, []);

  const fetchTrendingGifs = async () => {
    setGifLoading(true);
    try {
      const res = await fetch(`https://tenor.googleapis.com/v2/featured?key=${TENOR_KEY}&limit=20`);
      const data = await res.json();
      setGifs(data.results || []);
    } catch {} finally { setGifLoading(false); }
  };

  // Search GIFs via Tenor
  useEffect(() => {
    if (!gifSearch.trim()) { 
      if (gifTab === 'trending') fetchTrendingGifs();
      return; 
    }
    setGifLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(gifSearch)}&key=${TENOR_KEY}&limit=20`
        );
        const data = await res.json();
        setGifs(data.results || []);
      } catch {} finally { setGifLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [gifSearch]);

  const handleSend = async (gifUrl?: string) => {
    if ((!input.trim() && !gifUrl) || !uid || !username) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'chat'), {
        uid, username,
        text: input.trim(),
        gif: gifUrl || '',
        createdAt: serverTimestamp(),
      });
      setInput('');
      setShowGifPicker(false);
      setGifSearch('');
      sounds.success();
    } catch { sounds.error(); } finally { setSending(false); }
  };

  const getGifUrl = (gif: any, size: 'small' | 'medium' = 'medium') => {
    const fm = gif.media_formats || {};
    if (size === 'small') return fm.tinygif?.url || fm.nanogif?.url || fm.gif?.url;
    return fm.gif?.url || fm.tinygif?.url || '';
  };

  return (
    <div className="flex flex-col premium-card rounded-xl overflow-hidden border border-white/5" style={{ height: 'calc(100vh - 220px)', minHeight: '500px', maxHeight: '750px' }}>
      {/* ===== HEADER ===== */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-black/40 shrink-0 relative">
        <div className="laser-sweep" />
        <div className="relative flex w-3 h-3">
          <span className="animate-ping absolute inset-0 rounded-full bg-brand opacity-60" />
          <span className="relative rounded-full w-3 h-3 bg-brand shadow-[0_0_10px_var(--color-brand)]" />
        </div>
        <div>
          <span className="text-sm font-heading font-black text-white uppercase tracking-wider">General Chat</span>
          <span className="text-[8px] font-mono text-muted/50 ml-3">{messages.length} msgs</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[8px] font-mono text-muted/30 hidden sm:block">online</span>
          <div className="w-1.5 h-1.5 bg-good rounded-full animate-pulse shadow-[0_0_6px_var(--color-good)]" />
        </div>
      </div>

      {/* ===== MESSAGES ===== */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-black/20">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted/30">
            <div className="text-5xl mb-4 opacity-20">💬</div>
            <div className="font-heading text-sm uppercase tracking-widest">No messages yet</div>
            <div className="text-[9px] font-mono mt-2 text-muted/20">Be the first to speak</div>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.uid === uid;
          const showAvatar = i === 0 || messages[i - 1]?.uid !== msg.uid;
          return (
            <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : ''} animate-fade-in-up`} style={{ animationDelay: `${Math.min(i * 0.02, 0.5)}s` }}>
              {/* Avatar */}
              {showAvatar && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-heading font-black uppercase shrink-0 ${isMe ? 'bg-brand/20 text-brand border border-brand/30' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                  {isMe ? (username || 'U')[0] : (msg.username || '?')[0]}
                </div>
              )}
              {!showAvatar && <div className="w-8 shrink-0" />}

              {/* Bubble */}
              <div className={`max-w-[85%] md:max-w-[70%] ${isMe ? 'order-1' : 'order-1'}`}>
                {showAvatar && (
                  <div className={`text-[9px] font-mono font-bold mb-1 px-1 ${isMe ? 'text-brand text-right' : 'text-cyan-400/80'}`}>
                    {isMe ? 'You' : msg.username}
                  </div>
                )}
                <div className={`relative p-3.5 rounded-xl border backdrop-blur-md ${
                  isMe 
                    ? 'bg-brand/10 border-brand/20 rounded-tr-sm' 
                    : 'bg-white/[0.03] border-white/5 rounded-tl-sm'
                }`}>
                  {/* Time */}
                  <div className={`absolute -bottom-4 ${isMe ? 'right-0' : 'left-0'} text-[7px] font-mono text-muted/30 whitespace-nowrap`}>
                    {formatTime(msg.createdAt)}
                  </div>
                  
                  {msg.text && <p className="text-xs font-mono text-white/80 leading-relaxed">{msg.text}</p>}
                  {msg.gif && (
                    <div className={`${msg.text ? 'mt-2' : ''} rounded-lg overflow-hidden border border-white/5 bg-black/40`}>
                      <img src={msg.gif} alt="" className="w-full max-h-48 object-cover" loading="lazy" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== GIF PICKER ===== */}
      {showGifPicker && (
        <div className="border-t border-white/5 bg-black/60 backdrop-blur-xl animate-slide-up">
          {/* Tabs */}
          <div className="flex gap-1 px-4 pt-3">
            <button onClick={() => { setGifTab('trending'); setGifSearch(''); fetchTrendingGifs(); }} 
              className={`px-4 py-1.5 text-[9px] font-heading font-black uppercase tracking-widest rounded-t-sm transition-all ${gifTab === 'trending' ? 'bg-brand/20 text-brand border-b-2 border-brand' : 'text-muted/40 hover:text-white'}`}>
              🔥 Trending
            </button>
            <button onClick={() => { setGifTab('search'); setTimeout(() => gifInputRef.current?.focus(), 100); }} 
              className={`px-4 py-1.5 text-[9px] font-heading font-black uppercase tracking-widest rounded-t-sm transition-all ${gifTab === 'search' ? 'bg-brand/20 text-brand border-b-2 border-brand' : 'text-muted/40 hover:text-white'}`}>
              🔍 Search
            </button>
          </div>

          <div className="p-3">
            {gifTab === 'search' && (
              <div className="relative mb-3">
                <input
                  ref={gifInputRef}
                  value={gifSearch}
                  onChange={e => setGifSearch(e.target.value)}
                  placeholder="Search GIFs..."
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-2.5 text-xs font-mono text-white placeholder-muted/30 focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/20 transition-all pl-10"
                  autoFocus
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </div>
            )}

            {gifTab === 'trending' && !gifSearch && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 custom-scrollbar">
                {TRENDING_TAGS.map(tag => (
                  <button key={tag} onClick={() => { setGifSearch(tag); setGifTab('search'); }}
                    className="px-3 py-1 text-[9px] font-mono font-bold bg-white/5 border border-white/10 rounded-full hover:bg-brand/10 hover:border-brand/30 hover:text-brand whitespace-nowrap transition-all">
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* GIF Grid */}
            <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto custom-scrollbar">
              {gifLoading ? (
                <div className="col-span-4 flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              ) : gifs.length === 0 ? (
                <div className="col-span-4 text-[9px] font-mono text-muted/30 text-center py-8">
                  {gifSearch ? 'No GIFs found — try another search' : 'Loading...'}
                </div>
              ) : (
                gifs.slice(0, 8).map((gif: any) => (
                  <button
                    key={gif.id}
                    onClick={() => handleSend(getGifUrl(gif))}
                    className="aspect-square bg-black/40 rounded-lg overflow-hidden hover:ring-2 hover:ring-brand/70 hover:scale-[1.03] transition-all duration-200 active:scale-95 group relative"
                  >
                    <img src={getGifUrl(gif, 'small')} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-[7px] font-mono text-white/80">Send</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== INPUT BAR ===== */}
      <div className="flex gap-3 p-4 border-t border-white/5 bg-black/40 backdrop-blur-xl shrink-0">
        <button
          onClick={() => { setShowGifPicker(!showGifPicker); if (!showGifPicker) { setGifTab('trending'); fetchTrendingGifs(); } }}
          className={`px-4 py-2.5 rounded-lg text-xs font-heading font-black uppercase tracking-wider transition-all border ${
            showGifPicker 
              ? 'bg-brand/20 border-brand/40 text-brand shadow-[0_0_10px_rgba(225,29,72,0.15)]' 
              : 'bg-black/40 border-white/10 text-muted hover:border-brand/30 hover:text-white'
          }`}
          disabled={!uid}
        >
          GIF
        </button>
        <div className="relative flex-1">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={uid ? "Type a message..." : "Sign in to chat..."}
            className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder-muted/30 focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/20 transition-all"
            disabled={!uid}
          />
        </div>
        <Button onClick={() => handleSend()} disabled={(!input.trim() && !showGifPicker) || !uid || sending} 
          className="!py-2.5 !px-6 text-[9px] tracking-widest font-heading font-black rounded-lg">
          {sending ? (
            <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> SEND</span>
          ) : 'SEND'}
        </Button>
      </div>
    </div>
  );
};
