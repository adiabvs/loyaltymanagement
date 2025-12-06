# Brand-Customer Relationship & Mapping

## Overview

The system supports **multiple ways** for customers to be associated with brands, allowing flexible relationship management. Customers can see campaigns and interact with brands through various association methods.

## Relationship Types

### 1. **Visit-Based Association** (Automatic)
**How it works:**
- When a customer visits a brand (via QR scan or phone number entry), a `Visit` record is created
- This automatically creates an association between the customer and brand
- The customer will see all campaigns from brands they've visited

**Data Structure:**
```typescript
interface Visit {
  id: string;
  customerId: string;  // Links to customer
  brandId: string;     // Links to brand
  timestamp: Date;
  pointsEarned: number;
  stampsEarned: number;
  amountSpent?: number;
}
```

**Example:**
- Customer visits Brand A → Visit record created
- Customer now sees all campaigns from Brand A

---

### 2. **Phone Number-Based Association** (PRIMARY METHOD - Automatic)
**How it works:**
- **ALWAYS uses last 10 digits of phone number** as the primary method
- System extracts last 10 digits from both customer and brand phone numbers
- Customers see campaigns from brands with **matching last 10 digits**

**Phone Number Extraction:**
```typescript
// Phone: "+1-555-123-4567" → Last 10: "5551234567"
// Phone: "15551234567" → Last 10: "5551234567"
// Phone: "(555) 123-4567" → Last 10: "5551234567"
extractUsername(phoneNumber) {
  const digits = phoneNumber.replace(/\D/g, '');
  return digits.slice(-10); // Last 10 digits
}
```

**Matching Logic (PRIMARY):**
- Customer phone: `"+1-555-123-4567"` → Last 10: `"5551234567"`
- Brand phone: `"+1-555-123-4567"` → Last 10: `"5551234567"`
- **Result:** Customer automatically sees all campaigns from this brand

**Example:**
- Customer phone: `"+1-555-123-4567"` → Last 10: `"5551234567"`
- Brand phone: `"(555) 123-4567"` → Last 10: `"5551234567"`
- **Result:** Customer sees campaigns from this brand (handles different formats)

---

### 4. **Manual Association** (Explicit Linking)
**How it works:**
- Customers can manually associate themselves with brands
- Uses the `/api/customer/associate-brand` endpoint
- Creates a record in `customerBrandAssociations` collection
- Works even if phone numbers don't match

**API Usage:**
```bash
POST /api/customer/associate-brand
{
  "brandId": "brand-id-here"
  // OR
  "brandPhoneNumber": "8660015087"
}
```

**Data Structure:**
```typescript
interface CustomerBrandAssociation {
  customerId: string;
  brandId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Example:**
- Customer phone: `9538703738`
- Brand phone: `8660015087` (different numbers)
- Customer calls `/associate-brand` with brand phone
- **Result:** Customer now sees all campaigns from this brand

---

## Complete Association Flow

When a customer requests promotions (`GET /api/customer/promotions`), the system:

1. **Gets visited brands:**
   ```typescript
   customerVisits → extract brandIds → visitedBrandIds
   ```

2. **Finds phone-matched brands (PRIMARY METHOD):**
   ```typescript
   customerPhone (last 10 digits) → extract last 10 from all brands → compare → phoneMatchedBrands
   ```

4. **Gets manually associated brands:**
   ```typescript
   customerId → query customerBrandAssociations → manuallyAssociatedBrands
   ```

5. **Combines all associations:**
   ```typescript
   associatedBrandIds = phoneMatchedBrands  // PRIMARY: Last 10 digits matching
     ∪ visitedBrandIds                       // Visit history
     ∪ manuallyAssociatedBrands             // Manual associations
   ```

6. **Returns campaigns from all associated brands**

---

## Relationship Diagram

```
Customer
  │
  ├─→ Visits ──────────────→ Brand (Visit-based)
  │     │
  │     └─→ Creates automatic association
  │
  ├─→ Phone (last 10) ───────→ Brand Phone (last 10) (PRIMARY - Phone-based)
  │     │                        │
  │     └─→ "5551234567" ───────┘ (Matching - Always uses this)
  │
  └─→ Manual Association ───→ Brand (Manual)
        │
        └─→ customerBrandAssociations collection
