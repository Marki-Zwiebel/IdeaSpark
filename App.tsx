import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Mic, Square, Trash2, ArrowLeft, Sparkles, Search, Check, Edit2, X, Copy, 
  Terminal, Loader2, Zap, Star, Layout, Target, Save, MessageSquare, 
  ShieldCheck, Cpu, ChevronRight, ExternalLink, Filter, Smartphone, Monitor, Tv, 
  Tablet as TabletIcon, AlertCircle, LogOut, User as UserIcon, Info, HelpCircle,
  Globe, Database, Lock, Mail, Key, UserPlus, LogIn
} from 'lucide-react';
import { AppIdea, IdeaStatus, User, IdeaCategory } from './types';
import { analyzeVoiceInput, generateIdeaImage, proposeUpdateViaVoice } from './services/geminiService';
import { auth, db, googleProvider } from './services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup
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
  const marked = (window as any).marked;
  if (!marked) {
    return <div className="prose-system max-w-none whitespace-pre-wrap">{content}</div>;
  }
  const html = marked.parse(content || '');
  return <div className="prose-system max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
};

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFirebaseError = (code: string) => {
    if (code.includes('requests-from-referer-blocked')) {
      return 'Táto doména nie je povolená vo Firebase. Pridajte adresu tejto stránky do Authorized Domains v konzole Firebase.';
    }
    switch (code) {
      case 'auth/invalid-email': return 'Neplatná emailová adresa.';
      case 'auth/user-not-found': return 'Používateľ neexistuje.';
      case 'auth/wrong-password': return 'Nesprávne heslo.';
      case 'auth/email-already-in-use': return 'Tento email sa už používa.';
      case 'auth/weak-password': return 'Heslo musí mať aspoň 6 znakov.';
      case 'auth/invalid-credential': return 'Nesprávne prihlasovacie údaje.';
      case 'auth/popup-closed-by-user': return 'Prihlasovacie okno bolo zatvorené.';
      case 'auth/operation-not-allowed': return 'Táto metóda prihlásenia nie je povolená vo Firebase.';
      default: return `Chyba (${code}). Skontrolujte nastavenia projektu.`;
    }
  };

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
      setError(getFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(getFirebaseError(err.code));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800 p-8 sm:p-10 rounded-[3.5rem] backdrop-blur-3xl z-10 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-500/20">
            <Sparkles size={32} className="text-blue-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter mb-2">IdeaSpark</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Digitálny trezor na nápady</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-2xl text-[11px] mb-6 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <AlertCircle size={16} className="shrink-0" />
              <p className="font-medium leading-tight">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading}
            className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Pokračovať cez Google
              </>
            )}
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="h-[1px] flex-1 bg-slate-800"></div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">alebo</span>
            <div className="h-[1px] flex-1 bg-slate-800"></div>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                type="email" 
                placeholder="Email" 
                className="w-full bg-slate-950 border border-slate-800 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-white transition-all placeholder:text-slate-700" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                type="password" 
                placeholder="Heslo" 
                className="w-full bg-slate-950 border border-slate-800 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-white transition-all placeholder:text-slate-700" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  {isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
                  {isRegister ? 'Vytvoriť nový účet' : 'Prihlásiť sa e-mailom'}
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
          <button 
            onClick={() => { setIsRegister(!isRegister); setError(null); }} 
            className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
          >
            {isRegister ? 'Máte účet? Prihláste sa' : 'Nemáte účet? Zaregistrujte sa'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ... Zvyšok komponentu App zostáva nezmenený ...
const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [allIdeas, setAllIdeas] = useState<AppIdea[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);
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

  if (!user) return <AuthScreen />;

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
      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-red-900/90 border border-red-500 text-white px-6 py-3 rounded-full flex items-center gap-3 animate-in fade-in slide-in-from-top-4 shadow-2xl">
          <AlertCircle size={18} /> <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:bg-white/10 p-1 rounded-full"><X size={14}/></button>
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
                  {user.photoURL ? (
                    <img src={user.photoURL} className="w-4 h-4 rounded-full" alt="" />
                  ) : (
                    <UserIcon size={12} />
                  )}
                  <span className="text-[10px] font-bold truncate max-w-[150px]">{user.email}</span>
                </div>
                <button onClick={() => signOut(auth)} className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                  <LogOut size={12} /> Odhlásiť
                </button>
              </div>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-500 p-4 rounded-3xl shadow-xl transition-all text-white active:scale-95 shadow-blue-600/20">
              {showForm ? <X size={24} /> : <Plus size={24} />}
            </button>
          </header>

          <div className="space-y-4 mb-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
              <input 
                type="text" 
                placeholder="Hľadaj v trezore..." 
                className="w-full bg-slate-900 border border-slate-800 rounded-3xl py-4 pl-14 pr-4 outline-none focus:ring-2 focus:ring-blue-600 text-white shadow-inner transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {showForm && <ManualIdeaForm user={user} onCancel={() => setShowForm(false)} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isAnalyzing && view.type === 'home' && <PlaceholderCard transcript={interimTranscript} />}
            {filteredIdeas.map(idea => (
              <IdeaCard key={idea.id} idea={idea} onClick={() => setView({ type: 'detail', id: idea.id })} />
            ))}
            {filteredIdeas.length === 0 && !isAnalyzing && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-[3rem]">
                <HelpCircle className="mx-auto text-slate-800 mb-4" size={48} />
                <p className="text-slate-500 font-medium">Zatiaľ žiadne nápady. Stlač mikrofón a povedz svoju víziu!</p>
              </div>
            )}
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
            <div className="bg-slate-900/95 border border-blue-500/30 p-8 rounded-[3rem] shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-8 backdrop-blur-xl">
              <p className="text-slate-300 italic text-center mb-6 leading-relaxed">"{interimTranscript || 'Počúvam...'}"</p>
              <div className="flex justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <button 
            onClick={toggleRecording}
            className={`${isRecording ? 'bg-red-500 recording-pulse scale-110 shadow-red-500/50' : 'bg-blue-600 shadow-blue-500/30'} p-10 rounded-full transition-all active:scale-95 text-white pointer-events-auto`}
            disabled={isAnalyzing}
          >
            {isRecording ? <Square size={36} fill="white" /> : <Mic size={36} />}
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
    <div className="bg-slate-900 border border-blue-500/20 p-8 sm:p-10 rounded-[3rem] mb-12 shadow-2xl space-y-6 animate-in slide-in-from-top-4 duration-300">
      <h2 className="text-2xl font-black text-white">Nový záznam</h2>
      <div className="space-y-4">
        <input placeholder="Názov nápadu..." className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 text-white outline-none focus:ring-1 focus:ring-blue-600 transition-all" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        <textarea placeholder="Stručný popis alebo kľúčové slová..." className="w-full bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-300 outline-none focus:ring-1 focus:ring-blue-600 min-h-[120px] transition-all" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
      </div>
      <div className="flex gap-4">
        <button onClick={onCancel} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-600 hover:text-slate-400 transition-colors">Zrušiť</button>
        <button onClick={handleManualAdd} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black text-[10px] uppercase text-white disabled:opacity-50 hover:bg-blue-500 shadow-lg shadow-blue-600/10 transition-all" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Uložiť a analyzovať'}
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
      <p className="text-slate-500 text-[11px] italic">"{transcript || 'Magické stroje v pozadí analyzujú vašu víziu...'}"</p>
    </div>
  </div>
);

