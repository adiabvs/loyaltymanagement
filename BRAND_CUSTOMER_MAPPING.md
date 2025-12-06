# Brand-Customer Mapping Using Last 10 Digits of Phone Number

## Overview

The system **ALWAYS uses the last 10 digits of phone numbers** as the primary method to automatically associate customers with brands. This is the main way customers see campaigns from brands - by matching the last 10 digits of their phone numbers.

## How It Works

### 1. Username Extraction

When a user (customer or brand) is created, if no explicit username is provided, the system automatically extracts the last 10 digits from their phone number:

```typescript
// Example:
Phone: "+1-555-123-4567" or "15551234567"
Extracted Username: "5551234567" (last 10 digits)
```

### 2. Mapping Logic

When a customer requests promotions, the system:

1. **Extracts customer's username:**
   - Uses explicit username if set
   - Otherwise extracts last 10 digits from phone number

2. **Finds associated brands (in priority order):**
   - **PRIMARY:** Brands with matching last 10 digits of phone number
   - Brands the customer has visited (via visits)
   - Manually associated brands (via API)

3. **Shows campaigns from all associated brands**

### 3. Example Scenarios

#### Scenario 1: Same Phone Number
- **Customer Phone:** `+1-555-123-4567` → Username: `5551234567`
- **Brand Phone:** `+1-555-123-4567` → Username: `5551234567`
- **Result:** Customer sees all campaigns from this brand

#### Scenario 2: Different Format, Same Last 10 Digits
- **Customer Phone:** `15551234567` → Username: `5551234567`
- **Brand Phone:** `+1 (555) 123-4567` → Username: `5551234567`
- **Result:** Customer sees all campaigns from this brand

#### Scenario 3: Explicit Username Override
- **Customer:** Explicit username `"mybrand"` → Username: `mybrand`
- **Brand:** Explicit username `"mybrand"` → Username: `mybrand`
- **Result:** Customer sees all campaigns from this brand (even if phone numbers differ)

## Implementation Details

### Username Extraction Function

```typescript
static extractUsername(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  // Return last 10 digits
  return digits.slice(-10);
}
```

### Customer Promotion Loading

The `getPromotions` endpoint:
1. Gets customer's phone number
2. **ALWAYS extracts last 10 digits** from customer phone number
3. **PRIMARY METHOD:** Finds all brands and matches by last 10 digits of phone number
4. Also includes brands from visit history
5. Also includes manually associated brands
6. Returns campaigns from all matched brands

**Key Point:** The system ALWAYS uses the last 10 digits of phone numbers as the primary method for brand association.

### Brand Scanner

When a brand scans a customer's QR or enters phone number:
1. Extracts last 10 digits from phone number
2. Finds customer by username match
3. Falls back to phone number lookup if needed

## Benefits

1. **Automatic Association:** Customers automatically see campaigns from brands with matching phone numbers
2. **No Manual Linking:** No need to manually connect customers to brands
3. **Flexible Matching:** Works with different phone number formats
4. **Fallback Mechanisms:** Multiple matching strategies ensure reliability

## Important Notes

- **ALWAYS Uses Last 10 Digits:** The system ALWAYS uses the last 10 digits of phone numbers as the primary method for brand association
- **Phone Number Format:** The system handles various formats (with/without country code, dashes, spaces, parentheses)
- **10-Digit Requirement:** Phone numbers must have at least 10 digits for extraction to work
- **Primary Method:** Last 10 digits matching is the PRIMARY way customers see brand campaigns
- **Additional Methods:** Visit history and manual associations are also included

## Troubleshooting

If customers aren't seeing brand campaigns:

1. **Check phone numbers:** Ensure both customer and brand have phone numbers stored
2. **Verify last 10 digits match:** Compare the last 10 digits of both phone numbers
3. **Check explicit usernames:** If explicit usernames are set, they must match exactly
4. **Review logs:** Check backend logs for `[getPromotions]` messages to see matching process


