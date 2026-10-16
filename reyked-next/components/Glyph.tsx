import type { GlyphKey } from "@/data/productos";

/* Íconos de producto del prototipo (viewBox 48, trazo con currentColor). */
const PATHS: Record<GlyphKey, React.ReactNode> = {
  bottle: (<><path d="M19 5h10v6l4 5v26a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V16l4-5z" /><path d="M15 24h18M15 33h18" /></>),
  bucket: (<><path d="M8 14h32l-4 27a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2z" /><ellipse cx="24" cy="14" rx="16" ry="4" /><path d="M12 8c4-5 20-5 24 0" /></>),
  mop: (<><path d="M34 4L22 30" /><path d="M10 34h28l-3 8H13z" /><path d="M16 34l6-4M32 34l-6-4" /></>),
  cone: (<><path d="M20 6h8l9 32H11z" /><path d="M16 22h16M13 31h22" /><path d="M6 42h36" /></>),
  tape: (<><rect x="4" y="16" width="40" height="16" rx="1" /><path d="M12 16l-6 16M22 16l-6 16M32 16l-6 16M42 16l-6 16" /></>),
  stacker: (<><path d="M12 4v36M12 8h8M12 30h22l-3 8" /><path d="M8 40h10M26 40h14" /><circle cx="10" cy="43" r="2" /><circle cx="35" cy="43" r="2" /></>),
  bin: (<><path d="M10 12h28l-3 30H13z" /><path d="M6 12h36M18 12V7h12v5M19 20v16M29 20v16" /></>),
  mirror: (<><circle cx="24" cy="19" r="14" /><path d="M24 33v11M17 44h14" /><path d="M16 14c2-3 6-4 9-3" /></>),
  bump: (<><path d="M4 36c6-14 34-14 40 0z" /><path d="M13 31l-2 5M24 28v8M35 31l2 5" /></>),
  light: (<><path d="M16 38V24a8 8 0 0 1 16 0v14" /><path d="M10 38h28v6H10z" /><path d="M24 4v5M8 12l4 3M40 12l-4 3" /></>),
  chain: (<><rect x="3" y="17" width="18" height="14" rx="7" /><rect x="27" y="17" width="18" height="14" rx="7" /><path d="M15 24h18" /></>),
  thermo: (<><path d="M20 28V8a4 4 0 0 1 8 0v20a8 8 0 1 1-8 0z" /><path d="M24 14v18" /></>),
  sign: (<><path d="M24 4L8 42h32z" /><path d="M24 18v12" /><circle cx="24" cy="35" r="1.2" /></>),
  step: (<><path d="M4 36h12v-8h12v-8h16" /><path d="M4 42h40" /><path d="M6 33h8M18 25h8M30 17h12" strokeDasharray="3 3" /></>),
  roll: (<><rect x="8" y="6" width="24" height="30" rx="12" /><circle cx="20" cy="21" r="4" /><path d="M32 12h8v30H14v-6" /></>),
  ramp: (<><path d="M4 38l40-14v14z" /><path d="M4 42h40" /><path d="M14 31v7M24 28v10M34 25v13" /></>),
};

export function Glyph({ g }: { g: GlyphKey }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round">
      {PATHS[g]}
    </svg>
  );
}
