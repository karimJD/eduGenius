'use client';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Loader2,
  Sparkles,
} from 'lucide-react';
import axios from 'axios';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  selectedText?: string;
}

// ─── Custom Markdown Components ────────────────────────────────────────────────
const markdownComponents = {
  h1: ({ children }: any) => (
    <h1 className='summary-h1'>
      <span className='summary-h1-accent' />
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className='summary-h2'>
      <span className='summary-h2-number' />
      {children}
    </h2>
  ),
  h3: ({ children }: any) => <h3 className='summary-h3'>{children}</h3>,
  h4: ({ children }: any) => <h4 className='summary-h4'>{children}</h4>,
  p: ({ children }: any) => <p className='summary-p'>{children}</p>,
  strong: ({ children }: any) => (
    <strong className='summary-strong'>{children}</strong>
  ),
  em: ({ children }: any) => <em className='summary-em'>{children}</em>,
  ul: ({ children }: any) => <ul className='summary-ul'>{children}</ul>,
  ol: ({ children }: any) => <ol className='summary-ol'>{children}</ol>,
  li: ({ children }: any) => (
    <li className='summary-li'>
      <span className='summary-li-dot' />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className='summary-blockquote'>{children}</blockquote>
  ),
  code: ({ inline, children }: any) =>
    inline ? (
      <code className='summary-code-inline'>{children}</code>
    ) : (
      <pre className='summary-code-block'>
        <code>{children}</code>
      </pre>
    ),
  hr: () => <hr className='summary-hr' />,
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function SummaryViewer({
  summary,
  onClose,
}: {
  summary: any;
  onClose: () => void;
}) {
  const [selectedText, setSelectedText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAskButton, setShowAskButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (
        !selection ||
        selection.isCollapsed ||
        !contentRef.current?.contains(selection.anchorNode)
      ) {
        setShowAskButton(false);
        return;
      }
      const text = selection.toString().trim();
      if (text) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setButtonPosition({
          top: rect.top - 48,
          left: rect.left + rect.width / 2,
        });
        setShowAskButton(true);
      }
    };
    document.addEventListener('selectionchange', handleSelection);
    return () =>
      document.removeEventListener('selectionchange', handleSelection);
  }, [isLoading]);

  const handleAskAboutSelection = () => {
    setShowAskButton(false);
    setInput(`Peux-tu m'expliquer cette partie : "${selectedText}" ?`);
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedText) return;
    const currentSelection = selectedText;
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      selectedText: currentSelection,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setShowAskButton(false);

    try {
      const response = await axios.post(
        '/api/student/ai/explain-text',
        {
          selectedText: currentSelection || 'Le résumé en entier',
          userQuestion: input || "Peux-tu m'expliquer ceci ?",
          summaryContext: summary.content,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        },
      );
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          content: response.data.data,
        },
      ]);
      if (currentSelection) {
        setSelectedText('');
        window.getSelection()?.removeAllRanges();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          content:
            "Désolé, une erreur s'est produite lors de la génération de l'explication.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ── Injected styles ─────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap');

        /* ── Layout ── */
        .sv-root {
          display: flex;
          height: calc(100vh - 140px);
          gap: 20px;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Main Panel ── */
        .sv-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 20px;
          border: 1px solid #e8e0f0;
          background: #fdfcff;
          box-shadow: 0 4px 24px rgba(110, 60, 180, 0.06);
          position: relative;
        }
        .dark .sv-main {
          background: #0e0b14;
          border-color: #2a2040;
          box-shadow: 0 4px 32px rgba(0,0,0,0.4);
        }

        /* ── Header ── */
        .sv-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid #ede8f5;
          background: rgba(253,252,255,0.85);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .dark .sv-header {
          background: rgba(14,11,20,0.85);
          border-bottom-color: #2a2040;
        }
        .sv-back-btn {
          width: 34px; height: 34px;
          border-radius: 50%;
          border: 1px solid #e0d8f0;
          background: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: #6b5b95;
        }
        .sv-back-btn:hover { background: #f3eeff; border-color: #b39ddb; transform: translateX(-2px); }
        .dark .sv-back-btn { background: #1a1428; border-color: #3d2f60; color: #b39ddb; }
        .dark .sv-back-btn:hover { background: #2a1f45; }

        .sv-title {
          font-family: 'Lora', Georgia, serif;
          font-size: 17px;
          font-weight: 600;
          color: #2d1f4e;
          margin: 0 0 0 12px;
        }
        .dark .sv-title { color: #e8deff; }

        .sv-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 20px;
          background: linear-gradient(135deg, #ede8ff, #fce8ff);
          color: #7c3aed;
          border: 1px solid #ddd0ff;
        }
        .dark .sv-badge { background: linear-gradient(135deg, #2d1f4e40, #3d0f6040); color: #c084fc; border-color: #4c2a7a; }

        /* ── Content area ── */
        .sv-content {
          flex: 1;
          overflow-y: auto;
          padding: 48px 64px;
          scroll-behavior: smooth;
        }
        .sv-content::-webkit-scrollbar { width: 6px; }
        .sv-content::-webkit-scrollbar-track { background: transparent; }
        .sv-content::-webkit-scrollbar-thumb { background: #d0c0f0; border-radius: 3px; }
        .dark .sv-content::-webkit-scrollbar-thumb { background: #3d2f60; }

        /* ── Floating ask button ── */
        .sv-ask-btn {
          position: fixed;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: white;
          border: none;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(124,58,237,0.4);
          transform: translateX(-50%);
          transition: all 0.2s;
          animation: popIn 0.15s ease-out;
        }
        .sv-ask-btn:hover { transform: translateX(-50%) scale(1.05); box-shadow: 0 8px 28px rgba(124,58,237,0.5); }
        @keyframes popIn {
          from { opacity: 0; transform: translateX(-50%) scale(0.85); }
          to   { opacity: 1; transform: translateX(-50%) scale(1); }
        }

        /* ════════════════════════════════════════
           MARKDOWN TYPOGRAPHY
        ════════════════════════════════════════ */

        /* Opening paragraph style — detect first p after nothing */
        .sv-content > *:first-child.summary-p {
          font-size: 17px;
          color: #7c5cbf;
          font-style: italic;
          border-left: 3px solid #c4b5fd;
          padding-left: 16px;
          margin-bottom: 32px;
        }
        .dark .sv-content > *:first-child.summary-p { color: #a78bfa; }

        .summary-h1 {
          font-family: 'Lora', Georgia, serif;
          font-size: 32px;
          font-weight: 700;
          color: #1e0f3c;
          margin: 0 0 28px;
          line-height: 1.25;
          position: relative;
          padding-bottom: 16px;
        }
        .summary-h1::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 56px; height: 3px;
          background: linear-gradient(90deg, #7c3aed, #c084fc);
          border-radius: 2px;
        }
        .dark .summary-h1 { color: #f0e8ff; }

        .summary-h2 {
          font-family: 'Lora', Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          color: #2d1f4e;
          margin: 48px 0 16px;
          line-height: 1.3;
          display: flex;
          align-items: center;
          gap: 12px;
          counter-increment: h2-counter;
        }
        .summary-h2::before {
          content: counter(h2-counter, decimal-leading-zero);
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }
        .dark .summary-h2 { color: #ddd0ff; }

        .sv-content { counter-reset: h2-counter; }

        .summary-h3 {
          font-family: 'DM Sans', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #4c2a7a;
          margin: 32px 0 10px;
          padding-left: 14px;
          border-left: 3px solid #c084fc;
          line-height: 1.4;
        }
        .dark .summary-h3 { color: #c4b5fd; border-left-color: #7c3aed; }

        .summary-h4 {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #6d3fa0;
          margin: 24px 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .dark .summary-h4 { color: #a78bfa; }

        .summary-p {
          font-family: 'Lora', Georgia, serif;
          font-size: 16px;
          line-height: 1.9;
          color: #3a3050;
          margin: 0 0 20px;
        }
        .dark .summary-p { color: #c4b8e0; }

        .summary-strong {
          font-weight: 700;
          color: #5b2d9e;
          background: linear-gradient(120deg, #f3e8ff 0%, #ede9fe 100%);
          padding: 1px 5px;
          border-radius: 4px;
        }
        .dark .summary-strong { color: #ddd0ff; background: rgba(124,58,237,0.2); }

        .summary-em {
          font-style: italic;
          color: #7c5cbf;
        }
        .dark .summary-em { color: #a78bfa; }

        .summary-ul, .summary-ol {
          margin: 4px 0 20px;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .summary-li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-family: 'Lora', Georgia, serif;
          font-size: 15.5px;
          line-height: 1.75;
          color: #3a3050;
          background: linear-gradient(135deg, #faf8ff, #f7f3ff);
          border: 1px solid #eee8ff;
          border-radius: 10px;
          padding: 10px 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .summary-li:hover { border-color: #c4b5fd; box-shadow: 0 2px 12px rgba(124,58,237,0.08); }
        .dark .summary-li { color: #c4b8e0; background: linear-gradient(135deg, #1a1428, #1e1630); border-color: #2a2040; }
        .dark .summary-li:hover { border-color: #4c2a7a; }

        .summary-li-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          flex-shrink: 0;
          margin-top: 9px;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
        }

        .summary-blockquote {
          margin: 28px 0;
          padding: 20px 24px 20px 28px;
          background: linear-gradient(135deg, #faf5ff, #f5f0ff);
          border-left: 4px solid #7c3aed;
          border-radius: 0 12px 12px 0;
          font-family: 'Lora', serif;
          font-style: italic;
          font-size: 16px;
          color: #4c2a7a;
          position: relative;
        }
        .summary-blockquote::before {
          content: '"';
          position: absolute;
          top: -8px; left: 16px;
          font-size: 60px;
          color: #c4b5fd;
          font-family: Georgia, serif;
          line-height: 1;
        }
        .dark .summary-blockquote { background: linear-gradient(135deg, #1a1428, #1e1630); color: #c084fc; }

        .summary-code-inline {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          background: #f0ebff;
          color: #6d28d9;
          padding: 2px 7px;
          border-radius: 5px;
          border: 1px solid #ddd0ff;
        }
        .dark .summary-code-inline { background: #2a1f45; color: #c084fc; border-color: #3d2f60; }

        .summary-code-block {
          background: #1a1428;
          color: #e0d4ff;
          padding: 20px 24px;
          border-radius: 12px;
          overflow-x: auto;
          font-size: 13px;
          margin: 20px 0;
          border: 1px solid #2a2040;
        }

        .summary-hr {
          border: none;
          height: 1px;
          background: linear-gradient(90deg, transparent, #c4b5fd, transparent);
          margin: 40px 0;
        }

        /* ── Chat Sidebar ── */
        .sv-chat {
          width: 360px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          border: 1px solid #e8e0f0;
          background: #fdfcff;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(110, 60, 180, 0.06);
        }
        .dark .sv-chat { background: #0e0b14; border-color: #2a2040; }

        .sv-chat-header {
          padding: 16px 20px;
          border-bottom: 1px solid #ede8f5;
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #faf5ff, #f5f0ff);
        }
        .dark .sv-chat-header { background: linear-gradient(135deg, #1a1030, #150e25); border-bottom-color: #2a2040; }

        .sv-chat-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(124,58,237,0.3);
        }

        .sv-chat-title {
          font-weight: 600;
          font-size: 14px;
          color: #2d1f4e;
          margin: 0;
        }
        .dark .sv-chat-title { color: #e8deff; }
        .sv-chat-subtitle {
          font-size: 11px;
          color: #9580c0;
          margin: 0;
        }

        .sv-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #f8f5ff;
        }
        .dark .sv-messages { background: #080610; }
        .sv-messages::-webkit-scrollbar { width: 4px; }
        .sv-messages::-webkit-scrollbar-thumb { background: #d0c0f0; border-radius: 2px; }
        .dark .sv-messages::-webkit-scrollbar-thumb { background: #2a2040; }

        .sv-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 12px;
          text-align: center;
          opacity: 0.6;
        }
        .sv-empty-icon {
          width: 52px; height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, #ede8ff, #fce8ff);
          display: flex; align-items: center; justify-content: center;
        }
        .sv-empty p {
          font-size: 13px;
          color: #9580c0;
          max-width: 180px;
          line-height: 1.6;
          margin: 0;
        }

        .sv-msg-row { display: flex; gap: 8px; align-items: flex-end; }
        .sv-msg-row.user { flex-direction: row-reverse; }

        .sv-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sv-avatar.ai { background: linear-gradient(135deg, #7c3aed, #a855f7); }
        .sv-avatar.user { background: linear-gradient(135deg, #2563eb, #3b82f6); }

        .sv-bubble-wrap { display: flex; flex-direction: column; max-width: 82%; }
        .sv-msg-row.user .sv-bubble-wrap { align-items: flex-end; }

        .sv-selected-preview {
          font-size: 11px;
          font-style: italic;
          color: #7c5cbf;
          background: #f0eaff;
          border-left: 3px solid #a855f7;
          padding: 5px 9px;
          border-radius: 6px;
          margin-bottom: 5px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .dark .sv-selected-preview { background: #2a1f45; color: #c084fc; }

        .sv-bubble {
          padding: 10px 14px;
          font-size: 13.5px;
          line-height: 1.65;
          border-radius: 16px;
        }
        .sv-bubble.ai {
          background: white;
          border: 1px solid #ede8f5;
          color: #2d1f4e;
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .dark .sv-bubble.ai { background: #1a1428; border-color: #2a2040; color: #d4c8f0; }
        .sv-bubble.user {
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 12px rgba(124,58,237,0.3);
        }

        /* prose inside ai bubble */
        .sv-bubble.ai h1,.sv-bubble.ai h2,.sv-bubble.ai h3 { font-size: 14px; font-weight: 700; margin: 8px 0 4px; color: #4c2a7a; }
        .dark .sv-bubble.ai h1,.dark .sv-bubble.ai h2,.dark .sv-bubble.ai h3 { color: #c4b5fd; }
        .sv-bubble.ai p { margin: 0 0 6px; }
        .sv-bubble.ai ul { padding-left: 16px; margin: 4px 0; }
        .sv-bubble.ai li { margin-bottom: 3px; }
        .sv-bubble.ai strong { color: #6d28d9; }
        .dark .sv-bubble.ai strong { color: #c084fc; }

        .sv-typing {
          display: flex; gap: 4px; align-items: center; padding: 4px 2px;
        }
        .sv-typing span {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #a855f7;
          animation: bounce 1.2s infinite;
        }
        .sv-typing span:nth-child(2) { animation-delay: 0.2s; }
        .sv-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%,60%,100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }

        /* ── Input area ── */
        .sv-input-area {
          padding: 14px 16px;
          border-top: 1px solid #ede8f5;
          background: #fdfcff;
        }
        .dark .sv-input-area { background: #0e0b14; border-top-color: #2a2040; }

        .sv-selection-chip {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          background: linear-gradient(135deg, #f5f0ff, #faf5ff);
          border: 1px solid #d4b8ff;
          border-radius: 10px;
          padding: 8px 12px;
          margin-bottom: 10px;
        }
        .dark .sv-selection-chip { background: linear-gradient(135deg, #1a1428, #1e1630); border-color: #3d2f60; }
        .sv-selection-chip-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #7c3aed;
          display: block;
          margin-bottom: 2px;
        }
        .dark .sv-selection-chip-label { color: #a855f7; }
        .sv-selection-chip-text {
          font-size: 11.5px;
          font-style: italic;
          color: #4c2a7a;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .dark .sv-selection-chip-text { color: #c084fc; }
        .sv-chip-close {
          background: none; border: none; cursor: pointer;
          color: #9580c0; padding: 0; flex-shrink: 0;
          display: flex; align-items: center;
        }
        .sv-chip-close:hover { color: #6d28d9; }

        .sv-input-row { display: flex; gap: 8px; align-items: flex-end; }
        .sv-input {
          flex: 1;
          background: #f3eeff;
          border: 1px solid #e0d4ff;
          color: #2d1f4e;
          border-radius: 14px;
          padding: 11px 16px;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          resize: none;
        }
        .sv-input:focus { border-color: #9333ea; box-shadow: 0 0 0 3px rgba(147,51,234,0.12); }
        .dark .sv-input { background: #1a1428; border-color: #2a2040; color: #e0d4ff; }
        .dark .sv-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.2); }
        .sv-input::placeholder { color: #b39ddb; }

        .sv-send-btn {
          width: 42px; height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          border: none;
          color: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(124,58,237,0.35);
        }
        .sv-send-btn:hover:not(:disabled) { transform: scale(1.06); box-shadow: 0 6px 16px rgba(124,58,237,0.45); }
        .sv-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div className='sv-root'>
        {/* ── Main Summary Panel ────────────────────────────────────────────── */}
        <div className='sv-main'>
          {/* Header */}
          <div className='sv-header'>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button className='sv-back-btn' onClick={onClose}>
                <ArrowLeft size={15} />
              </button>
              <h2 className='sv-title'>{summary.title || 'Résumé IA'}</h2>
            </div>
            <span className='sv-badge'>
              {summary.aiGenerationParams?.difficulty || 'Standard'}
            </span>
          </div>

          {/* Content */}
          <div className='sv-content' ref={contentRef}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {summary.content}
            </ReactMarkdown>
          </div>

          {/* Floating Ask Button */}
          {showAskButton && (
            <button
              className='sv-ask-btn'
              onClick={handleAskAboutSelection}
              style={{
                top: `${Math.max(80, buttonPosition.top)}px`,
                left: `${buttonPosition.left}px`,
              }}
            >
              <Sparkles size={13} />
              Expliquer avec l'IA
            </button>
          )}
        </div>

        {/* ── Chat Sidebar ──────────────────────────────────────────────────── */}
        <div className='sv-chat'>
          {/* Chat Header */}
          <div className='sv-chat-header'>
            <div className='sv-chat-icon'>
              <Bot size={16} color='white' />
            </div>
            <div>
              <p className='sv-chat-title'>Assistant IA</p>
              <p className='sv-chat-subtitle'>
                Sélectionnez du texte pour poser une question
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className='sv-messages'>
            {messages.length === 0 ? (
              <div className='sv-empty'>
                <div className='sv-empty-icon'>
                  <MessageSquare size={22} color='#9333ea' />
                </div>
                <p>
                  Sélectionnez du texte dans le résumé ou écrivez directement
                  ici.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`sv-msg-row ${msg.sender}`}>
                  <div className={`sv-avatar ${msg.sender}`}>
                    {msg.sender === 'user' ? (
                      <User size={13} color='white' />
                    ) : (
                      <Bot size={13} color='white' />
                    )}
                  </div>
                  <div className='sv-bubble-wrap'>
                    {msg.selectedText && (
                      <div className='sv-selected-preview'>
                        "{msg.selectedText}"
                      </div>
                    )}
                    <div className={`sv-bubble ${msg.sender}`}>
                      {msg.sender === 'ai' ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className='sv-msg-row'>
                <div className='sv-avatar ai'>
                  <Bot size={13} color='white' />
                </div>
                <div className='sv-bubble ai' style={{ padding: '12px 16px' }}>
                  <div className='sv-typing'>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className='sv-input-area'>
            {selectedText && !isLoading && (
              <div className='sv-selection-chip'>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className='sv-selection-chip-label'>
                    Texte sélectionné
                  </span>
                  <span className='sv-selection-chip-text'>
                    "{selectedText}"
                  </span>
                </div>
                <button
                  className='sv-chip-close'
                  onClick={() => setSelectedText('')}
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className='sv-input-row'>
              <input
                type='text'
                className='sv-input'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  selectedText
                    ? 'Posez une question sur ce texte...'
                    : "Discuter avec l'IA..."
                }
              />
              <button
                className='sv-send-btn'
                onClick={handleSendMessage}
                disabled={isLoading || (!input.trim() && !selectedText)}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
