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

## Adapting the JavaScript for Another iPhone

I can reuse the same approach for another model, such as iPhone Air, once I’ve checked how its page supplies the data. The easiest way to follow along is to open this guide beside [the existing JavaScript file](../scripts/capture-iphone-17-pro-max.js) in VS Code.

First, make a copy of that script with a name such as `capture-iphone-air.js`. Keep the original so the working Pro Max settings are still available. The steps below describe edits to that copy; the existing script hasn’t been changed.

### 1. Find the Model Identifier

Open the new model’s configurator, then Developer Tools → Console. Run:

```javascript
console.table(
  [...new Set(
    window.PRODUCT_SELECTION_BOOTSTRAP.productSelectionData.products
      .map(product => product.familyType)
  )].map(model => ({ model }))
);
```

This lists the model identifiers Apple uses on that page. Copy the identifier for the model you want exactly as it appears. Don’t guess it from the marketing name.

If `PRODUCT_SELECTION_BOOTSTRAP` is undefined, check that the Console is attached to the configurator rather than a JSON response tab. If the data still isn’t there, inspect the new page before adapting the script. It may use a different structure.

### 2. Find Storage, Color, and Carrier Values

Replace the placeholder below with the model identifier, then run:

```javascript
console.table(
  window.PRODUCT_SELECTION_BOOTSTRAP.productSelectionData.products
    .filter(product =>
      product.familyType === 'PASTE_MODEL_IDENTIFIER'
    )
    .map(product => ({
      storage: product.dimensionCapacity,
      color: product.dimensionColor,
      carrier: product.carrierPolicyProduct,
      partNumber: product.partNumber
    }))
);
```

Pick one color and carrier for the initial comparison. Record their exact values and all storage sizes available for that combination. The table may repeat a device across carrier options; that’s why the script filters these choices.

### 3. Capture One Pricing Request

In Network → Fetch/XHR, clear the list and change the selected lease term in the configurator. Find the request that updates the Apple Upgrade price. For Pro, it’s called `updateSummary`.

Open Headers and copy its Request URL. Record the `node`, `cppart`, `carrierPolicyType`, and `purchaseOption` values, along with the remaining parameters. Confirm the available terms on the webpage.

Check the response’s device name and part number before accepting its price. A URL opening successfully doesn’t guarantee it returned the intended configuration.

The settings below assume the new page uses the same endpoint and response structure as Pro. If it doesn’t, these edits alone won’t be enough.

### 4. Put the Settings in One Place

At the top of your script copy, before `var applePricing`, add this block. Replace every placeholder with a value you’ve checked. The empty lists must also be filled before running it.

```javascript
var captureSettings = {
  modelLabel: 'iPhone Air',
  familyType: 'PASTE_MODEL_IDENTIFIER',
  color: 'PASTE_COLOR_IDENTIFIER',
  carrierProduct: 'PASTE_CARRIER_IDENTIFIER_FROM_PRODUCT_LIST',
  storageOrder: [], // Add the available sizes, highest first.
  leaseTerms: [],   // Add the available lease durations as numbers.
  node: 'PASTE_NODE_FROM_REQUEST',
  cppart: 'PASTE_CPPART_FROM_REQUEST',
  carrierPolicyType: 'PASTE_VALUE_FROM_REQUEST',
  purchaseOption: 'PASTE_VALUE_FROM_REQUEST'
};
```

`modelLabel` is the readable name that will appear in the shortcut. The other identifiers come from Apple’s data. Keep `carrierProduct` and `cppart` separate: one filters the product list, while the other is sent in the request.

For the array format, a storage list might look like `['1TB', '512GB', '256GB']`, and a term list might look like `[12, 24]`. Those are examples of the syntax, not verified Air options. Storage labels should be uppercase because the script converts Apple’s capacity values to uppercase before comparing them.

### 5. Connect the Script to the Settings

Use VS Code’s Find command to locate each original fragment and replace it as shown:

| Find in the Pro Max script | Replace with |
|---|---|
| `p.familyType === 'iphone17promax'` | `p.familyType === captureSettings.familyType` |
| `p.dimensionColor === 'silver'` | `p.dimensionColor === captureSettings.color` |
| `p.carrierPolicyProduct === 'ATT_IPHONE17PRO'` | `p.carrierPolicyProduct === captureSettings.carrierProduct` |
| `const order = ['2TB', '1TB', '512GB', '256GB'];` | `const order = captureSettings.storageOrder;` |
| `const record = { lease_terms: [12, 24] };` | `const record = { lease_terms: captureSettings.leaseTerms };` |
| `node: 'home/shop_iphone/family/iphone_17_pro'` | `node: captureSettings.node` |
| `cppart: 'ATT_IPHONE17PRO'` | `cppart: captureSettings.cppart` |
| `carrierPolicyType: 'POSTPAID'` | `carrierPolicyType: captureSettings.carrierPolicyType` |
| `purchaseOption: 'poi'` | `purchaseOption: captureSettings.purchaseOption` |

Compare the other parameters with the new captured request too. Don’t assume the remaining Pro settings apply to every phone.

Change the configuration error to:

```javascript
throw new Error('Returned configurations don’t match storageOrder');
```

Replace the final `return` statement inside the function with:

```javascript
return {
  iPhone: {
    [captureSettings.modelLabel]: {
      storage_order: order,
      ...tiers
    }
  }
};
```

The square brackets make the value of `modelLabel` the JSON key. That gives the export its new model name instead of always labeling it Pro Max.

Replace the `console.table` block at the end with:

```javascript
console.table(Object.fromEntries(
  applePricing.iPhone[captureSettings.modelLabel].storage_order.map(
    storage => [
      storage,
      applePricing.iPhone[captureSettings.modelLabel][storage]
    ]
  )
));
```

Update the opening comments to name the model you’re collecting. The request count is the number of storage sizes multiplied by the number of lease terms.

### 6. Prevent an Old Result from Being Reused

Replace this line:

```javascript
var applePricing = await (async () => {
```

with:

```javascript
var applePricing = undefined;
applePricing = await (async () => {
  if (!captureSettings.storageOrder.length || !captureSettings.leaseTerms.length) {
    throw new Error('Fill in storageOrder and leaseTerms before running');
  }
```

This clears the previous result before starting. If the new capture fails, don’t export anything or merge partial results.

### 7. Run and Check the New Model

Run the edited script in the new model’s configurator Console. The response-reading code can stay the same only if the response has the structure described earlier in this guide.

Before adding the output to the shortcut, check:

- [ ] The selected color, carrier, and storage sizes match the discovery table.
- [ ] Every part number and storage value matches the requested device.
- [ ] Every lease summary identifies Apple Upgrade and the requested term.
- [ ] Each retail price and monthly payment matches the visible configurator offer.
- [ ] The export uses the correct model name, storage_order, and lease_terms.

Use all discovered storage sizes in `storageOrder`. The current duplicate/missing-configuration check expects that list to match the filtered product list exactly. If you want to test just one size, you’ll also need to filter the product list to that size.

The same instructions haven’t yet been tested for Air. A mismatch is a reason to inspect the request and response, not to remove the checks.

### 8. Merge the Checked Data

Use the export command earlier in this guide and give the download a model-specific filename. Add its model entry alongside the existing models inside the catalog’s `iPhone` object.

Don’t replace the whole catalog with the download: each capture contains only one model. Keep the existing Pro and Pro Max entries, paste the combined JSON into the shortcut, and test the new menus and a few calculations before sharing an updated export.
