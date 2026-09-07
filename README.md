# Apple Upgrade Buyout Estimate

I’m building this shortcut to help team members answer a common question: “How much would it cost to keep this device?” It estimates the buyout for a U.S. Apple Upgrade lease through Klarna.

Choose the device, storage size, lease term, and how many payments to count. The shortcut then shows an estimate before tax, so there’s no need to go through Apple’s configurator for every customer.

## Current Status

I started with iPhone 17 Pro Max to test the process before adding more devices. That version now works, and the exported [Apple Upgrade Calculator.shortcut](<Apple Upgrade Calculator.shortcut>) is included here. I built it in the Shortcuts app; the build guide below explains how it fits together.

Here’s what it can do so far:

- Offers all four Pro Max storage sizes and both 12- and 24-month lease terms.
- Runs with pricing saved inside the shortcut, so team members don’t need a separate iCloud file.
- Shows storage sizes in a set order and reads the available lease terms from the pricing data.
- Calculates an estimate at the end of the lease or after a selected number of payments.
- Lets the team member choose a valid payment count from a list.
- Shows the estimated cost first, followed by the numbers used to calculate it.
- Includes short comments explaining each section for anyone editing it.

I checked these prices against the U.S. Apple configurator on September 7, 2026. They’re a saved set of prices from that date. The shortcut doesn’t connect to the customer’s Klarna account.

## What It Covers

This version is for U.S. Apple Upgrade leases through Klarna. The older iPhone Upgrade Program, Apple Card Monthly Installments, and carrier financing use different terms and aren’t supported here.

The current estimate assumes the device price and monthly payment match the original lease. It doesn’t account for trade-in credits, payment adjustments, missed payments, or lease extension periods. It doesn’t estimate sales tax. Klarna provides the customer's final purchase amount.

## How the Estimate Works

```text
Total payments = Monthly payment × Payments counted
Estimated buyout before tax = Device price − Total payments
```

The shortcut rounds the calculation to cents and shows dollar amounts with two decimal places.

“At end of initial lease” counts every payment in the selected term. Zero payments means no payments are counted; it isn’t the same as the end of the lease.

For a 2TB Pro Max on a 24-month lease after 18 payments:

```text
Device price: $1,999.00
Monthly payment: $58.34
18 payments total: $1,050.12
Estimated cost to keep the device: $948.88 before tax
```

## What’s in This Folder

- [Pricing catalog](data/apple_pricing.json) — The device prices, monthly payments, and menu choices. It uses JSON, a structured text format that Shortcuts can read.
- [Pricing script](scripts/capture-iphone-17-pro-max.js) — Collects Pro Max prices when run in the browser’s developer Console.
- [How I collect prices](docs/pricing-capture.md) — Explains the browser tools, requests, and response fields.
- [Shortcut build guide](docs/shortcut-build.md) — Walks through the actions and includes the comments to paste into each section.
- [Where the project goes next](docs/roadmap.md) — Starts with iPhone 17 Pro, then explains the plan for other devices.

## Verified Pilot Prices

| Storage | Silver part number | Device price | 12-month payment | 24-month payment |
|---|---|---:|---:|---:|
| 2TB | MFXR4LL/A | $1,999.00 | $83.35 | $58.34 |
| 1TB | MFXN4LL/A | $1,599.00 | $66.67 | $46.67 |
| 512GB | MFXK4LL/A | $1,399.00 | $58.33 | $40.83 |
| 256GB | MFXG4LL/A | $1,199.00 | $49.99 | $34.99 |

The automated capture matched the individually captured responses and the visible configurator prices.

## Where I’ll Pick Up Next

1. Check that the saved shortcut’s embedded prices match the JSON file here.
2. Rerun the saved pricing script. The original worked; this revision adds menu lists and extra checks that still need a browser test.
3. Expand pricing capture to iPhone 17 Pro and verify its configuration mapping and lease terms.
4. Add the verified model to the catalog, then test the existing model, storage, and term menus.
5. Follow `docs/roadmap.md` for the other iPhone models and device categories.

Changing the JSON file in this repository doesn’t automatically update an installed shortcut. The current version requires pasting the updated JSON into the shortcut and sharing the updated export.

## Checks Already Passed

| Configuration | Payments | Expected pre-tax buyout |
|---|---:|---:|
| 2TB, 24 months | 18 | $948.88 |
| 2TB, 24 months | 0 | $1,999.00 |
| 2TB, 24 months | End of term: 24 | $598.84 |
| 256GB, 12 months | End of term: 12 | $599.12 |

I also checked that storage appears in the chosen order and that the lease-term menu uses the choices saved in the JSON. The shortcut hasn’t yet been validated across all device categories or against a broad set of customer agreements.

## References

- [Apple Upgrade](https://www.apple.com/shop/apple-upgrade)
- [Apple Upgrade purchase and return options](https://www.apple.com/shop/apple-upgrade/how-to)
- [iPhone 17 Pro configurator](https://www.apple.com/shop/buy-iphone/iphone-17-pro)

I found the pricing data by inspecting Apple’s website. Apple hasn’t documented this as a public API, a supported way for other software to request data, so the page structure or requests could change.
