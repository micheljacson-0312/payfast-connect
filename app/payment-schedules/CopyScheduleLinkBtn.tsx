'use client';

export default function CopyScheduleLinkBtn({ url }: { url: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(url)}
      style={{ width:'100%', background:'transparent', border:'1px solid var(--border)', color:'var(--gray)', padding:'7px 10px', borderRadius:7, fontSize:11, cursor:'pointer' }}
    >
      Copy
    </button>
  );
}