const IdeaCard: React.FC<{ idea: AppIdea, onClick: () => void }> = ({ idea, onClick }) => (
  <div onClick={onClick} className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] overflow-hidden hover:border-blue-500/40 transition-all cursor-pointer group hover:translate-y-[-4px]">
    <div className="h-40 w-full relative bg-slate-800">
      {idea.imageUrl ? (
        <img src={idea.imageUrl} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" alt="" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-900">
           <Layout className="text-slate-800" size={48} />
        </div>
      )}
      <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
        <span className="text-[10px] font-black uppercase text-blue-400">{idea.category}</span>
      </div>
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{idea.title}</h3>
      <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed h-8">{idea.description}</p>
      <div className="mt-4 flex items-center gap-2 pt-4 border-t border-slate-800/50">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={10} className={i < idea.importance ? 'text-blue-500 fill-blue-500' : 'text-slate-800'} />
          ))}
        </div>
        <span className="text-[8px] font-black uppercase text-slate-600 ml-auto">{new Date(idea.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  </div>
);

const IdeaDetailView: React.FC<{ idea: AppIdea, isAnalyzing: boolean, onBack: () => void, onUpdate: (i: AppIdea) => void, onDelete: (id: string) => void }> = ({ idea, isAnalyzing, onBack, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(idea);

  useEffect(() => setDraft(idea), [idea]);

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-wrap items-center gap-6 mb-8">
        <button onClick={onBack} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-3xl font-black text-white">{idea.title}</h2>
          <div className="flex gap-3 mt-1">
             <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">{idea.platform}</span>
             <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">•</span>
             <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">{idea.category}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { if(isEditing) onUpdate(draft); setIsEditing(!isEditing); }} className="p-4 bg-blue-600 rounded-2xl text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/10">
            {isEditing ? <Check size={20} /> : <Edit2 size={20}/>}
          </button>
          <button onClick={() => onDelete(idea.id)} className="p-4 bg-red-900/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-900/20 transition-all">
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-slate-900/30 border border-slate-800/60 p-8 rounded-[2.5rem] backdrop-blur-sm shadow-xl">
            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4 flex items-center gap-2">
               <Info size={12} /> Zhrnutie
            </h4>
            {isEditing ? (
              <textarea className="w-full bg-slate-950 p-6 rounded-2xl border border-slate-800 text-white min-h-[150px] outline-none focus:ring-1 focus:ring-blue-600" value={draft.description} onChange={e => setDraft({...draft, description: e.target.value})} />
            ) : (
              <p className="text-lg text-slate-200 font-medium leading-relaxed">{idea.description}</p>
            )}
          </section>
          
          <section className="bg-slate-900/30 border border-slate-800/60 p-8 rounded-[2.5rem] backdrop-blur-sm shadow-xl">
            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4 flex items-center gap-2">
               <Cpu size={12} /> Technický Blueprint
            </h4>
            <div className="bg-slate-950/60 p-8 rounded-3xl border border-white/5 shadow-inner">
              {isEditing ? (
                <textarea className="w-full bg-slate-950 p-6 rounded-2xl border border-slate-800 text-blue-300 font-mono text-xs min-h-[400px]" value={draft.devPrompt} onChange={e => setDraft({...draft, devPrompt: e.target.value})} />
              ) : (
                <MarkdownRenderer content={idea.devPrompt} />
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <section className="bg-slate-900/30 border border-slate-800/60 p-6 rounded-[2.5rem] backdrop-blur-sm shadow-xl">
              <h4 className="text-[10px] font-black uppercase text-slate-500 mb-6">Detaily</h4>
              <div className="space-y-6">
                 <div>
                    <label className="text-[9px] font-black uppercase text-slate-700 block mb-2">Dôležitosť</label>
                    <div className="flex gap-2">
                       {[...Array(5)].map((_, i) => (
                         <div key={i} className={`h-1.5 flex-1 rounded-full ${i < idea.importance ? 'bg-blue-600' : 'bg-slate-800'}`} />
                       ))}
                    </div>
                 </div>
                 <div className="flex items-center justify-between border-t border-slate-800/50 pt-4">
                    <span className="text-[11px] text-slate-500">Platforma</span>
                    <span className="text-[11px] font-bold text-white">{idea.platform}</span>
                 </div>
                 <div className="flex items-center justify-between border-t border-slate-800/50 pt-4">
                    <span className="text-[11px] text-slate-500">Status</span>
                    <div className="bg-blue-600/10 px-3 py-1 rounded-full border border-blue-600/20">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">{idea.status}</span>
                    </div>
                 </div>
                 <div className="pt-4 border-t border-slate-800/50">
                    <label className="text-[9px] font-black uppercase text-slate-700 block mb-2">Cieľová skupina</label>
                    <p className="text-[11px] text-slate-300 italic">"{idea.targetAudience}"</p>
                 </div>
              </div>
           </section>

           <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[2.5rem] shadow-xl">
              <h4 className="text-[10px] font-black uppercase text-blue-400 mb-2 flex items-center gap-2">
                 <Mic size={12} /> Hlasová úprava
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Stlačte mikrofón a povedzte napríklad: <i>"zmeň prioritu na 5 a pridaj do roadmapy platobnú bránu"</i>.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;