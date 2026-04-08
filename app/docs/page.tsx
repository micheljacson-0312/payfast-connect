import Sidebar from '@/components/Sidebar';

export default function DocsPage() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content" style={{ padding: '28px 32px', maxWidth: 900 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Docs</h1>
        <p style={{ color: 'var(--gray)', marginBottom: 24 }}>Quick links for the current application documentation.</p>
        <div style={{ display: 'grid', gap: 14 }}>
          <a href="https://github.com/micheljacson-0312/payfast-connect/blob/main/CURRENT-DOCS.md" target="_blank" style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:18, textDecoration:'none', color:'white' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Current Docs</div>
            <div style={{ color: 'var(--gray)', fontSize: 13 }}>Open the current markdown documentation in GitHub.</div>
          </a>
          <a href="https://github.com/micheljacson-0312/payfast-connect/blob/main/PayFast-Connect-Docs.docx" target="_blank" style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:18, textDecoration:'none', color:'white' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Project Docx</div>
            <div style={{ color: 'var(--gray)', fontSize: 13 }}>Open the updated Word document stored in the repository.</div>
          </a>
          <a href="https://github.com/micheljacson-0312/payfast-connect" target="_blank" style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:18, textDecoration:'none', color:'white' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Repository</div>
            <div style={{ color: 'var(--gray)', fontSize: 13 }}>Open the source code repository.</div>
          </a>
        </div>
      </div>
    </div>
  );
}
