import { useState, useRef, useCallback, useEffect } from "react";

const GRID_SIZE = 10;
const CANVAS_W = 1200;
const CANVAS_H = 800;

const COLORS = ["#E63946","#F4A261","#2A9D8F","#457B9D","#9B5DE5","#F15BB5","#00BBF9","#06D6A0"];

let idCounter = 1;
const uid = () => `el_${idCounter++}`;

const snap = (v) => Math.round(v / GRID_SIZE) * GRID_SIZE;

const defaultProps = (type) => {
  const base = { x: snap(100 + Math.random()*300), y: snap(80 + Math.random()*200) };
  if (type === "rect") return { ...base, w: 160, h: 100, fill: COLORS[Math.floor(Math.random()*COLORS.length)], opacity:1, radius:8 };
  if (type === "text") return { ...base, w: 180, h: 50, text: "Double-click to edit", fontSize: 16, color: "#1a1a2e", fill: "transparent", opacity:1, radius:0 };
  if (type === "image") return { ...base, w: 180, h: 120, fill: "#c0c0c0", opacity:1, radius:4 };
  if (type === "circle") return { ...base, w: 100, h: 100, fill: COLORS[Math.floor(Math.random()*COLORS.length)], opacity:1, radius:9999 };
  return base;
};

function ResizeHandle({ dir, onMouseDown }) {
  const cursors = { nw:"nw-resize", n:"n-resize", ne:"ne-resize", e:"e-resize", se:"se-resize", s:"s-resize", sw:"sw-resize", w:"w-resize" };
  const positions = {
    nw: { top:-5, left:-5 }, n: { top:-5, left:"calc(50% - 5px)" }, ne: { top:-5, right:-5 },
    e: { top:"calc(50% - 5px)", right:-5 }, se: { bottom:-5, right:-5 },
    s: { bottom:-5, left:"calc(50% - 5px)" }, sw: { bottom:-5, left:-5 },
    w: { top:"calc(50% - 5px)", left:-5 }
  };
  return (
    <div
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, dir); }}
      style={{
        position:"absolute", width:10, height:10,
        background:"#fff", border:"2px solid #5B6CFF",
        borderRadius:2, cursor: cursors[dir], zIndex:100,
        ...positions[dir]
      }}
    />
  );
}

function CanvasElement({ el, isSelected, onSelect, onDragStart, onResizeStart, onDoubleClick, zIndex }) {
  const style = {
    position:"absolute", left:el.x, top:el.y, width:el.w, height:el.h,
    background: el.fill === "transparent" ? "transparent" : el.fill,
    borderRadius: el.radius === 9999 ? "50%" : el.radius,
    opacity: el.opacity,
    cursor:"move", userSelect:"none", zIndex,
    border: isSelected ? "2px solid #5B6CFF" : el.type === "text" ? "1.5px dashed #aaa" : "none",
    boxShadow: isSelected ? "0 0 0 3px rgba(91,108,255,0.25)" : el.type === "rect" || el.type === "circle" ? "0 4px 20px rgba(0,0,0,0.15)" : "none",
    display:"flex", alignItems:"center", justifyContent:"center",
    overflow:"hidden",
    transition: isSelected ? "none" : "box-shadow 0.15s",
  };

  return (
    <div
      style={style}
      onMouseDown={(e) => { e.stopPropagation(); onSelect(el.id); onDragStart(e, el.id); }}
      onDoubleClick={() => onDoubleClick(el.id)}
    >
      {el.type === "text" && (
        <span style={{ fontSize:el.fontSize, color:el.color, fontFamily:"'DM Serif Display', serif", padding:"4px 8px", textAlign:"center", width:"100%", pointerEvents:"none" }}>
          {el.text}
        </span>
      )}
      {el.type === "image" && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, color:"#888", pointerEvents:"none" }}>
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x={3} y={3} width={18} height={18} rx={2}/><circle cx={8.5} cy={8.5} r={1.5}/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
          <span style={{ fontSize:11, fontFamily:"monospace" }}>Image</span>
        </div>
      )}
      {isSelected && ["nw","n","ne","e","se","s","sw","w"].map(dir => (
        <ResizeHandle key={dir} dir={dir} onMouseDown={onResizeStart} />
      ))}
    </div>
  );
}

