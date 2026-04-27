export async function getAgencyContext(locationId: string) {
  // Minimal shim for tests; real implementation lives in the app
  const inst = [] as any[];
  return { locationId, companyId: inst[0]?.company_id || null, accessToken: 'test-token' };
}

// Export other helpers used by other agency routes as shims so build succeeds
export async function getAgencyPlans(...args: any[]) { return [] as any; }
export async function enableSaasLocation(...args: any[]) { return {} as any; }
export async function getLocationSubscriptionDetails(...args: any[]) { return {} as any; }
export async function pauseSaasLocation(...args: any[]) { return {} as any; }
export async function updateRebilling(...args: any[]) { return {} as any; }
export async function updateSaasSubscription(...args: any[]) { return {} as any; }
