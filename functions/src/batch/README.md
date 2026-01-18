# Batch Processing Module

Automated batch review processing for multiple sites.

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `adminStartBatchReview` | Start processing pending sites |
| `adminStopBatchReview` | Stop current batch job |
| `adminGetBatchStatus` | Get progress and status |

## Features

- **Exponential Backoff**: 2s → 4s → 8s delays on retry
- **Skip on Error**: After 3 failures, moves to next site
- **Stop Signal**: Check Firestore between sites for stop flag
- **Progress Tracking**: Real-time updates in `batchJobs` collection

## Firestore Schema

```
batchJobs/{jobId}
├── status: 'running' | 'stopped' | 'completed' | 'failed'
├── totalSites: number
├── processedCount: number
├── successCount: number
├── errorCount: number
├── currentSiteId: string | null
├── currentSiteName: string | null
├── skipList: string[]
├── errors: Array<{siteId, name, error, timestamp}>
├── startedAt: Timestamp
├── lastUpdatedAt: Timestamp
└── stoppedAt: Timestamp | null
```
