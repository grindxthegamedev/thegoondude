/**
 * Payblis Payment Integration
 * Backend utilities for processing payments via Payblis
 */

import * as crypto from 'crypto';

// Payblis configuration from environment
const PAYBLIS_API_KEY = process.env.PAYBLIS_API_KEY || '';
const PAYBLIS_SECRET = process.env.PAYBLIS_SECRET_KEY || '';
const PAYBLIS_BASE_URL = 'https://pay.payblis.com/api';

export interface PaymentRequest {
    amount: string;
    currency: 'USD' | 'EUR' | 'CAD';
    productName: string;
    refOrder: string;
    customerEmail: string;
    customerName: string;
    customerFirstName: string;
    country: string;
    userIP: string;
    urlOK: string;
    urlKO: string;
    ipnURL: string;
}

export interface IPNPayload {
    event: 'payment.success' | 'payment.failed';
    merchant_reference: string;
    transaction_id: string;
    amount: string;
    status: 'SUCCESS' | 'FAILED';
    signature: string;
}

/**
 * Generate Payblis payment URL
 */
export function generatePaymentUrl(request: PaymentRequest, sandbox = false): string {
    const params: Record<string, string> = {
        MerchantKey: PAYBLIS_API_KEY,
        sandbox: sandbox ? 'true' : 'false',
        amount: request.amount,
        currency: request.currency,
        product_name: request.productName,
        method: 'credit_cards',
        RefOrder: request.refOrder,
        Customer_Email: request.customerEmail,
        Customer_Name: request.customerName,
        Customer_FirstName: request.customerFirstName,
        country: request.country,
        userIP: request.userIP,
        lang: 'en',
        store_name: 'LustList 411',
        urlOK: request.urlOK,
        urlKO: request.urlKO,
        ipnURL: request.ipnURL,
    };

    const serialized = phpSerialize(params);
    const encoded = Buffer.from(serialized).toString('base64');

    return `${PAYBLIS_BASE_URL}/payment_gateway.php?token=${encoded}`;
}

/**
 * Verify IPN signature
 */
export function verifyIPNSignature(payload: string, signature: string): boolean {
    if (!PAYBLIS_SECRET) return false;

    const expectedSignature = crypto
        .createHmac('sha256', PAYBLIS_SECRET)
        .update(payload)
        .digest('hex');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(signature)
        );
    } catch {
        return false;
    }
}

/**
 * Parse IPN payload
 */
export function parseIPNPayload(rawPayload: string): IPNPayload {
    return JSON.parse(rawPayload) as IPNPayload;
}

/**
 * PHP-style serialize for object (simplified)
 */
function phpSerialize(obj: Record<string, string>): string {
    const entries = Object.entries(obj);
    let result = `a:${entries.length}:{`;

    for (const [key, value] of entries) {
        result += `s:${key.length}:"${key}";`;
        result += `s:${value.length}:"${value}";`;
    }

    result += '}';
    return result;
}
