# How I Collect the Pricing Data

The aim is to collect the prices once, check them, and put them into the shortcut. I started by watching what the browser does when I select a device in Apple’s configurator. The steps below explain what I found and how to repeat it.

A **request** is something the browser asks Apple’s server for. The **response** is the data Apple sends back. **JSON** is the structured text format used for much of that data.

## What I Found

When I switched between 12-month and 24-month leases, the address bar stayed the same. In the browser’s developer tools, though, I could see new requests in the Network tab.

I first found a purchase-options response with `poi_12` and `poi_24` rates. That response showed a $1,099 device instead of the selected $1,999 Pro Max. It was useful for identifying the program, but not enough to establish configuration-specific pricing.

I then found a request called `updateSummary`. Its response includes the selected device, lease term, and displayed price, which lets me check that I’m saving the right amount. I captured all four Pro Max storage tiers and both terms, then checked the automated results against the visible configurator.

## Finding All Configurations

Apple’s page already contains a list of configurations and part numbers. A part number identifies a particular device configuration. That list is stored at this location in the page’s data:

```javascript
window.PRODUCT_SELECTION_BOOTSTRAP.productSelectionData.products
```

Each entry describes a model, storage size, color, part number, and carrier option. The code below picks out Pro Max models in Silver with AT&T selected, then displays those details as a table. This gave me all four part numbers without selecting each storage size manually.

```javascript
console.table(
  window.PRODUCT_SELECTION_BOOTSTRAP.productSelectionData.products
    .filter(p =>
      p.familyType === 'iphone17promax' &&
      p.dimensionColor === 'silver' &&
      p.carrierPolicyProduct === 'ATT_IPHONE17PRO'
    )
    .map(p => ({
      model: p.familyType,
      storage: p.dimensionCapacity,
      color: p.dimensionColor,
      partNumber: p.partNumber
    }))
);
```

To inspect the source manually, open DevTools → Network → Doc and reload. Select the document whose URL matches the configurator, then inspect Response. Sources also works for searching the HTML. Fetch/XHR hides document requests.

## Requesting Lease Prices

This is the captured 2TB Silver, 24-month request:

```text
https://www.apple.com/shop/updateSummary?fae=true&node=home%2Fshop_iphone%2Ffamily%2Fiphone_17_pro&step=select&product=MFXR4LL%2FA&bfil=2&cppart=ATT_IPHONE17PRO&carrierPolicyType=POSTPAID&purchaseOption=poi&term=24&igt=true&warm=true
```

- `product` selects the part number. `%2F` represents `/`.
- `purchaseOption=poi` selects Apple Upgrade in these observed requests.
- `term` selects 12 or 24 months.
- `cppart` and `carrierPolicyType` preserve the captured AT&T selection.
- `node` identifies the iPhone product family.

I left the remaining parameters unchanged. I haven’t established which are required or what every flag means. The earlier proposed `view-pricing` endpoint wasn’t used or verified.

One request returns one configuration and term. Bulk capture here means making those requests automatically, not sending multiple products in one request.

## Reading the Response

The response contains several sections. The device and pricing details I need sit inside `summarySection`. A “path” below is just the sequence of field names to follow to find a value. Start here:

```text
body.response.summarySection
```

| Field | Relative path |
|---|---|
| Device label | `summary.productTitle` |
| Part number | `summary.favorites.partNumber` |
| Storage | `summary.productDimensions.dimensionCapacity` |
| Retail price | `summary.seoPrice` |
| Lease summary | `summaryV2.data.priceSummary.headerSummary.content` |

The retail price arrives as text, such as `"1999.00"`, so the script converts it to a number. The monthly payment takes another step: Apple wraps it in HTML, the markup used to display a webpage. The script finds the entry labeled `monthlyPrice`, removes that markup, and reads the amount and term from the remaining text. It also checks that the text says Apple Upgrade.

Check the returned part number and term before saving a price. Don’t extract the first dollar amount from the full page: carrier prices, Apple Card installments, and general “from” prices can also appear.

## Running the Capture

1. Open the U.S. iPhone 17 Pro configurator. Keep the comparison consistent: no trade-in, and compare the device payment separately from any added coverage.
2. Open the browser’s developer tools and select **Console**. This is where you can run the JavaScript code against the page you have open.
3. Run `scripts/capture-iphone-17-pro-max.js` in that Console, not in Node or a terminal.
4. Compare all eight payments and four retail prices with the README reference and selected configurator offers.
5. Export only after the checks pass.

The original eight-request script succeeded in my browser session. The saved version adds the agreed arrays and extra response checks; it needs a fresh browser run before treating that revision as verified. I’ve only tested this approach in my browser session. I haven’t confirmed whether it works as a standalone process outside the browser. If a request fails or requires a challenge, stop and inspect it rather than trying to bypass it.

## Exporting the Catalog

After a successful capture, run:

```javascript
(() => {
  const blob = new Blob([JSON.stringify(applePricing, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'apple_pricing.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
})();
```

Review the downloaded file before replacing the repository catalog or embedded Text action. Keep a dated record of source, configurations, and verification when prices change. Preserve old catalog versions for historical offers.

Only save the public product details needed for the catalog. A full network export (a HAR file) can also include cookies or session information from your browser, so it shouldn’t go into the repository. Customer account information doesn’t belong in the catalog either.
