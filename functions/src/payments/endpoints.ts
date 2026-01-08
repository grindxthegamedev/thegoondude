/**
 * Payment HTTP Endpoints
 * Cloud Functions for payment processing
 */

import { onRequest } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import {
    generatePaymentUrl,
    verifyIPNSignature,
    parseIPNPayload,
    type PaymentRequest,
} from './payblis';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const BASE_URL = process.env.BASE_URL || 'https://thegoondude.com';

/**
 * Create a payment session for site submission
 */
export const createPayment = onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { siteId, email, name } = req.body;

        if (!siteId || !email) {
            res.status(400).json({ error: 'Missing siteId or email' });
            return;
        }

        // Create payment record in Firestore
        const paymentRef = await db.collection('payments').add({
            siteId,
            email,
            amount: 20.00,
            currency: 'USD',
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Generate Payblis payment URL
        const paymentRequest: PaymentRequest = {
            amount: '20.00',
            currency: 'USD',
            productName: 'LustList 411 Site Submission',
            refOrder: paymentRef.id,
            customerEmail: email,
            customerName: name || 'Customer',
            customerFirstName: '',
            country: 'US',
            userIP: req.ip || '127.0.0.1',
            urlOK: `${BASE_URL}/submit/success?ref=${paymentRef.id}`,
            urlKO: `${BASE_URL}/submit/failed?ref=${paymentRef.id}`,
            ipnURL: `${BASE_URL}/api/payments/ipn`,
        };

        const paymentUrl = generatePaymentUrl(paymentRequest, false);

        res.json({ paymentUrl, paymentId: paymentRef.id });
    } catch (error) {
        logger.error('Payment creation error:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
});

/**
 * IPN webhook for Payblis callbacks
 */
export const ipnWebhook = onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    try {
        const signature = req.headers['x-payblis-signature'] as string;
        const rawPayload = JSON.stringify(req.body);

        // Verify signature
        if (!signature || !verifyIPNSignature(rawPayload, signature)) {
            logger.warn('Invalid IPN signature');
            res.status(400).send('Invalid signature');
            return;
        }

        const payload = parseIPNPayload(rawPayload);
        logger.info('IPN received:', payload);

        // Update payment status in Firestore
        const paymentRef = db.collection('payments').doc(payload.merchant_reference);
        const paymentDoc = await paymentRef.get();

        if (!paymentDoc.exists) {
            logger.warn('Payment not found:', payload.merchant_reference);
            res.status(404).send('Payment not found');
            return;
        }

        if (payload.status === 'SUCCESS') {
            await paymentRef.update({
                status: 'completed',
                transactionId: payload.transaction_id,
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Update site status to processing
            const paymentData = paymentDoc.data();
            if (paymentData?.siteId) {
                await db.collection('sites').doc(paymentData.siteId).update({
                    status: 'processing',
                    paymentId: payload.merchant_reference,
                });
            }

            logger.info('Payment completed:', payload.merchant_reference);
        } else {
            await paymentRef.update({
                status: 'failed',
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            logger.info('Payment failed:', payload.merchant_reference);
        }

        res.status(200).send('OK');
    } catch (error) {
        logger.error('IPN processing error:', error);
        res.status(500).send('Processing error');
    }
});
