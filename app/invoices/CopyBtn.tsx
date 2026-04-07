'use client';
export default function CopyBtn({ text }: { text: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      style={{ background:'transparent', border:'1px solid var(--border)', color:'var(--gray)', padding:'4px 8px', borderRadius:6, fontSize:11, cursor:'pointer' }}
    >🔗</button>
  );
}
