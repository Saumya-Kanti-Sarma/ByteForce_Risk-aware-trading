import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './ChatBot.module.css';

interface StockMetrics {
  ticker: string;
  timestamp: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  risk_level: string;
  reason: string;
}

interface ApiResponse {
  data: StockMetrics | Record<string, never>;
  final_verdic: string;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  data?: StockMetrics;
  time: string;
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "System Online. Ask me about a ticker (e.g., 'Analyze RELIANCE') or just say hello.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleFetch = async () => {
    if (!input.trim() || loading) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input, time: userTime };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post<ApiResponse>('http://127.0.0.1:5001/api/chat', {
        question: currentInput
      });

      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.final_verdic,
        data: Object.keys(data.data).length > 0 ? (data.data as StockMetrics) : undefined,
        time: botTime
      };
      console.log(data);
      console.log(botMsg);

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "Cannot Load message... :(",
        time: userTime
      };
      setMessages(prev => [...prev, errorMsg]);
      console.log(errorMsg);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.appContainer}>
      <div className={styles.chatWrapper}>
        <header className={styles.chatHeader}>
          <div className={styles.statusDot} style={{ background: loading ? '#ff9f43' : '#28c76f' }}></div>
          <div>
            <h2>Quant-Agent v2.1</h2>
            <small className={styles.subtitle}>Market Simulation Mode</small>
          </div>
        </header>

        <main className={styles.messageArea}>
          {messages.map((msg) => (
            <div key={msg.id} className={msg.sender === 'user' ? styles.userRow : styles.botRow}>
              <div className={msg.sender === 'user' ? styles.userMessage : styles.botMessage}>

                {/* Render Technical Card if data exists */}
                {msg.data && (
                  <div className={styles.dataCard}>
                    <div className={styles.cardHeader}>
                      <span className={styles.tickerBadge}>{msg.data.ticker}</span>
                      <span className={styles.riskBadge}>{msg.data.risk_level}</span>
                    </div>
                    <div className={styles.statsGrid}>
                      <div><label>Action</label><span className={styles.actionText}>{msg.data.action}</span></div>
                      <div><label>Conf.</label><span>{(msg.data.confidence * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>
                )}

                <p>{msg.text}</p>
                <span className={styles.timestamp}>{msg.time}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div className={styles.botRow}>
              <div className={styles.loadingPulse}>
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </main>

        <footer className={styles.inputArea}>
          <input
            type="text"
            className={styles.chatInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a ticker..."
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          />
          <button className={styles.sendBtn} onClick={handleFetch} disabled={loading}>
            {loading ? "..." : "Send"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ChatBot;