
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Mic, Square, Trash2, ArrowLeft, Sparkles, Search, Check, Edit2, X, Copy, 
  Terminal, Loader2, Zap, Star, Layout, Target, Save, MessageSquare, 
  ShieldCheck, Cpu, ChevronRight, ExternalLink, Filter, Smartphone, Monitor, Tv, 
  Tablet as TabletIcon, AlertCircle, LogOut, User as UserIcon, Info, HelpCircle,
  Globe, Database, Lock
} from 'lucide-react';
import { AppIdea, IdeaStatus, User, IdeaCategory } from './types';
import { analyzeVoiceInput, generateIdeaImage, proposeUpdateViaVoice } from './services/geminiService';
import { auth, db } from './services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const html = (window as any).marked.parse(content || '');
  return <div className="prose-system max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
};

const DeploymentGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
    <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="p-8 sm:p-12 max-h-[80vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <Globe className="text-blue-500" /> Vercel Setup
            </h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Dôležité kroky pre produkciu</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X /></button>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-950 p-6 rounded-3xl border border-white/5">
            <h4 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <Lock size={14}/> 1. Nastavenie premenných (Vercel Dashboard)
            </h4>
            <p className="text-[11px] text-slate-400 mb-4">Pridajte tieto premenné v Settings -> Environment Variables:</p>
            <div className="space-y-2">
              <div className="bg-slate-900 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                <code className="text-blue-400 text-xs">API_KEY</code>
                <span className="text-[10px] text-slate-500">(Gemini AI kľúč)</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                <code className="text-blue-400 text-xs">VITE_FIREBASE_API_KEY</code>
                <span className="text-[10px] text-slate-500">(Firebase kľúč)</span>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <Database size={14}/> 2. Firestore Rule
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Vo Firebase konzole nastavte v sekcii **Firestore -> Rules** toto pravidlo:
            </p>
            <pre className="bg-black/50 p-4 rounded-2xl text-[10px] text-blue-300 overflow-x-auto">
{`allow read, write: if request.auth != null;`}
            </pre>
          </section>

          <section className="bg-blue-600/10 p-6 rounded-3xl border border-blue-500/20 text-center">
            <p className="text-[11px] text-blue-200 leading-relaxed">
              Po pridaní premenných vo Verceli nezabudnite na **Redeploy**, aby sa zmeny prejavili.
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [allIdeas, setAllIdeas] = useState<AppIdea[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [filterCategory, setFilterCategory] = useState<IdeaCategory | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<IdeaStatus | 'All'>('All');
  const [filterImportance, setFilterImportance] = useState<number | 'All'>('All');

  const [view, setView] = useState<{ type: 'home' | 'detail', id?: string }>({ type: 'home' });
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const currentTranscriptRef = useRef<string>('');
  const viewRef = useRef(view);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setAllIdeas([]);
      return;
    }

    const q = query(collection(db, "ideas"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ideasData: AppIdea[] = [];
      snapshot.forEach((doc) => {
        ideasData.push({ id: doc.id, ...doc.data() } as AppIdea);
      });
      ideasData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setAllIdeas(ideasData);
    }, (err) => {
      console.error("Firestore sync error:", err);
      setError("Synchronizácia so serverom zlyhala.");
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const processTranscript = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      const activeView = viewRef.current;
      if (activeView.type === 'detail' && activeView.id) {
        const ideaToUpdate = allIdeas.find(i => i.id === activeView.id);
        if (ideaToUpdate) {
          const updated = await proposeUpdateViaVoice(ideaToUpdate, trimmed);
          const { id, ...dataToUpdate } = updated;
          await updateDoc(doc(db, "ideas", activeView.id), dataToUpdate);
        }
      } else {
        const result = await analyzeVoiceInput(trimmed);
        const newIdeaData = {
          ...result,
          userId: user.uid,
          status: IdeaStatus.IDEA,
          appUrl: '',
          createdAt: Date.now(),
          imageUrl: ''
        };
        
        const docRef = await addDoc(collection(db, "ideas"), newIdeaData);
        setShowForm(false);
        
        generateIdeaImage(newIdeaData.title, newIdeaData.description).then(async (img) => {
          if (img) await updateDoc(doc(db, "ideas", docRef.id), { imageUrl: img });
        });
      }
    } catch (e: any) {
      setError(e.message || "AI analýza zlyhala.");
    } finally {
      setIsAnalyzing(false);
      setInterimTranscript('');
      currentTranscriptRef.current = '';
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      return;
    }

    const Speech = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!Speech) return alert("Rozpoznávanie reči nie je podporované.");

    recognitionRef.current = new Speech();
    recognitionRef.current.lang = 'sk-SK';
    recognitionRef.current.interimResults = true;
    recognitionRef.current.continuous = true; 
    
    recognitionRef.current.onstart = () => setIsRecording(true);
    recognitionRef.current.onresult = (e: any) => {
      let fullText = '';
      for (let i = 0; i < e.results.length; i++) fullText += e.results[i][0].transcript;
      setInterimTranscript(fullText);
      currentTranscriptRef.current = fullText;
    };
    recognitionRef.current.onerror = () => setIsRecording(false);
    recognitionRef.current.onend = () => {
      setIsRecording(false);
      if (currentTranscriptRef.current.trim() && !isAnalyzing) processTranscript(currentTranscriptRef.current);
    };
    recognitionRef.current.start();
  };

  if (isAuthLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  );

  if (!user) return <AuthScreen onShowGuide={() => setShowGuide(true)} />;

  const currentIdea = view.type === 'detail' ? allIdeas.find(i => i.id === view.id) : null;
  const filteredIdeas = allIdeas.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          i.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || i.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || i.status === filterStatus;
    const matchesImportance = filterImportance === 'All' || i.importance === filterImportance;
    return matchesSearch && matchesCategory && matchesStatus && matchesImportance;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-40">
      {showGuide && <DeploymentGuide onClose={() => setShowGuide(false)} />}
      
      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-red-900/90 border border-red-500 text-white px-6 py-3 rounded-full flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={18} /> <span>{error}</span>
          <button onClick={() => setError(null)}><X size={14}/></button>
        </div>
      )}

      {view.type === 'home' && (
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tighter">
                <Sparkles className="text-blue-500" size={32} /> IdeaSpark
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-white/5">
                  <UserIcon size={12} />
                  <span className="text-[10px] font-bold truncate max-w-[150px]">{user.email}</span>
                </div>
                <button onClick={() => setShowGuide(true)} className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-400 flex items-center gap-1">
                  <Globe size={12} /> Vercel Setup
                </button>
                <button onClick={() => signOut(auth)} className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 flex items-center gap-1">
                  <LogOut size={12} /> Logout
                </button>
              </div>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-500 p-4 rounded-3xl shadow-xl transition-all text-white active:scale-95">
              {showForm ? <X size={24} /> : <Plus size={24} />}
            </button>
          </header>

          <div className="space-y-4 mb-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
              <input 
                type="text" 
                placeholder="Hľadaj v trezore..." 
                className="w-full bg-slate-900 border border-slate-800 rounded-3xl py-4 pl-14 pr-4 outline-none focus:ring-2 focus:ring-blue-600 text-white shadow-inner"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {showForm && <ManualIdeaForm user={user} onCancel={() => setShowForm(false)} />}

          <div className="grid gap-6">
            {isAnalyzing && view.type === 'home' && <PlaceholderCard transcript={interimTranscript} />}
            {filteredIdeas.map(idea => (
              <IdeaCard key={idea.id} idea={idea} onClick={() => setView({ type: 'detail', id: idea.id })} />
            ))}
          </div>
        </div>
      )}

      {view.type === 'detail' && currentIdea && (
        <IdeaDetailView 
          idea={currentIdea} 
          isAnalyzing={isAnalyzing}
          onBack={() => setView({ type: 'home' })} 
          onDelete={async (id) => { 
            if(confirm("Odstrániť z trezoru?")) {
              await deleteDoc(doc(db, "ideas", id));
              setView({ type: 'home' });
            }
          }}
          onUpdate={async (u) => {
            const { id, ...data } = u;
            await updateDoc(doc(db, "ideas", id), data);
          }}
        />
      )}

      <div className="fixed bottom-10 left-0 right-0 px-6 flex flex-col items-center pointer-events-none z-50">
        <div className="pointer-events-auto flex flex-col items-center gap-6">
          {isRecording && (
            <div className="bg-slate-900/95 border border-blue-500/30 p-8 rounded-[3rem] shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-8">
              <p className="text-slate-300 italic text-center mb-6 leading-relaxed">"{interimTranscript || 'Počúvam...'}"</p>
            </div>
          )}
          <button 
            onClick={toggleRecording}
            className={`${isRecording ? 'bg-red-500 recording-pulse scale-110 shadow-red-500/50' : 'bg-blue-600 shadow-blue-500/30'} p-10 rounded-full transition-all active:scale-95 text-white`}
            disabled={isAnalyzing}
          >
            {isRecording ? <Square size={36} fill="white" /> : <Mic size={36} />}
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthScreen: React.FC<{ onShowGuide: () => void }> = ({ onShowGuide }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError("Chyba prihlásenia. Skontrolujte kľúče a konzolu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800 p-10 sm:p-12 rounded-[3.5rem] backdrop-blur-3xl z-10 shadow-2xl">
        <div className="text-center mb-10">
          <Sparkles size={48} className="text-blue-500 mx-auto mb-4" />
          <h1 className="text-4xl font-black tracking-tighter">IdeaSpark</h1>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-white transition-all" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Heslo" 
            className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-white transition-all" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <button 
            type="submit" 
            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest active:scale-95 transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : (isRegister ? 'Registrovať' : 'Prihlásiť')}
          </button>
        </form>
        
        <div className="mt-8 flex flex-col gap-4 items-center">
          <button 
            onClick={() => setIsRegister(!isRegister)} 
            className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
          >
            {isRegister ? 'Mám konto' : 'Nové konto'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ManualIdeaForm: React.FC<{ user: any, onCancel: () => void }> = ({ user, onCancel }) => {
  const [form, setForm] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleManualAdd = async () => {
    if (!form.title) return;
    setLoading(true);
    try {
      const result = await analyzeVoiceInput(`${form.title}: ${form.description}`);
      const newIdeaData = { 
        ...result, 
        userId: user.uid, 
        status: IdeaStatus.IDEA, 
        appUrl: '', 
        createdAt: Date.now(),
        imageUrl: ''
      };
      const docRef = await addDoc(collection(db, "ideas"), newIdeaData);
      onCancel();
      generateIdeaImage(newIdeaData.title, newIdeaData.description).then(async (img) => {
        if (img) await updateDoc(doc(db, "ideas", docRef.id), { imageUrl: img });
      });
    } catch (e) { alert("Chyba analýzy."); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-slate-900 border border-blue-500/20 p-8 sm:p-10 rounded-[3rem] mb-12 shadow-2xl space-y-6">
      <h2 className="text-2xl font-black text-white">Nový záznam</h2>
      <div className="space-y-4">
        <input placeholder="Názov..." className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 text-white" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        <textarea placeholder="Popis..." className="w-full bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-300" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
      </div>
      <div className="flex gap-4">
        <button onClick={onCancel} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-600">Zrušiť</button>
        <button onClick={handleManualAdd} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black text-[10px] uppercase text-white disabled:opacity-50" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Uložiť'}
        </button>
      </div>
    </div>
  );
};

const PlaceholderCard: React.FC<{ transcript: string }> = ({ transcript }) => (
  <div className="bg-slate-900/60 border border-blue-500/30 rounded-[2.5rem] overflow-hidden animate-pulse">
    <div className="h-40 w-full bg-slate-800/30 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
    <div className="p-6">
      <p className="text-slate-500 text-[11px] italic">"{transcript || 'Analyzujem...'}"</p>
    </div>
  </div>
);

const IdeaCard: React.FC<{ idea: AppIdea, onClick: () => void }> = ({ idea, onClick }) => (
  <div onClick={onClick} className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] overflow-hidden hover:border-blue-500/40 transition-all cursor-pointer group">
    <div className="h-40 w-full relative bg-slate-800">
      {idea.imageUrl && <img src={idea.imageUrl} className="w-full h-full object-cover" alt="" />}
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold text-white group-hover:text-blue-400">{idea.title}</h3>
      <p className="text-slate-500 text-xs mt-2 line-clamp-2">{idea.description}</p>
    </div>
  </div>
);

const IdeaDetailView: React.FC<{ idea: AppIdea, isAnalyzing: boolean, onBack: () => void, onUpdate: (i: AppIdea) => void, onDelete: (id: string) => void }> = ({ idea, isAnalyzing, onBack, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(idea);

  useEffect(() => setDraft(idea), [idea]);

  return (
    <div className="max-w-5xl mx-auto">
      <header className="flex items-center gap-6 mb-8">
        <button onClick={onBack} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-3xl font-black flex-1 text-white">{idea.title}</h2>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(!isEditing)} className="p-4 bg-blue-600 rounded-2xl text-white">
            {isEditing ? <Check size={20} onClick={() => { onUpdate(draft); setIsEditing(false); }} /> : <Edit2 size={20}/>}
          </button>
          <button onClick={() => onDelete(idea.id)} className="p-4 bg-red-900/10 text-red-500 border border-red-500/20 rounded-2xl">
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-slate-900/30 border border-slate-800/60 p-8 rounded-[2.5rem]">
            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4">Summary</h4>
            {isEditing ? (
              <textarea className="w-full bg-slate-950 p-4 rounded-xl text-white" value={draft.description} onChange={e => setDraft({...draft, description: e.target.value})} />
            ) : (
              <p className="text-lg text-slate-100 font-medium">{idea.description}</p>
            )}
          </section>
          
          <section className="bg-slate-900/30 border border-slate-800/60 p-8 rounded-[2.5rem]">
            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4">Tech Blueprint</h4>
            <div className="bg-slate-950/60 p-8 rounded-3xl border border-white/5">
              <MarkdownRenderer content={idea.devPrompt} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default App;
