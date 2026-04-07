'use client';
export default function CopyLinkBtn({ url }: { url: string }) {
  return (
    <button onClick={() => navigator.clipboard.writeText(url)}
      style={{ background:'rgba(0,82,255,0.08)', border:'1px solid rgba(0,82,255,0.2)', color:'#3D7FFF', padding:'7px 14px', borderRadius:7, fontSize:12, cursor:'pointer' }}>
      Copy Link
    </button>
  );
}