```

---

## Data Models

### Customer
```typescript
interface Customer {
  id: string;
  phoneNumber: string;
  username?: string;  // Explicit or auto-extracted
  role: "customer";
  // ... other fields
}
```

### Brand
```typescript
interface Brand {
  id: string;
  phoneNumber: string;
  username?: string;  // Explicit or auto-extracted
  role: "brand";
  businessName: string;
  // ... other fields
}
```

### Visit (Creates Association)
```typescript
interface Visit {
  id: string;
  customerId: string;  // Foreign key to Customer
  brandId: string;     // Foreign key to Brand
  timestamp: Date;
  // ... other fields
}
```

### CustomerBrandAssociation (Manual Linking)
```typescript
interface CustomerBrandAssociation {
  customerId: string;  // Foreign key to Customer
  brandId: string;     // Foreign key to Brand
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Association Priority

When multiple associations exist, **all are included** (additive):

1. ✅ **PRIMARY:** Phone-based association (last 10 digits matching) - **ALWAYS USED**
2. ✅ Visit-based association (from visit history)
3. ✅ Manual association (explicit linking)

**All associations are additive** - a customer sees campaigns from ALL associated brands.

**Key Point:** The system **ALWAYS** uses the last 10 digits of phone numbers as the primary method to identify associated brands.

---

## Use Cases

### Use Case 1: Same Business Owner
**Scenario:** Business owner has both customer and brand accounts with same phone
- Customer phone: `+1-555-123-4567`
- Brand phone: `+1-555-123-4567`
- **Association:** Automatic via username/phone matching
- **Result:** Owner sees their own brand's campaigns as a customer

### Use Case 2: Different Phone Numbers
**Scenario:** Customer wants to follow a brand with different phone number
- Customer phone: `9538703738`
- Brand phone: `8660015087`
- **Association:** Manual via `/associate-brand` endpoint
- **Result:** Customer can manually link to see campaigns

### Use Case 3: Explicit Username
**Scenario:** Both use same custom username
- Customer username: `"coffeeshop"`
- Brand username: `"coffeeshop"`
- **Association:** Automatic via username matching
- **Result:** Customer sees campaigns regardless of phone numbers

### Use Case 4: Visit History
**Scenario:** Customer visits brand multiple times
- Customer visits Brand A (3 times)
- **Association:** Automatic via visit records
- **Result:** Customer sees all campaigns from Brand A

---

## API Endpoints

### Get Associated Brands (for Customer)
```bash
GET /api/customer/promotions
# Returns campaigns from all associated brands
```

### Manually Associate Brand
```bash
POST /api/customer/associate-brand
Body: { "brandId": "..." } or { "brandPhoneNumber": "..." }
```

### Find Brand by Phone
```bash
POST /api/customer/find-brand-by-phone
Body: { "phoneNumber": "..." }
# Returns brands matching the phone number
```

### Check Username Status
```bash
GET /api/customer/username/check
# Returns username info and whether setup is needed
```

---

## Summary

**Brand-Customer relationships are established through:**

1. **PRIMARY: Phone Matching** - **ALWAYS** uses last 10 digits of phone number to match brands
2. **Visits** - Automatic when customer visits brand (adds to associations)
3. **Manual Association** - Explicit linking via API (for different phone numbers)

**Key Points:**
- **ALWAYS uses last 10 digits of phone number** as the primary method
- Phone number matching is the main way customers see brand campaigns
- All associations are additive (customer sees campaigns from all)
- Visit history adds to associations (doesn't replace phone matching)
- Manual association allows linking regardless of phone numbers

**Benefits:**
- Flexible relationship management
- Automatic discovery via phone numbers
- Manual control when needed
- Multiple fallback mechanisms
- No single point of failure

