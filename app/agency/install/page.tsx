import Link from 'next/link';

export default function AgencyInstallPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const clientId = process.env.AGENCY_GHL_CLIENT_ID || process.env.GHL_CLIENT_ID!;
  const redirect = `${appUrl}/agency/oauth/callback`;

  const scopes = [
    'contacts.readonly',
    'contacts.write',
    'opportunities.readonly',
    'opportunities.write',
    'locations.readonly',
    'payments.readonly',
    'payments.write',
  ].join(' ');

  const oauthUrl =
    `https://marketplace.gohighlevel.com/oauth/chooselocation` +
    `?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&scope=${encodeURIComponent(scopes)}`;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 60px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/agency" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'var(--blue)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M13 2L4.5 13H11L10 22L19.5 11H13L13 2Z"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>GoPayFast Agency</div>
            <div style={{ fontSize: 11, color: 'var(--gray)' }}>10x Digital Ventures</div>
          </div>
        </Link>
      </nav>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 24, padding: 48, width: '100%', maxWidth: 560 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, marginBottom: 10 }}>Connect GoPayFast Agency App</div>
            <p style={{ color: 'var(--gray)', fontSize: 14, lineHeight: 1.7 }}>
              This install path is for the agency-facing marketplace app. Use it for 10x Digital Ventures level billing, revenue control, and overall client billing management.
            </p>
          </div>

          <div style={{ background: 'var(--dark3)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            {['Agency billing dashboard', 'Client subscription oversight', 'Agency credential management', 'Revenue and suspension controls'].map((text) => (
              <div key={text} style={{ padding: '7px 0', fontSize: 13 }}>{text}</div>
            ))}
          </div>

          <a href={oauthUrl} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: 'var(--blue)', color: 'white', padding: '15px', borderRadius: 10, fontSize: 15, fontWeight: 500 }}>
            Connect Agency App
          </a>
        </div>
      </main>
    </div>
  );
}
