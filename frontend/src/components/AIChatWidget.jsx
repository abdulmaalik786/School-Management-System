import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  ChevronRight,
  Zap
} from 'lucide-react';

const getQuickPrompts = (role) => {
  switch (role) {
    case 'Principal':
    case 'Super Admin':
    case 'School Admin':
      return [
        { label: '📊 School Census Overview', text: 'Give me a quick summary of total students and staff.' },
        { label: '💳 Fee Collection Status', text: 'How do I check overall fee collections and overdue invoices?' },
        { label: '📋 Daily Attendance Summary', text: 'Where can I see today’s attendance percentages?' },
        { label: '🎯 Exam Results & Cards', text: 'How do I generate and print student report cards?' }
      ];
    case 'Teacher':
      return [
        { label: '📝 How to Enter Marks?', text: 'Where do I record subject marks for my class?' },
        { label: '⏰ My Teaching Timetable', text: 'How can I check my scheduled class periods?' },
        { label: '📋 Mark Daily Attendance', text: 'How do I mark student attendance for today?' },
        { label: '📚 Post New Assignment', text: 'Where do I upload homework for my class?' }
      ];
    case 'Accountant':
      return [
        { label: '🧾 Generate Invoices', text: 'How do I create monthly fee invoices in bulk?' },
        { label: '💸 Record Fee Payment', text: 'How do I process a student cash or online fee payment?' },
        { label: '⚠️ Overdue Invoices', text: 'Where can I view students with overdue fee balances?' },
        { label: '📄 Printable Receipt', text: 'How do I issue a payment receipt?' }
      ];
    case 'Student':
      return [
        { label: '📊 View Exam Grades', text: 'Where can I see my latest exam marks and report card?' },
        { label: '📅 Class Timetable', text: 'How do I view my daily class schedule?' },
        { label: '📚 My Homework & Assignments', text: 'Where do I submit my completed homework?' },
        { label: '💳 My Fee Invoices', text: 'How can I view my fee statements and receipts?' }
      ];
    case 'Parent':
      return [
        { label: '👦 Child Progress', text: 'Where can I view my child’s grades and attendance?' },
        { label: '💳 Pay School Fees', text: 'How do I check fee due dates and payment receipts?' },
        { label: '🚌 Bus Route Details', text: 'Where do I view transport routes and stops?' }
      ];
    default:
      return [
        { label: '📖 Library Books', text: 'How do I check available books in the library?' },
        { label: '📢 Notice Board', text: 'Where can I read official school announcements?' },
        { label: '📅 School Events Calendar', text: 'What upcoming events are on the calendar?' }
      ];
  }
};

const getAssistantResponse = (text, user) => {
  const q = text.toLowerCase();

  if (q.includes('fee') || q.includes('invoice') || q.includes('payment') || q.includes('collect')) {
    return {
      text: `Hello ${user?.full_name || ''}! You can manage all fee structures, bulk monthly invoices, and payment receipts under **Fee Management**.`,
      action: { label: 'Open Fee Management', path: '/fees' }
    };
  }

  if (q.includes('mark') || q.includes('exam') || q.includes('grade') || q.includes('report card') || q.includes('result')) {
    return {
      text: `Exam schedules, mark range validations, grade algorithms (A+, A, B, C, F), and printable report cards are managed in **Exams** and **Results & Cards**.`,
      action: { label: 'Go to Exam Results', path: '/results' }
    };
  }

  if (q.includes('attendance') || q.includes('roll call') || q.includes('absent')) {
    return {
      text: `Daily roll calls for students can be submitted under **Student Attendance**. Teachers and staff can also log daily check-ins under **Teacher Attendance**.`,
      action: { label: 'Open Student Attendance', path: '/attendance' }
    };
  }

  if (q.includes('timetable') || q.includes('period') || q.includes('schedule')) {
    return {
      text: `The automated conflict-free timetable matrix for all classes, teachers, and rooms is located under **Timetable**.`,
      action: { label: 'View Timetable', path: '/timetable' }
    };
  }

  if (q.includes('assignment') || q.includes('homework') || q.includes('submit')) {
    return {
      text: `Teachers can publish homework with attachments, and students can view & submit solutions directly in **Assignments**.`,
      action: { label: 'Go to Assignments', path: '/assignments' }
    };
  }

  if (q.includes('student') || q.includes('census') || q.includes('admission')) {
    return {
      text: `Student profiles, guardian contacts, roll numbers, and class allocations are organized under **Students**.`,
      action: { label: 'View Students Directory', path: '/students' }
    };
  }

  if (q.includes('teacher') || q.includes('staff')) {
    return {
      text: `Educator employee IDs, qualifications, salary info, and subject assignments are maintained in **Teachers**.`,
      action: { label: 'View Teachers Directory', path: '/teachers' }
    };
  }

  if (q.includes('library') || q.includes('book')) {
    return {
      text: `Book inventory, ISBN cataloging, book issuance, and automated late fine tracking are managed in **Library**.`,
      action: { label: 'Open Library Portal', path: '/library' }
    };
  }

  if (q.includes('announcement') || q.includes('notice') || q.includes('event')) {
    return {
      text: `Check institution announcements, priority notices, and upcoming school calendar events in **Announcements** and **School Calendar**.`,
      action: { label: 'Open Notice Board', path: '/announcements' }
    };
  }

  return {
    text: `As your EduPulse ERP Assistant, I can guide you through any module (Students, Teachers, Attendance, Timetable, Exams, Fees, Library, Transport, and Reports). What specific task would you like help with?`,
    action: { label: 'Explore Reports Hub', path: '/reports' }
  };
};

const AIChatWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const role = user?.role || 'User';
  const quickPrompts = getQuickPrompts(role);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: `Welcome back, **${user?.full_name || user?.username || 'User'}**! I am your AI Assistant for EduPulse ERP. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = async (textToSend) => {
    const queryText = (textToSend || input).trim();
    if (!queryText) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      const response = await API.post('/api/assistant/query', { message: queryText });
      const { response: botText, action } = response.data;
      const botMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: botText,
        action: action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Assistant query error:', err);
      const fallbackResp = getAssistantResponse(queryText, user);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: fallbackResp.text,
        action: fallbackResp.action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };


  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end pointer-events-none">
      {/* CHAT WINDOW */}
      {isOpen && (
        <div
          className={`pointer-events-auto w-[90vw] max-w-sm sm:max-w-md glass-card rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 mb-3 ${
            isMinimized ? 'h-16' : 'h-[520px]'
          }`}
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-slate-900 px-4 py-3 border-b border-slate-700/60 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                  <Bot size={20} />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900"></span>
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                  EduPulse AI Assistant
                  <Sparkles size={13} className="text-amber-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-slate-400">
                  Active for <span className="text-indigo-300 font-semibold">{user?.role || 'User'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition"
                title="Close Assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* BODY (when not minimized) */}
          {!isMinimized && (
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-slate-950/40">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-end gap-2 max-w-[85%]">
                      {msg.sender === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mb-1">
                          <Bot size={14} />
                        </div>
                      )}
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-md'
                            : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>

                        {/* Action Navigation Button */}
                        {msg.action && (
                          <button
                            onClick={() => {
                              navigate(msg.action.path);
                              setIsOpen(false);
                            }}
                            className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-semibold text-[11px] flex items-center justify-between group transition"
                          >
                            <span>{msg.action.label}</span>
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center space-x-2 text-slate-400 text-xs pl-2">
                    <Bot size={14} className="animate-spin text-indigo-400" />
                    <span>EduPulse AI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* QUICK PROMPT SUGGESTIONS */}
              <div className="p-2.5 bg-slate-900/60 border-t border-slate-800/80 overflow-x-auto custom-scrollbar flex gap-1.5 shrink-0">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.text)}
                    className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 text-[10px] text-indigo-300 font-medium whitespace-nowrap transition flex items-center space-x-1 shrink-0"
                  >
                    <Zap size={11} className="text-amber-400 shrink-0" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>

              {/* INPUT BAR */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2 shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={`Ask Assistant (${role})...`}
                  className="flex-1 px-3 py-2 text-xs rounded-xl glass-input text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition shadow-md shadow-indigo-600/30 shrink-0"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* FLOATING TRIGGER BUTTON */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        className="pointer-events-auto p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/40 hover:scale-105 transition-all duration-300 flex items-center space-x-2 group relative border border-indigo-400/30"
        title="Open AI Chat Assistant"
      >
        <Bot size={22} className="group-hover:rotate-12 transition-transform duration-300" />
        <span className="hidden sm:inline text-xs font-bold tracking-wide">Assistant</span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-ping"></span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-950"></span>
      </button>
    </div>
  );
};

export default AIChatWidget;