function PropertiesPanel({ el, onChange, onDelete, onDuplicate, onBringForward, onSendBackward }) {
  if (!el) return (
    <div style={{ padding:"32px 20px", color:"#666", textAlign:"center", fontFamily:"'DM Sans', sans-serif", fontSize:13 }}>
      <div style={{ fontSize:32, marginBottom:12 }}>✦</div>
      <div style={{ fontWeight:600, marginBottom:4, color:"#333" }}>No element selected</div>
      <div>Click an element or add one from the toolbar</div>
    </div>
  );

  const row = (label, child) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:"#999", textTransform:"uppercase", marginBottom:5, fontFamily:"'DM Sans', sans-serif" }}>{label}</label>
      {child}
    </div>
  );

  const numInput = (val, key, min, max, step=1) => (
    <input type="number" value={Math.round(val)} min={min} max={max} step={step}
      onChange={e => onChange({ [key]: parseFloat(e.target.value) || 0 })}
      style={inputStyle} />
  );

  const inputStyle = {
    width:"100%", padding:"6px 10px", borderRadius:6, border:"1.5px solid #e8e8e8",
    fontFamily:"'DM Sans', sans-serif", fontSize:13, color:"#1a1a2e",
    background:"#fafafa", outline:"none", boxSizing:"border-box"
  };

  return (
    <div style={{ padding:"20px 16px", fontFamily:"'DM Sans', sans-serif", overflowY:"auto" }}>
      <div style={{ fontWeight:700, fontSize:12, letterSpacing:"0.1em", color:"#5B6CFF", textTransform:"uppercase", marginBottom:18 }}>
        ◈ Properties
      </div>

      {row("Position", <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div><span style={{ fontSize:10, color:"#bbb" }}>X</span>{numInput(el.x, "x", 0, CANVAS_W)}</div>
        <div><span style={{ fontSize:10, color:"#bbb" }}>Y</span>{numInput(el.y, "y", 0, CANVAS_H)}</div>
      </div>)}

      {row("Size", <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div><span style={{ fontSize:10, color:"#bbb" }}>W</span>{numInput(el.w, "w", 10, CANVAS_W)}</div>
        <div><span style={{ fontSize:10, color:"#bbb" }}>H</span>{numInput(el.h, "h", 10, CANVAS_H)}</div>
      </div>)}

      {el.type !== "image" && row("Fill", <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <input type="color" value={el.fill === "transparent" ? "#ffffff" : el.fill}
          onChange={e => onChange({ fill: e.target.value })}
          style={{ width:36, height:36, border:"none", borderRadius:6, cursor:"pointer", padding:2, background:"none" }} />
        <input type="text" value={el.fill} onChange={e => onChange({ fill: e.target.value })} style={{ ...inputStyle, flex:1 }} />
      </div>)}

      {row("Opacity", <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <input type="range" min={0} max={1} step={0.01} value={el.opacity}
          onChange={e => onChange({ opacity: parseFloat(e.target.value) })}
          style={{ flex:1 }} />
        <span style={{ fontSize:12, color:"#666", width:36, textAlign:"right" }}>{Math.round(el.opacity*100)}%</span>
      </div>)}

      {el.type !== "circle" && el.type !== "image" && row("Corner Radius", numInput(el.radius, "radius", 0, 200))}

      {el.type === "text" && <>
        {row("Text", <textarea value={el.text} rows={3}
          onChange={e => onChange({ text: e.target.value })}
          style={{ ...inputStyle, resize:"vertical", lineHeight:1.5 }} />)}
        {row("Font Size", numInput(el.fontSize, "fontSize", 8, 120))}
        {row("Color", <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <input type="color" value={el.color}
            onChange={e => onChange({ color: e.target.value })}
            style={{ width:36, height:36, border:"none", borderRadius:6, cursor:"pointer", padding:2, background:"none" }} />
          <input type="text" value={el.color} onChange={e => onChange({ color: e.target.value })} style={{ ...inputStyle, flex:1 }} />
        </div>)}
      </>}

      <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <button onClick={onBringForward} style={btnStyle("#f0f0ff","#5B6CFF")}>↑ Forward</button>
          <button onClick={onSendBackward} style={btnStyle("#f0f0ff","#5B6CFF")}>↓ Backward</button>
        </div>
        <button onClick={onDuplicate} style={btnStyle("#f0fff4","#2A9D8F")}>⧉ Duplicate</button>
        <button onClick={onDelete} style={btnStyle("#fff0f0","#E63946")}>✕ Delete</button>
      </div>
    </div>
  );
}

