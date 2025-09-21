"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

// Minimal lightweight resizable implementation using pointer events.
// API: <ResizablePanelGroup direction="horizontal|vertical"> with children <ResizablePanel /> and <ResizableHandle />

interface GroupCtx {
  direction: 'horizontal' | 'vertical';
  sizes: number[];
  setSize: (index:number, newSize:number)=>void;
  panelCount: number;
}
const ResizableContext = React.createContext<GroupCtx | null>(null);

interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
  children: React.ReactNode;
  storageKey?: string;
}
export function ResizablePanelGroup({ direction = 'horizontal', className, children, storageKey, ...rest }: ResizablePanelGroupProps){
  const panels = React.Children.toArray(children).filter(Boolean);
  const initial = panels.filter(c => (c as any).type?.displayName === 'ResizablePanel').length;
  const [sizes, setSizes] = React.useState(()=> {
    if (typeof window !== 'undefined' && storageKey) {
      const raw = localStorage.getItem('resize:'+storageKey);
      if (raw) {
        try { const parsed = JSON.parse(raw); if(Array.isArray(parsed) && parsed.length===initial) return parsed; } catch {}
      }
    }
    return Array(initial).fill(100/initial);
  });
  const setSize = (index:number, newSize:number) => setSizes(prev => {
    const total = prev.reduce((a,b)=>a+b,0);
    const clamped = Math.min(Math.max(newSize,5), 95);
    const delta = clamped - prev[index];
    // distribute negative/positive delta across others proportionally
    const others = prev.map((s,i)=> i===index? s: s - (delta/(prev.length-1)));
    const normFactor = 100 / others.reduce((a,b)=>a+b,0);
    const next = others.map(s=> s*normFactor);
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem('resize:'+storageKey, JSON.stringify(next));
    }
    return next;
  });
  React.useEffect(()=>{
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem('resize:'+storageKey, JSON.stringify(sizes));
    }
  },[sizes, storageKey]);
  return (
    <ResizableContext.Provider value={{direction, sizes, setSize, panelCount: initial}}>
      <div className={cn('flex', direction==='horizontal'? 'flex-row':'flex-col', className)} {...rest}>{panels}</div>
    </ResizableContext.Provider>
  );
}

interface ResizablePanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  // Keep for future API symmetry but don't forward to DOM
  defaultSize?: number;
  children: React.ReactNode;
}
export function ResizablePanel({ children, className, defaultSize: _defaultSizeIgnored, ...rest}: ResizablePanelProps){
  const ctx = React.useContext(ResizableContext);
  const indexRef = React.useRef<number>(-1);
  const selfIndex = React.useMemo(()=>{
    if(!ctx) return -1;
    let count = -1;
    return (React.Children.toArray((ctx as any).children)?.filter(()=>true)?.length || 0, ++indexRef.current);
  },[ctx]);
  // simpler: derive index by counting previous panels in parent render tree
  // we will re-assign indices in parent while mapping
  // Instead: rely on effect assigning on first render
  const [idx,setIdx] = React.useState<number>(-1);
  React.useEffect(()=>{
    if(!ctx) return;
    setIdx((p)=> p===-1? (document.querySelectorAll('[data-resizable-panel]').length -1): p);
  },[ctx]);
  if(!ctx) return <div className={className}>{children}</div>;
  const i = idx === -1 ? 0 : idx;
  const size = ctx.sizes[i] || (100/ctx.panelCount);
  return (
    <div data-resizable-panel style={{flexBasis: size + '%'}} className={cn('relative overflow-hidden', className)} {...rest}>
      {children}
    </div>
  );
}
ResizablePanel.displayName = 'ResizablePanel';

export function ResizableHandle(){
  const ctx = React.useContext(ResizableContext);
  const ref = React.useRef<HTMLDivElement|null>(null);
  const indexRef = React.useRef<number>(-1);
  React.useEffect(()=>{
    if(!ref.current) return;
    // index = number of previous panels
    const prevPanels = Array.from(document.querySelectorAll('[data-resizable-panel]'));
    indexRef.current = prevPanels.length -1; // handle sits after a panel
  },[]);
  const onPointerDown = (e:React.PointerEvent) => {
    if(!ctx) return;
    const start = e.clientX;
    const startY = e.clientY;
    const index = indexRef.current;
    const startSizes = [...ctx.sizes];
    const move = (ev:PointerEvent) => {
      if(ctx.direction==='horizontal'){
        const deltaPx = ev.clientX - start;
        const container = ref.current?.parentElement;
        if(!container) return;
        const totalPx = container.getBoundingClientRect().width;
        const deltaPct = (deltaPx / totalPx)*100;
        ctx.setSize(index, startSizes[index] + deltaPct);
      } else {
        const deltaPy = ev.clientY - startY;
        const container = ref.current?.parentElement;
        if(!container) return;
        const totalPy = container.getBoundingClientRect().height;
        const deltaPct = (deltaPy / totalPy)*100;
        ctx.setSize(index, startSizes[index] + deltaPct);
      }
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return <div ref={ref} onPointerDown={onPointerDown} className={cn('shrink-0 bg-white/10 hover:bg-white/20 transition', ctx?.direction==='horizontal'? 'w-1 cursor-col-resize':'h-1 cursor-row-resize')} />
}
