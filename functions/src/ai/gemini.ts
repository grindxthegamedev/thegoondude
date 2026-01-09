/**
 * Gemini AI Client
 * Configuration for Vertex AI Gemini
 */

import { VertexAI, SchemaType, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';
import * as logger from 'firebase-functions/logger';

// Vertex AI configuration
const PROJECT_ID = process.env.VERTEX_AI_PROJECT || 'lustlist411';
const LOCATION = 'global';
const MODEL = 'gemini-3-flash-preview';
// Use the correct global endpoint (not global-aiplatform)
const API_ENDPOINT = 'aiplatform.googleapis.com';

logger.info('Vertex AI Config:', { PROJECT_ID, LOCATION, MODEL, API_ENDPOINT });

let vertexAI: VertexAI | null = null;
const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

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
        safetySettings: SAFETY_SETTINGS,
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
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.9,
            responseMimeType: 'application/json',
            responseSchema: ANALYSIS_SCHEMA,
        },
    });
}

// Response schema for vision analysis
export const VISION_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        layoutQuality: { type: SchemaType.STRING },
        colorScheme: { type: SchemaType.STRING },
        contentDensity: { type: SchemaType.STRING },
        adDensity: { type: SchemaType.STRING },
        uiObservations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        visualPros: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        visualCons: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    },
    required: ['layoutQuality', 'colorScheme', 'contentDensity', 'uiObservations'],
};

/**
 * Get generative model for vision/screenshot analysis
 */
export function getVisionModel() {
    logger.info('Getting vision model:', MODEL);
    return getVertexAI().getGenerativeModel({
        model: MODEL,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.5,
            topP: 0.9,
            responseMimeType: 'application/json',
            responseSchema: VISION_SCHEMA,
        },
    });
}
