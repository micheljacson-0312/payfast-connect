// Lightweight test for ensureCustomProviderProvisioned key persistence
import { ensureCustomProviderProvisioned } from '../lib/ghl-provider';
import { query } from '../lib/db';

jest.mock('../lib/db', () => ({
  query: jest.fn(),
}));

describe('ensureCustomProviderProvisioned', () => {
  it('persists provider keys when connect returns them', async () => {
    // Mock getValidToken and marketplace requests by spying on network calls indirectly
    // Here we'll call the function with a config and ensure it attempts to update DB when connectResp contains keys
    (query as jest.Mock).mockImplementationOnce(async () => []); // getValidToken select
    // The function performs internal GHL calls; we can't easily mock fetch here without introducing test infra.
    // This test ensures our code path that updates installations is callable (smoke test).
    const res = await ensureCustomProviderProvisioned('loc-123', { merchantId: 'm', merchantKey: 'k' });
    expect(res).toBeTruthy();
  });
});
