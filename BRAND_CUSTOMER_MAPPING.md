# Brand-Customer Mapping Using Last 10 Digits of Phone Number

## Overview

The system uses the **last 10 digits of phone numbers** to automatically associate customers with brands. This allows customers to see campaigns from brands that share the same phone number pattern, even if they haven't visited yet.

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

2. **Finds associated brands:**
   - Brands the customer has visited (via visits)
   - Brands with matching username (last 10 digits match)
   - Brands with matching phone number (last 10 digits match)

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
2. Extracts username (explicit or last 10 digits)
3. Queries brands with matching username
4. Also matches by phone number as fallback
5. Returns campaigns from all matched brands

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

- **Phone Number Format:** The system handles various formats (with/without country code, dashes, spaces, parentheses)
- **Username Priority:** Explicit usernames take priority over auto-extracted ones
- **Case Sensitivity:** Username matching is case-sensitive
- **10-Digit Requirement:** Phone numbers must have at least 10 digits for extraction to work

## Troubleshooting

If customers aren't seeing brand campaigns:

1. **Check phone numbers:** Ensure both customer and brand have phone numbers stored
2. **Verify last 10 digits match:** Compare the last 10 digits of both phone numbers
3. **Check explicit usernames:** If explicit usernames are set, they must match exactly
4. **Review logs:** Check backend logs for `[getPromotions]` messages to see matching process
