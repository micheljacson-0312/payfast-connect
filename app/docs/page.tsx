export default function DocsPage() {
  return (
    <div className="page-shell-dark" style={{ padding: '36px 20px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      <div className="page-container">
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 34, fontWeight: 800, marginBottom: 8 }}>Docs</h1>
        <p style={{ color: '#8AA0C8', marginBottom: 10 }}>
          Quick links for the current application documentation.
        </p>
        <div style={{ background: 'rgba(12, 22, 48, 0.88)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 24, color: '#C9D7F2', fontSize: 13, lineHeight: 1.7 }}>
          <strong>Path guide:</strong> `Merchant Application` is for onboarding merchants, `CRM Sub-Account Install` is for client accounts, and `Agency Install` is only for the agency-facing dashboard. If you are already installed as an agency, the homepage button opens `/agency` instead of the install flow.
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <a href="https://github.com/micheljacson-0312/payfast-connect/blob/main/CURRENT-DOCS.md" target="_blank" style={{ background:'rgba(12, 22, 48, 0.88)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:18, textDecoration:'none', color:'white' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Current Docs</div>
            <div style={{ color: '#8AA0C8', fontSize: 13 }}>Open the current markdown documentation in GitHub.</div>
          </a>
          <a href="https://github.com/micheljacson-0312/payfast-connect/blob/main/PayFast-Connect-Docs.docx" target="_blank" style={{ background:'rgba(12, 22, 48, 0.88)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:18, textDecoration:'none', color:'white' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Project Docx</div>
            <div style={{ color: '#8AA0C8', fontSize: 13 }}>Open the updated Word document stored in the repository.</div>
          </a>
          <a href="https://github.com/micheljacson-0312/payfast-connect" target="_blank" style={{ background:'rgba(12, 22, 48, 0.88)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:18, textDecoration:'none', color:'white' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Repository</div>
            <div style={{ color: '#8AA0C8', fontSize: 13 }}>Open the source code repository.</div>
          </a>
        </div>
      </div>
    </div>
  );
}
