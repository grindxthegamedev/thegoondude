/**
 * Gemini AI Client
 * Configuration for Vertex AI Gemini
 */

import { VertexAI, SchemaType } from '@google-cloud/vertexai';
import * as logger from 'firebase-functions/logger';

// Vertex AI configuration
const PROJECT_ID = process.env.VERTEX_AI_PROJECT || 'lustlist411';
const LOCATION = 'global';
const MODEL = 'gemini-3-flash-preview';
// Use the correct global endpoint (not global-aiplatform)
const API_ENDPOINT = 'aiplatform.googleapis.com';

logger.info('Vertex AI Config:', { PROJECT_ID, LOCATION, MODEL, API_ENDPOINT });

let vertexAI: VertexAI | null = null;

/**
 * Get Vertex AI client (singleton)
 */
export function getVertexAI(): VertexAI {
    if (!vertexAI) {
        logger.info('Initializing VertexAI client...', { project: PROJECT_ID, location: LOCATION, apiEndpoint: API_ENDPOINT });
        vertexAI = new VertexAI({
            project: PROJECT_ID,
            location: LOCATION,
            apiEndpoint: API_ENDPOINT,
        });
        logger.info('VertexAI client initialized');
    }
    return vertexAI;
}

// Response schema for review output
export const REVIEW_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        title: { type: SchemaType.STRING },
        content: { type: SchemaType.STRING },
        excerpt: { type: SchemaType.STRING },
        pros: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        cons: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        rating: { type: SchemaType.NUMBER },
    },
    required: ['title', 'content', 'excerpt', 'pros', 'cons', 'rating'],
};

// Response schema for analysis output
export const ANALYSIS_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        contentType: { type: SchemaType.STRING },
        designNotes: { type: SchemaType.STRING },
        uniqueFeatures: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        targetAudience: { type: SchemaType.STRING },
        preliminaryPros: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        preliminaryCons: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        suggestedRating: { type: SchemaType.NUMBER },
    },
    required: ['contentType', 'designNotes', 'uniqueFeatures', 'targetAudience', 'preliminaryPros', 'preliminaryCons', 'suggestedRating'],
};

/**
 * Get generative model for reviews
 */
export function getTextModel() {
    logger.info('Getting text model:', MODEL);
    return getVertexAI().getGenerativeModel({
        model: MODEL,
        generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.8,
            topP: 0.95,
            responseMimeType: 'application/json',
            responseSchema: REVIEW_SCHEMA,
        },
    });
}

/**
 * Get generative model for analysis
 */
export function getAnalysisModel() {
    logger.info('Getting analysis model:', MODEL);
    return getVertexAI().getGenerativeModel({
        model: MODEL,
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.9,
            responseMimeType: 'application/json',
            responseSchema: ANALYSIS_SCHEMA,
        },
    });
}
