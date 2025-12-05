# Firestore Indexes

This document lists the composite indexes that can be created in Firestore for better query performance. These are optional - the application will work without them by sorting in memory, but indexes improve performance for large datasets.

## Required Indexes (Optional for Performance)

### Visits Collection

#### Index 1: brandId + timestamp
**Collection:** `visits`  
**Fields:**
- `brandId` (Ascending)
- `timestamp` (Descending)

**Query:** Filter by brandId and order by timestamp (descending)

**Create via Firebase Console:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore Database → Indexes
4. Click "Create Index"
5. Collection ID: `visits`
6. Add fields:
   - Field: `brandId`, Order: Ascending
   - Field: `timestamp`, Order: Descending
7. Click "Create"

**Or use the direct link from error message:**
The error message will provide a direct link to create the index. Click it to auto-create.

#### Index 2: customerId + timestamp
**Collection:** `visits`  
**Fields:**
- `customerId` (Ascending)
- `timestamp` (Descending)

**Query:** Filter by customerId and order by timestamp (descending)

**Create via Firebase Console:**
Same process as above, but use:
- Field: `customerId`, Order: Ascending
- Field: `timestamp`, Order: Descending

## Current Implementation

The application currently sorts results in memory to avoid requiring indexes. This works fine for small to medium datasets but may be slower for very large collections.

## When to Create Indexes

- **Small datasets (< 1000 documents)**: Not necessary, in-memory sorting is fine
- **Medium datasets (1000-10,000 documents)**: Optional, but recommended
- **Large datasets (> 10,000 documents)**: Highly recommended for performance

## Creating Indexes via Firebase CLI

You can also create indexes programmatically using `firebase.json`:

```json
{
  "firestore": {
    "indexes": {
      "indexes": [
        {
          "collectionGroup": "visits",
          "queryScope": "COLLECTION",
          "fields": [
            {
              "fieldPath": "brandId",
              "order": "ASCENDING"
            },
            {
              "fieldPath": "timestamp",
              "order": "DESCENDING"
            }
          ]
        },
        {
          "collectionGroup": "visits",
          "queryScope": "COLLECTION",
          "fields": [
            {
              "fieldPath": "customerId",
              "order": "ASCENDING"
            },
            {
              "fieldPath": "timestamp",
              "order": "DESCENDING"
            }
          ]
        }
      ]
    }
  }
}
```

Then deploy with: `firebase deploy --only firestore:indexes`

