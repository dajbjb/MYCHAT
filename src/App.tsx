import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc,
  getDoc
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { UserProfile, Message, Room } from './types';
import { Avatar } from './components/Avatar';
import { Environment } from './components/Environment';
import { ChatOverlay } from './components/ChatOverlay';
import { LogIn, LogOut, Settings as SettingsIcon, MessageSquare, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([]);
  const [envType, setEnvType] = useState<'space' | 'forest' | 'minimal'>('space');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Sync profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        let userProfile: UserProfile;
        if (!userSnap.exists()) {
          userProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Anonymous',
            photoURL: firebaseUser.photoURL || '',
            avatarColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
            lastActive: new Date().toISOString(),
            status: 'online'
          };
          await setDoc(userRef, userProfile);
        } else {
          userProfile = userSnap.data() as UserProfile;
          await setDoc(userRef, { ...userProfile, status: 'online', lastActive: new Date().toISOString() }, { merge: true });
        }
        setProfile(userProfile);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Messages Listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'rooms', 'lobby', 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [user]);

  // Online Users Listener
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data() as UserProfile).filter(u => u.status === 'online');
      setOnlineUsers(users);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    if (user) {
      await setDoc(doc(db, 'users', user.uid), { status: 'offline' }, { merge: true });
      await signOut(auth);
    }
  };

  const sendMessage = async (text: string) => {
    if (!user || !profile) return;
    try {
      await addDoc(collection(db, 'rooms', 'lobby', 'messages'), {
        senderId: user.uid,
        senderName: profile.displayName,
        text,
        timestamp: serverTimestamp(),
        position: {
          x: (Math.random() - 0.5) * 10,
          y: Math.random() * 2,
          z: (Math.random() - 0.5) * 10
        }
      });
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-white font-mono">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          INITIALIZING DIMENSION...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative">
      {/* 3D Scene */}
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 5, 15]} fov={50} />
        <OrbitControls 
          enablePan={false} 
          maxPolarAngle={Math.PI / 2.1} 
          minDistance={5} 
          maxDistance={30}
        />
        
        <Environment type={envType} />
        
        {/* Avatars */}
        {onlineUsers.map((u, idx) => (
          <Avatar 
            key={u.uid} 
            position={[
              Math.cos((idx / onlineUsers.length) * Math.PI * 2) * 5, 
              0, 
              Math.sin((idx / onlineUsers.length) * Math.PI * 2) * 5
            ]} 
            color={u.avatarColor} 
            name={u.displayName}
            isLocal={u.uid === user?.uid}
          />
        ))}

        {/* Message Particles/Visuals could go here */}
      </Canvas>

      {/* UI Overlay */}
      {!user ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-12 bg-zinc-900 border border-zinc-800 rounded-3xl text-center shadow-2xl"
          >
            <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">DIMENSION CHAT</h1>
            <p className="text-zinc-400 mb-8 font-medium">Enter the 3D social space</p>
            <button 
              onClick={handleLogin}
              className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-zinc-200 transition-all active:scale-95"
            >
              <LogIn size={20} />
              SIGN IN WITH GOOGLE
            </button>
          </motion.div>
        </div>
      ) : (
        <>
          <ChatOverlay 
            messages={messages} 
            onSendMessage={sendMessage} 
            userProfile={profile}
          />
          
          {/* Top Bar */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
              <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-2 rounded-2xl flex items-center gap-3">
                <img src={profile?.photoURL} className="w-10 h-10 rounded-xl border border-zinc-700" alt="" />
                <div className="pr-4">
                  <p className="text-white text-sm font-bold leading-tight">{profile?.displayName}</p>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">Online</p>
                </div>
              </div>
              <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 px-4 py-2 rounded-2xl flex items-center gap-2 text-white">
                <Users size={16} className="text-emerald-400" />
                <span className="text-sm font-bold">{onlineUsers.length}</span>
              </div>
            </div>

            <div className="flex gap-2 pointer-events-auto">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl text-white hover:bg-zinc-800 transition-colors"
              >
                <SettingsIcon size={20} />
              </button>
              <button 
                onClick={handleLogout}
                className="p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl text-red-400 hover:bg-zinc-800 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Settings Modal */}
          <AnimatePresence>
            {isSettingsOpen && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-[100] p-6">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
                >
                  <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 block">Environment</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['space', 'forest', 'minimal'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => setEnvType(type)}
                            className={`py-3 rounded-xl text-sm font-bold capitalize transition-all ${
                              envType === type ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 block">Avatar Color</label>
                      <input 
                        type="color" 
                        value={profile?.avatarColor} 
                        onChange={async (e) => {
                          const newColor = e.target.value;
                          if (user) {
                            await setDoc(doc(db, 'users', user.uid), { avatarColor: newColor }, { merge: true });
                            setProfile(prev => prev ? { ...prev, avatarColor: newColor } : null);
                          }
                        }}
                        className="w-full h-12 rounded-xl bg-zinc-800 border-none cursor-pointer"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
