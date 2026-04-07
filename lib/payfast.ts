import crypto from 'crypto';

export const PAYFAST_LIVE_URL    = 'https://gopayfast.com/pg/pay';
export const PAYFAST_SANDBOX_URL = 'https://sandbox.gopayfast.com/pg/pay';

// Leave this empty until GoPayFast documents fixed webhook IPs.
// The previous South Africa PayFast IPs would reject valid GoPayFast callbacks.
export const PAYFAST_VALID_IPS = [
  '::1', '127.0.0.1', // for sandbox testing
];

export function getPayfastActionUrl(environment: 'live' | 'sandbox' = 'live') {
  return environment === 'sandbox' ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL;
}

/**
 * Generate GoPayFast MD5 signature
 */
export function generateSignature(
  data: Record<string, string>,
  passphrase?: string | null
): string {
  // Remove empty values
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== '' && v != null)
  );

  // Build query string (URL-encoded, spaces as +)
  let pfString = Object.entries(filtered)
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim()).replace(/%20/g, '+')}`)
    .join('&');

  if (passphrase) {
    pfString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }

  return crypto.createHash('md5').update(pfString).digest('hex');
}

/**
 * Verify GoPayFast ITN signature
 */
export function verifySignature(
  data: Record<string, string>,
  passphrase?: string | null
): boolean {
  const received = data.signature;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { signature: _, ...rest } = data;
  const calculated = generateSignature(rest, passphrase);
  return received === calculated;
}

/**
 * Build GoPayFast payment params for a one-time payment
 */
export interface PaymentParams {
  merchantId:   string;
  merchantKey:  string;
  passphrase?:  string | null;
  environment?: 'live' | 'sandbox';
  returnUrl:    string;
  cancelUrl:    string;
  notifyUrl:    string;
  nameFirst?:   string;
  nameLast?:    string;
  emailAddress?: string;
  amount:       string;
  itemName:     string;
  itemDescription?: string;
  customStr1?:  string; // CRM contact ID
  customStr2?:  string; // CRM location ID
  customStr3?:  string; // payment DB id
  customStr4?:  string; // public source metadata
  mPaymentId?:  string;
}

export function buildPaymentForm(params: PaymentParams): {
  actionUrl: string;
  fields: Record<string, string>;
  signature: string;
} {
  const fields: Record<string, string> = {
    store_id:       params.merchantId,
    store_password: params.merchantKey,
    return_url:     params.returnUrl,
    cancel_url:     params.cancelUrl,
    notify_url:     params.notifyUrl,
    name_first:     params.nameFirst    || '',
    name_last:      params.nameLast     || '',
    email_address:  params.emailAddress || '',
    amount:         params.amount,
    item_name:      params.itemName,
    item_description: params.itemDescription || '',
    custom_str1:    params.customStr1 || '',
    custom_str2:    params.customStr2 || '',
    custom_str3:    params.customStr3 || '',
    custom_str4:    params.customStr4 || '',
    m_payment_id:   params.mPaymentId || Date.now().toString(),
  };

  // Remove empty fields before signing
  const forSigning = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== '')
  );

  const signature = generateSignature(forSigning, params.passphrase);

  return {
    actionUrl: getPayfastActionUrl(params.environment),
    fields: { ...forSigning, signature },
    signature,
  };
}

/**
 * Build subscription payment params
 */
export interface SubscriptionParams extends PaymentParams {
  frequency:        '3' | '4' | '6'; // 3=monthly 4=quarterly 6=annual
  recurringAmount:  string;
  billingDate?:     string; // YYYY-MM-DD
  cycles?:          string; // 0 = infinite
}

export function buildSubscriptionForm(params: SubscriptionParams): {
  actionUrl: string;
  fields: Record<string, string>;
  signature: string;
} {
  // 1. Build the base one-time fields (includes signature)
  const base = buildPaymentForm(params);

  // 2. Strip the signature — we'll re-sign after adding subscription fields
  const { signature: _baseSig, ...baseWithoutSig } = base.fields;

  // 3. Merge subscription-specific fields
  const fieldsToSign: Record<string, string> = {
    ...baseWithoutSig,
    subscription_type: '1',
    billing_date:      params.billingDate || new Date().toISOString().split('T')[0],
    recurring_amount:  params.recurringAmount,
    frequency:         params.frequency,
    cycles:            params.cycles || '0',
  };

  // 4. Re-sign with all fields including subscription ones
  const signature = generateSignature(fieldsToSign, params.passphrase);

  return {
    actionUrl: getPayfastActionUrl(params.environment),
    fields:    { ...fieldsToSign, signature },
    signature,
  };
}