const btnStyle = (bg, color) => ({
  padding:"8px 12px", border:`1.5px solid ${color}22`, borderRadius:8,
  background:bg, color, fontWeight:600, fontSize:12,
  fontFamily:"'DM Sans', sans-serif", cursor:"pointer",
  transition:"all 0.15s", letterSpacing:"0.03em"
});

export default function DesignCanvas() {
  const [elements, setElements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([[]]);
  const [histIdx, setHistIdx] = useState(0);
  const [editingText, setEditingText] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);

  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  const commit = useCallback((els) => {
    setElements(els);
    setHistory(h => { const next = h.slice(0, histIdx+1); next.push(els); return next; });
    setHistIdx(i => i+1);
  }, [histIdx]);

  const undo = () => {
    if (histIdx > 0) { setHistIdx(i => i-1); setElements(history[histIdx-1]); setSelected(null); }
  };
  const redo = () => {
    if (histIdx < history.length-1) { setHistIdx(i => i+1); setElements(history[histIdx+1]); }
  };

  const addElement = (type) => {
    const el = { id: uid(), type, zIndex: elements.length, ...defaultProps(type) };
    commit([...elements, el]);
    setSelected(el.id);
  };

  const deleteSelected = useCallback(() => {
    if (!selected) return;
    commit(elements.filter(e => e.id !== selected));
    setSelected(null);
  }, [selected, elements, commit]);

  const duplicate = () => {
    const el = elements.find(e => e.id === selected);
    if (!el) return;
    const newEl = { ...el, id: uid(), x: el.x+20, y: el.y+20, zIndex: elements.length };
    commit([...elements, newEl]);
    setSelected(newEl.id);
  };

  const updateEl = (id, props) => {
    const updated = elements.map(e => e.id === id ? { ...e, ...props } : e);
    commit(updated);
    setElements(updated);
  };

  const handleDragStart = (e, id) => {
    e.preventDefault();
    const el = elements.find(el => el.id === id);
    const rect = canvasRef.current.getBoundingClientRect();
    dragRef.current = {
      id, startX: e.clientX, startY: e.clientY,
      origX: el.x, origY: el.y,
      canvasLeft: rect.left, canvasTop: rect.top
    };
  };

  const handleResizeStart = (e, id, dir) => {
    e.preventDefault();
    const el = elements.find(el => el.id === id);
    resizeRef.current = { id, dir, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y, origW: el.w, origH: el.h };
  };

  useEffect(() => {
    const onMove = (e) => {
      if (dragRef.current) {
        const { id, startX, startY, origX, origY } = dragRef.current;
        const dx = (e.clientX - startX) / zoom;
        const dy = (e.clientY - startY) / zoom;
        const nx = snap(Math.max(0, Math.min(CANVAS_W - 10, origX + dx)));
        const ny = snap(Math.max(0, Math.min(CANVAS_H - 10, origY + dy)));
        setElements(els => els.map(el => el.id === id ? { ...el, x: nx, y: ny } : el));
      }
      if (resizeRef.current) {
        const { id, dir, startX, startY, origX, origY, origW, origH } = resizeRef.current;
        const dx = (e.clientX - startX) / zoom;
        const dy = (e.clientY - startY) / zoom;
        let x=origX, y=origY, w=origW, h=origH;
        if (dir.includes("e")) w = Math.max(20, snap(origW + dx));
        if (dir.includes("s")) h = Math.max(20, snap(origH + dy));
        if (dir.includes("w")) { w = Math.max(20, snap(origW - dx)); x = snap(origX + origW - w); }
        if (dir.includes("n")) { h = Math.max(20, snap(origH - dy)); y = snap(origY + origH - h); }
        setElements(els => els.map(el => el.id === id ? { ...el, x, y, w, h } : el));
      }
    };
    const onUp = () => {
      if (dragRef.current || resizeRef.current) {
        const id = dragRef.current?.id || resizeRef.current?.id;
        dragRef.current = null;
        resizeRef.current = null;
        setElements(els => { commit(els); return els; });
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [zoom, commit]);

  useEffect(() => {
    const handler = (e) => {
      if (editingText) return;
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") { e.preventDefault(); duplicate(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteSelected, editingText, histIdx, history]);

  const selectedEl = elements.find(e => e.id === selected);
  const sortedEls = [...elements].sort((a,b) => a.zIndex - b.zIndex);

  const bringForward = () => {
    if (!selectedEl) return;
    const maxZ = Math.max(...elements.map(e => e.zIndex));
    commit(elements.map(e => e.id === selected ? { ...e, zIndex: maxZ+1 } : e));
  };
  const sendBackward = () => {
    if (!selectedEl) return;
    const minZ = Math.min(...elements.map(e => e.zIndex));
    commit(elements.map(e => e.id === selected ? { ...e, zIndex: minZ-1 } : e));
  };

  const exportPNG = async () => {
    const { default: html2canvas } = await import("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.esm.js");
    const canvas = await html2canvas(canvasRef.current, { useCORS: true, scale: 2 });
    const a = document.createElement("a"); a.href = canvas.toDataURL(); a.download = "design.png"; a.click();
  };

  const ToolBtn = ({ type, icon, label }) => (
    <button
      onClick={() => addElement(type)}
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:4,
        padding:"10px 8px", border:"1.5px solid #eee", borderRadius:10,
        background:"#fafafa", cursor:"pointer", transition:"all 0.15s",
        fontFamily:"'DM Sans', sans-serif", fontSize:10, color:"#555", fontWeight:600,
        letterSpacing:"0.04em", minWidth:56,
      }}
      onMouseEnter={e => { e.currentTarget.style.background="#f0f0ff"; e.currentTarget.style.borderColor="#5B6CFF"; e.currentTarget.style.color="#5B6CFF"; }}
      onMouseLeave={e => { e.currentTarget.style.background="#fafafa"; e.currentTarget.style.borderColor="#eee"; e.currentTarget.style.color="#555"; }}
    >
      <span style={{ fontSize:18 }}>{icon}</span>
      {label}
    </button>
  );

  const ActionBtn = ({ onClick, icon, label, accent="#5B6CFF" }) => (
    <button onClick={onClick} title={label}
      style={{
        display:"flex", alignItems:"center", gap:5,
        padding:"6px 12px", border:`1.5px solid ${accent}33`, borderRadius:8,
        background:`${accent}0d`, cursor:"pointer", transition:"all 0.15s",
        fontFamily:"'DM Sans', sans-serif", fontSize:12, color:accent, fontWeight:600,
      }}
      onMouseEnter={e => { e.currentTarget.style.background=`${accent}22`; }}
      onMouseLeave={e => { e.currentTarget.style.background=`${accent}0d`; }}
    >
      <span>{icon}</span><span>{label}</span>
    </button>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#f5f5f7", fontFamily:"'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {/* TOP BAR */}
      <div style={{
        height:52, background:"#1a1a2e", display:"flex", alignItems:"center",
        padding:"0 20px", gap:16, boxShadow:"0 2px 12px rgba(0,0,0,0.2)", zIndex:100, flexShrink:0
      }}>
        <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:18, color:"#fff", letterSpacing:"-0.02em", marginRight:8 }}>
          <span style={{ color:"#5B6CFF" }}>✦</span> Canvas
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <ToolBtn type="rect" icon="▭" label="RECT" />
          <ToolBtn type="circle" icon="◯" label="CIRCLE" />
          <ToolBtn type="text" icon="T" label="TEXT" />
          <ToolBtn type="image" icon="⬚" label="IMAGE" />
        </div>
        <div style={{ flex:1 }} />
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <ActionBtn onClick={undo} icon="↩" label="Undo" />
          <ActionBtn onClick={redo} icon="↪" label="Redo" />
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"#ffffff11", borderRadius:8, padding:"4px 10px" }}>
            <button onClick={() => setZoom(z => Math.max(0.25, z-0.1))} style={{ background:"none", border:"none", color:"#aaa", cursor:"pointer", fontSize:16, padding:"0 2px" }}>−</button>
            <span style={{ color:"#ccc", fontSize:12, width:42, textAlign:"center", fontWeight:600 }}>{Math.round(zoom*100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z+0.1))} style={{ background:"none", border:"none", color:"#aaa", cursor:"pointer", fontSize:16, padding:"0 2px" }}>+</button>
          </div>
          <button onClick={() => setShowGrid(g => !g)}
            style={{ padding:"6px 12px", border:"1.5px solid #ffffff22", borderRadius:8, background: showGrid?"#5B6CFF22":"transparent", color: showGrid?"#5B6CFF":"#aaa", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
            ⊞ Grid
          </button>
          <ActionBtn onClick={exportPNG} icon="↓" label="Export PNG" accent="#2A9D8F" />
        </div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        {/* CANVAS AREA */}
        <div style={{ flex:1, overflow:"auto", display:"flex", alignItems:"center", justifyContent:"center", background:"#e8e8ed", padding:40 }}>
          <div style={{
            transform:`scale(${zoom})`, transformOrigin:"center center",
            position:"relative", width:CANVAS_W, height:CANVAS_H,
            background:"#ffffff",
            boxShadow:"0 8px 60px rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.08)",
            borderRadius:4, flexShrink:0,
            backgroundImage: showGrid
              ? `linear-gradient(rgba(91,108,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(91,108,255,0.06) 1px, transparent 1px)`
              : "none",
            backgroundSize: showGrid ? `${GRID_SIZE}px ${GRID_SIZE}px` : "none",
          }}
            ref={canvasRef}
            onMouseDown={() => setSelected(null)}
          >
            {sortedEls.map((el, i) => (
              <CanvasElement key={el.id} el={el} isSelected={selected === el.id}
                zIndex={i+1}
                onSelect={setSelected}
                onDragStart={(e, id) => handleDragStart(e, id)}
                onResizeStart={(e, dir) => handleResizeStart(e, el.id, dir)}
                onDoubleClick={(id) => el.type === "text" && setEditingText(id)}
              />
            ))}
            {elements.length === 0 && (
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#ccc", pointerEvents:"none" }}>
                <div style={{ fontSize:48, marginBottom:12, opacity:0.4 }}>✦</div>
                <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:22, marginBottom:8, color:"#bbb" }}>Your canvas awaits</div>
                <div style={{ fontSize:14, color:"#ccc" }}>Add elements from the toolbar above</div>
              </div>
            )}
          </div>
        </div>

        {/* PROPERTIES PANEL */}
        <div style={{
          width:240, background:"#fff", borderLeft:"1.5px solid #ebebeb",
          display:"flex", flexDirection:"column", flexShrink:0, overflowY:"auto"
        }}>
          {/* LAYERS */}
          <div style={{ borderBottom:"1.5px solid #ebebeb", padding:"14px 16px" }}>
            <div style={{ fontWeight:700, fontSize:11, letterSpacing:"0.1em", color:"#5B6CFF", textTransform:"uppercase", marginBottom:10 }}>
              ◈ Layers ({elements.length})
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:140, overflowY:"auto" }}>
              {[...elements].reverse().map(el => (
                <div key={el.id}
                  onClick={() => setSelected(el.id)}
                  style={{
                    display:"flex", alignItems:"center", gap:8, padding:"5px 8px",
                    borderRadius:6, cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif",
                    background: selected === el.id ? "#f0f0ff" : "transparent",
                    color: selected === el.id ? "#5B6CFF" : "#444",
                    fontWeight: selected === el.id ? 600 : 400,
                    transition:"all 0.12s",
                  }}>
                  <span style={{ fontSize:14 }}>
                    {el.type === "rect" ? "▭" : el.type === "circle" ? "◯" : el.type === "text" ? "T" : "⬚"}
                  </span>
                  <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {el.type === "text" ? el.text.slice(0,18) + (el.text.length>18?"…":"") : `${el.type.charAt(0).toUpperCase()+el.type.slice(1)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <PropertiesPanel
            el={selectedEl}
            onChange={(props) => { if (selectedEl) { const updated = elements.map(e => e.id === selectedEl.id ? { ...e, ...props } : e); commit(updated); } }}
            onDelete={deleteSelected}
            onDuplicate={duplicate}
            onBringForward={bringForward}
            onSendBackward={sendBackward}
          />
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{
        height:28, background:"#1a1a2e", display:"flex", alignItems:"center",
        padding:"0 20px", gap:20, borderTop:"1px solid #2a2a4a", flexShrink:0
      }}>
        {[
          `${elements.length} element${elements.length !== 1 ? "s" : ""}`,
          selectedEl ? `Selected: ${selectedEl.type} · ${Math.round(selectedEl.w)}×${Math.round(selectedEl.h)} at (${Math.round(selectedEl.x)}, ${Math.round(selectedEl.y)})` : "Nothing selected",
          "Del to delete · Ctrl+Z undo · Ctrl+D duplicate"
        ].map((t, i) => (
          <span key={i} style={{ color: i===1 ? "#8b8bcc" : "#555", fontSize:11, fontFamily:"monospace" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}
