import Sidebar from '@/components/Sidebar';

export default function SupportPage() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content" style={{ padding: '28px 32px', maxWidth: 900 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Support</h1>
        <p style={{ color: 'var(--gray)', marginBottom: 24 }}>Use the channels below for deployment, onboarding, or payment gateway support.</p>
        <div style={{ display: 'grid', gap: 14 }}>
          <a href="mailto:support@10xdigitalventures.com?subject=GoPayFast%20Connect%20Support" style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:18, textDecoration:'none', color:'white' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Email Support</div>
            <div style={{ color: 'var(--gray)', fontSize: 13 }}>support@10xdigitalventures.com</div>
          </a>
          <a href="https://wa.me/923000000000" target="_blank" style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:18, textDecoration:'none', color:'white' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>WhatsApp Support</div>
            <div style={{ color: 'var(--gray)', fontSize: 13 }}>Open support chat on WhatsApp.</div>
          </a>
        </div>
      </div>
    </div>
  );
}
