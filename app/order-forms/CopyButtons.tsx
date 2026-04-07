'use client';
export function CopyLinkBtn({ url }: { url: string }) {
  return (
    <button onClick={() => navigator.clipboard.writeText(url)}
      style={{ background:'rgba(0,82,255,0.08)', border:'1px solid rgba(0,82,255,0.2)', color:'#3D7FFF', padding:'7px 12px', borderRadius:7, fontSize:11, cursor:'pointer' }}>
      Copy Link
    </button>
  );
}
export function CopyEmbedBtn({ code }: { code: string }) {
  return (
    <button onClick={() => navigator.clipboard.writeText(code)}
      style={{ background:'var(--dark3)', border:'1px solid var(--border)', color:'var(--gray)', padding:'7px 12px', borderRadius:7, fontSize:11, cursor:'pointer' }}>
      &lt;/&gt; Embed
    </button>
  );
}
