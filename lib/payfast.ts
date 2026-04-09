import crypto from 'crypto';

export const PAYFAST_POST_URL = 'https://ipg1.apps.net.pk/Ecommerce/api/Transaction/PostTransaction';
export const PAYFAST_TOKEN_URL = 'https://ipg1.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken';

export const PAYFAST_VALID_IPS = [
  '::1', '127.0.0.1',
];

export interface PaymentParams {
  merchantId: string;
  merchantKey: string; // merchant secured key
  merchantName?: string | null;
  storeId?: string | null;
  passphrase?: string | null; // merchant secret word
  environment?: 'live' | 'sandbox';
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  nameFirst?: string;
  nameLast?: string;
  emailAddress?: string;
  phone?: string;
  amount: string;
  itemName: string;
  itemDescription?: string;
  customStr1?: string;
  customStr2?: string;
  customStr3?: string;
  customStr4?: string;
  mPaymentId?: string;
  currencyCode?: string;
}

export interface SubscriptionParams extends PaymentParams {
  frequency: '3' | '4' | '6';
  recurringAmount: string;
  billingDate?: string;
  cycles?: string;
}

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function getAccessToken(params: PaymentParams, basketId: string) {
  const query = new URLSearchParams({
    MERCHANT_ID: params.merchantId,
    SECURED_KEY: params.merchantKey,
    TXNAMT: params.amount,
    BASKET_ID: basketId,
    CURRENCY_CODE: params.currencyCode || 'PKR',
  });

  const response = await fetch(`${PAYFAST_TOKEN_URL}?${query.toString()}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.ACCESS_TOKEN) {
    throw new Error(data?.MESSAGE || data?.message || 'Unable to get PayFast access token');
  }

  return data.ACCESS_TOKEN as string;
}

function buildSignature(params: PaymentParams, basketId: string) {
  return sha256(`${params.merchantId}:${params.merchantKey}:${params.amount}:${basketId}`);
}

export function verifySignature(data: Record<string, string>, securedKey?: string | null, merchantId?: string | null): boolean {
  const validationHash = data.validation_hash || data.VALIDATION_HASH || '';
  const basketId = data.basket_id || data.BASKET_ID || '';
  const errCode = data.err_code || data.ERR_CODE || '';

  if (!validationHash || !basketId || !securedKey || !merchantId) return false;

  const calculated = sha256(`${basketId}|${securedKey}|${merchantId}|${errCode}`);
  return validationHash === calculated;
}

export async function buildPaymentForm(params: PaymentParams): Promise<{
  actionUrl: string;
  fields: Record<string, string>;
}> {
  const basketId = params.mPaymentId || `PF-${Date.now()}`;
  const token = await getAccessToken(params, basketId);
  const signature = buildSignature(params, basketId);
  const orderDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

  return {
    actionUrl: PAYFAST_POST_URL,
    fields: {
      MERCHANT_ID: params.merchantId,
      MERCHANT_NAME: params.merchantName || 'GoPayFast Merchant',
      TOKEN: token,
      PROCCODE: '00',
      TXNAMT: params.amount,
      CUSTOMER_MOBILE_NO: params.phone || '',
      CUSTOMER_EMAIL_ADDRESS: params.emailAddress || '',
      SIGNATURE: signature,
      VERSION: 'APP-GOPAYFAST-1.0',
      TXNDESC: params.itemDescription || params.itemName,
      SUCCESS_URL: encodeURIComponent(params.returnUrl),
      FAILURE_URL: encodeURIComponent(params.cancelUrl),
      BASKET_ID: basketId,
      ORDER_DATE: orderDate,
      CHECKOUT_URL: encodeURIComponent(params.notifyUrl),
      TRAN_TYPE: 'ECOMM_PURCHASE',
      STORE_ID: params.storeId || '',
      CURRENCY_CODE: params.currencyCode || 'PKR',
    },
  };
}

export async function getTemporaryToken(params: any) {
  const query = new URLSearchParams({
    merchant_user_id: params.merchantUserId,
    user_mobile_number: params.userMobileNumber,
    basket_id: params.basketId,
    txnamt: params.amount,
    account_type: params.accountType || '4',
    bank_code: params.bankCode,
    cnic_number: params.cnicNumber,
    account_number: params.accountNumber,
    account_title: params.accountTitle,
  });

  const response = await fetch(`https://ipg1.apps.net.pk/Ecommerce/api/Transaction/token?${query.toString()}`, {
    headers: { 'Authorization': `Bearer ${params.token}` }
  });
  return await response.json();
}

export async function performTokenizedTransaction(params: any) {
  const query = new URLSearchParams({
    instrument_token: params.instrumentToken,
    transaction_id: params.transactionId,
    merchant_user_id: params.merchantUserId,
    user_mobile_number: params.userMobileNumber,
    basket_id: params.basketId,
    order_date: params.orderDate,
    txndesc: params.description,
    txnamt: params.amount,
    otp: params.otp,
  });

  const response = await fetch(`https://ipg1.apps.net.pk/Ecommerce/api/Transaction/tokenized?${query.toString()}`, {
    headers: { 'Authorization': `Bearer ${params.token}` }
  });
  return await response.json();
}

export async function addPermanentInstrument(params: any) {
  const query = new URLSearchParams({
    // Parameters for adding permanent instrument as per docs
    instrument_token: params.instrumentToken,
    merchant_user_id: params.merchantUserId,
    user_mobile_number: params.userMobileNumber,
    // ... other required fields
  });

  const response = await fetch(`https://ipg1.apps.net.pk/Ecommerce/api/Transaction/add-permanent-payment-instrument?${query.toString()}`, {
    headers: { 'Authorization': `Bearer ${params.token}` }
  });
  return await response.json();
}


