import React, { useState, useEffect } from 'react';
import { getBaseUrl } from './services/api';
import { 
  MessageSquare, 
  Settings, 
  Plus, 
  Trash2, 
  Cpu, 
  Wrench, 
  FileCode, 
  ChevronRight,
  LogOut,
  Terminal,
  Send,
  Paperclip,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { cn } from './lib/utils';
import { sessionApi, managementApi, agentApi } from './services/api';
import { Session, Run, Message, Agent, Skill } from './types';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { useRunStream } from './hooks/useRunStream';

// --- Components ---

const Sidebar = ({ sessions, currentSessionId, onNewSession, onDeleteSession, onOpenSettings }: { 
  sessions: Session[], 
  currentSessionId?: string,
  onNewSession: () => void,
  onDeleteSession: (id: string) => void,
  onOpenSettings: () => void
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-64 bg-[#141414] text-[#E4E3E0] flex flex-col border-r border-[#2A2A2A] h-screen overflow-hidden">
      <div className="p-4 border-bottom border-[#2A2A2A] flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono font-bold text-sm tracking-tighter">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          UNIVERSAL_AGENT
        </div>
      </div>

      <div className="p-4">
        <button 
          onClick={onNewSession}
          className="w-full py-2 px-3 bg-[#E4E3E0] text-[#141414] rounded flex items-center justify-center gap-2 text-xs font-bold hover:bg-white transition-colors"
        >
          <Plus size={14} /> NEW_SESSION
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div className="px-2 py-2 text-[10px] font-mono text-[#666] uppercase tracking-widest">Sessions</div>
        {sessions.map(s => (
          <div 
            key={s.session_id}
            className={cn(
              "group flex items-center justify-between p-2 rounded cursor-pointer transition-all text-xs font-mono",
              currentSessionId === s.session_id ? "bg-[#2A2A2A] text-white" : "hover:bg-[#1A1A1A] text-[#888]"
            )}
            onClick={() => navigate(`/session/${s.session_id}`)}
          >
            <div className="flex items-center gap-2 truncate">
              <MessageSquare size={12} />
              <span className="truncate">{s.title || 'Untitled Session'}</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(s.session_id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[#2A2A2A] space-y-1">
        <div className="px-2 py-2 text-[10px] font-mono text-[#666] uppercase tracking-widest">Management</div>
        <Link 
          to="/management/agents"
          className={cn(
            "flex items-center gap-2 p-2 rounded text-xs font-mono transition-colors",
            location.pathname.includes('/agents') ? "bg-[#2A2A2A] text-white" : "text-[#888] hover:bg-[#1A1A1A]"
          )}
        >
          <Cpu size={14} /> AGENTS
        </Link>
        <Link 
          to="/management/skills"
          className={cn(
            "flex items-center gap-2 p-2 rounded text-xs font-mono transition-colors",
            location.pathname.includes('/skills') ? "bg-[#2A2A2A] text-white" : "text-[#888] hover:bg-[#1A1A1A]"
          )}
        >
          <Wrench size={14} /> SKILLS
        </Link>
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 p-2 rounded text-xs font-mono text-[#888] hover:bg-[#1A1A1A] transition-colors mt-2"
        >
          <Settings size={14} /> SETTINGS
        </button>
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/';
          }}
          className="w-full flex items-center gap-2 p-2 rounded text-xs font-mono text-red-400 hover:bg-red-900/20 transition-colors mt-4"
        >
          <LogOut size={14} /> LOGOUT
        </button>
      </div>
    </div>
  );
};

const MessageItem = ({ message }: { message: Message }) => {
  const isHuman = message.role === 'human';
  const isTool = message.role === 'tool';

  return (
    <div className={cn(
      "p-4 border-b border-[#2A2A2A] font-mono text-xs leading-relaxed",
      isHuman ? "bg-[#1A1A1A]" : isTool ? "bg-[#0F0F0F] text-[#666]" : "bg-[#141414]"
    )}>
      <div className="flex items-start gap-4 max-w-4xl mx-auto">
        <div className={cn(
          "w-8 h-8 rounded flex items-center justify-center shrink-0 border",
          isHuman ? "border-[#444] text-[#888]" : isTool ? "border-[#222] text-[#444]" : "border-white text-white"
        )}>
          {isHuman ? 'U' : isTool ? 'T' : 'A'}
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex items-center gap-2 text-[10px] text-[#666] uppercase tracking-tighter">
            {message.role} {message.name && `• ${message.name}`}
          </div>
          <div className="prose prose-invert prose-xs max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          
          {message.tool_calls && message.tool_calls.length > 0 && (
            <div className="mt-4 space-y-2">
              {message.tool_calls.map(tc => (
                <div key={tc.id} className="p-3 bg-black border border-[#333] rounded">
                  <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold mb-2">
                    <Terminal size={10} /> TOOL_CALL: {tc.name}
                  </div>
                  <pre className="text-[10px] text-[#888] overflow-x-auto">
                    {JSON.stringify(tc.args, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatView = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [runs, setRuns] = useState<Run[]>([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const { content: streamingContent, status: streamStatus } = useRunStream(sessionId || null, activeRunId);

  const fetchRuns = async () => {
    if (!sessionId) return;
    try {
      const data = await sessionApi.listRuns(sessionId);
      // For each run, we might want to fetch details to get messages
      const detailedRuns = await Promise.all(
        data.items.map((r: Run) => sessionApi.getRun(sessionId, r.run_id))
      );
      setRuns(detailedRuns);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [sessionId]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let uploadedFilePaths: string[] = [];
      if (files.length > 0) {
        setUploading(true);
        const uploads = await Promise.all(files.map(f => agentApi.uploadFile(f)));
        uploadedFilePaths = uploads.map(u => u.file_path);
        setUploading(false);
        setFiles([]);
      }

      const runResponse = await agentApi.runTask({
        message: input,
        session_id: sessionId,
        uploaded_files: uploadedFilePaths
      });

      setActiveRunId(runResponse.run_id);
      setInput('');
      // Optimistically add a pending run or just wait for stream
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (streamStatus === 'completed' || streamStatus === 'error') {
      fetchRuns();
      setActiveRunId(null);
    }
  }, [streamStatus]);

  return (
    <div className="flex-1 flex flex-col bg-[#141414] overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {runs.map(run => (
          <div key={run.run_id}>
            {run.messages?.map((m, i) => (
              <MessageItem key={`${run.run_id}-${i}`} message={m} />
            ))}
          </div>
        ))}
        
        {activeRunId && (
          <div className="p-4 border-b border-[#2A2A2A] bg-[#141414] font-mono text-xs">
            <div className="flex items-start gap-4 max-w-4xl mx-auto">
              <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 border border-white text-white animate-pulse">
                A
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-[#666] uppercase tracking-tighter">
                  assistant • streaming...
                </div>
                <div className="prose prose-invert prose-xs max-w-none">
                  <ReactMarkdown>{streamingContent}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-[#2A2A2A]">
        <div className="max-w-4xl mx-auto space-y-4">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 bg-[#2A2A2A] rounded text-[10px] font-mono text-[#888]">
                  <FileCode size={10} /> {f.name}
                  <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-white">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="relative flex items-end gap-2 bg-[#1A1A1A] border border-[#333] rounded-lg p-2 focus-within:border-[#666] transition-colors">
            <label className="p-2 text-[#666] hover:text-white cursor-pointer transition-colors">
              <Paperclip size={18} />
              <input 
                type="file" 
                className="hidden" 
                multiple 
                onChange={(e) => e.target.files && setFiles(prev => [...prev, ...Array.from(e.target.files!)])}
              />
            </label>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Type your task description..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono py-2 resize-none max-h-48"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={isSubmitting || !input.trim()}
              className="p-2 bg-[#E4E3E0] text-[#141414] rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <div className="text-[10px] text-[#444] font-mono text-center">
            UniversalAgent v1.0 • Sandbox Execution Enabled
          </div>
        </div>
      </div>
    </div>
  );
};

const ManagementAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    try {
      const data = await managementApi.listAgents();
      setAgents(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSetDefault = async (id: string) => {
    try {
      await managementApi.setDefaultAgent(id);
      fetchAgents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 bg-[#141414] p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
          <h1 className="text-xl font-mono font-bold tracking-tighter">AGENT_MANAGEMENT</h1>
          <button className="px-4 py-2 bg-[#E4E3E0] text-[#141414] text-xs font-bold rounded hover:bg-white transition-colors">
            CREATE_AGENT
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#444]" /></div>
        ) : (
          <div className="grid gap-4">
            {agents.map(agent => (
              <div key={agent.id} className="p-4 border border-[#2A2A2A] bg-[#1A1A1A] rounded flex items-center justify-between group">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold">{agent.name}</span>
                    {agent.is_default && (
                      <span className="px-2 py-0.5 bg-green-900/20 text-green-400 text-[8px] font-bold rounded border border-green-900/50">DEFAULT</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#666] font-mono">ID: {agent.id} • MODEL_ID: {agent.model_id}</div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!agent.is_default && (
                    <button 
                      onClick={() => handleSetDefault(agent.id)}
                      className="px-3 py-1 border border-[#444] text-[10px] font-bold rounded hover:bg-[#2A2A2A]"
                    >
                      SET_DEFAULT
                    </button>
                  )}
                  <button className="p-1.5 text-[#666] hover:text-white"><Settings size={14} /></button>
                  <button className="p-1.5 text-[#666] hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ManagementSkills = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSkills = async () => {
    try {
      const data = await managementApi.listSkills();
      setSkills(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const toggleSkill = async (name: string, current: boolean) => {
    try {
      await managementApi.toggleSkill(name, !current);
      fetchSkills();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 bg-[#141414] p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="border-b border-[#2A2A2A] pb-4">
          <h1 className="text-xl font-mono font-bold tracking-tighter">SKILL_REGISTRY</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#444]" /></div>
        ) : (
          <div className="grid gap-4">
            {skills.map(skill => (
              <div key={skill.name} className="p-4 border border-[#2A2A2A] bg-[#1A1A1A] rounded flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-mono text-sm font-bold text-blue-400">{skill.name}</div>
                  <div className="text-[10px] text-[#666] font-mono">{skill.description}</div>
                </div>
                <button 
                  onClick={() => toggleSkill(skill.name, skill.enabled)}
                  className={cn(
                    "relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none",
                    skill.enabled ? "bg-green-600" : "bg-[#333]"
                  )}
                >
                  <span className={cn(
                    "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                    skill.enabled ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [url, setUrl] = useState(getBaseUrl());
  
  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('api_base_url', url);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#141414] border border-[#2A2A2A] p-6 rounded-lg w-full max-w-md space-y-4 font-mono">
        <h2 className="text-lg font-bold text-white">SETTINGS</h2>
        <div className="space-y-2">
          <label className="text-xs text-[#888]">Backend API URL</label>
          <input 
            type="text" 
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#333] rounded p-2 text-xs text-white focus:border-[#666] focus:outline-none"
            placeholder="http://localhost:8000"
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-xs text-[#888] hover:text-white transition-colors">CANCEL</button>
          <button onClick={handleSave} className="px-4 py-2 bg-[#E4E3E0] text-[#141414] text-xs font-bold rounded hover:bg-white transition-colors">SAVE & RELOAD</button>
        </div>
      </div>
    </div>
  );
};

const ForbiddenPage = ({ onOpenSettings }: { onOpenSettings: () => void }) => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 font-mono relative">
      <button 
        onClick={onOpenSettings}
        className="absolute top-4 right-4 flex items-center gap-2 p-2 rounded text-xs font-mono text-[#888] hover:text-white hover:bg-[#1A1A1A] transition-colors"
      >
        <Settings size={14} /> SETTINGS
      </button>
      <div className="w-full max-w-md space-y-8 p-8 border border-red-900/50 bg-[#141414] rounded-lg shadow-2xl text-center">
        <div className="space-y-2">
          <div className="text-4xl font-bold tracking-tighter text-red-500">403</div>
          <div className="text-xl font-bold tracking-tighter text-white">ACCESS_DENIED</div>
          <div className="text-[10px] text-[#666] uppercase tracking-[0.2em]">Authentication Token Missing</div>
        </div>
        <div className="text-xs text-[#888] leading-relaxed">
          A valid JWT token is required in Local Storage under the key <code className="bg-[#2A2A2A] px-1 rounded text-blue-400">token</code>.
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchSessions = async () => {
    try {
      const data = await sessionApi.list();
      setSessions(data.items);
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message.includes('401')) {
        setIsLoggedIn(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchSessions();
    }
  }, [isLoggedIn]);

  const handleNewSession = async () => {
    try {
      const newSession = await sessionApi.create(`Session ${sessions.length + 1}`);
      setSessions(prev => [newSession, ...prev]);
      window.location.href = `/session/${newSession.session_id}`;
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await sessionApi.delete(id);
      setSessions(prev => prev.filter(s => s.session_id !== id));
      if (window.location.pathname.includes(id)) {
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <Router>
          <Routes>
            <Route path="*" element={<ForbiddenPage onOpenSettings={() => setIsSettingsOpen(true)} />} />
          </Routes>
        </Router>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Router>
        <div className="flex h-screen bg-[#0A0A0A] text-[#E4E3E0]">
          <Sidebar 
            sessions={sessions} 
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="w-16 h-16 border border-[#2A2A2A] rounded-full flex items-center justify-center text-[#444]">
                  <Terminal size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-mono font-bold tracking-tighter">SELECT_OR_CREATE_SESSION</h2>
                  <p className="text-xs text-[#666] font-mono max-w-md">
                    Initialize a new agent instance to start executing tasks in your isolated sandbox environment.
                  </p>
                </div>
                <button 
                  onClick={handleNewSession}
                  className="px-6 py-2 bg-[#E4E3E0] text-[#141414] text-xs font-bold rounded hover:bg-white transition-colors"
                >
                  START_NEW_AGENT
                </button>
              </div>
            } />
            <Route path="/session/:sessionId" element={<ChatView />} />
            <Route path="/management/agents" element={<ManagementAgents />} />
            <Route path="/management/skills" element={<ManagementSkills />} />
          </Routes>
        </main>
      </div>
    </Router>
    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
