"use client";
import { createContext, useContext, useState, useCallback } from 'react';

interface Toast { id: number; message: string; }
interface ToastCtx { notify: (msg:string)=>void; }
const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }){
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((message:string) => {
    const id = Date.now()+Math.random();
    setToasts(t => [...t, { id, message }]);
    setTimeout(()=> setToasts(t => t.filter(x=> x.id !== id)), 2500);
  },[]);
  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-[100]">{/* Toast container */}
        {toasts.map(t => (
          <div
            key={t.id}
            className="group relative px-4 py-2 rounded-xl text-sm font-medium text-white bg-[linear-gradient(145deg,rgba(40,40,48,0.85),rgba(20,20,25,0.85))] backdrop-blur-md border border-white/15 shadow-lg shadow-black/40 overflow-hidden"
          >
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.18),transparent_70%)]" />
            <span className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(){
  const ctx = useContext(ToastContext);
  if(!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
