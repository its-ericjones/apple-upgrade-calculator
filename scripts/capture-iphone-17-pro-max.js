// Runs in DevTools Console on the U.S. iPhone 17 Pro configurator.
// Reads loaded configuration data and makes eight sequential pricing requests.
// Does not place orders. Stops if the response does not match the request.
// This revised exporter adds storage_order and lease_terms to the tested approach.
// Recheck its output against the saved reference before updating the catalog.

var applePricing = await (async () => {
  const products = window.PRODUCT_SELECTION_BOOTSTRAP.productSelectionData.products
    .filter(p => p.familyType === 'iphone17promax' &&
      p.dimensionColor === 'silver' &&
      p.carrierPolicyProduct === 'ATT_IPHONE17PRO');
  const order = ['2TB', '1TB', '512GB', '256GB'];
  const byStorage = new Map();
  for (const product of products) {
    const storage = product.dimensionCapacity.toUpperCase();
    if (byStorage.has(storage)) throw new Error(`Duplicate configuration: ${storage}`);
    byStorage.set(storage, product);
  }
  if (byStorage.size !== order.length || order.some(s => !byStorage.has(s))) {
    throw new Error('Expected the four verified Pro Max Silver storage tiers');
  }
  const tiers = {};
  for (const storage of order) {
    const product = byStorage.get(storage);
    const record = { lease_terms: [12, 24] };
    for (const term of record.lease_terms) {
      const url = new URL('/shop/updateSummary', location.origin);
      url.search = new URLSearchParams({
        fae: 'true', node: 'home/shop_iphone/family/iphone_17_pro',
        step: 'select', product: product.partNumber, bfil: '2',
        cppart: 'ATT_IPHONE17PRO', carrierPolicyType: 'POSTPAID',
        purchaseOption: 'poi', term: String(term), igt: 'true', warm: 'true'
      });
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${storage}: HTTP ${response.status}`);
      const json = await response.json();
      const section = json.body?.response?.summarySection;
      const summary = section?.summary;
      if (String(json.head?.status) !== '200' ||
          summary?.favorites?.partNumber !== product.partNumber ||
          summary?.productDimensions?.dimensionCapacity?.toUpperCase() !== storage) {
        throw new Error(`${storage}: response status or product does not match`);
      }
      const html = section.summaryV2.data.priceSummary.headerSummary.content
        .filter(item => item.hint === 'monthlyPrice')
        .map(item => item.content).join(' ');
      const text = new DOMParser().parseFromString(html, 'text/html')
        .body.textContent.replace(/\s+/g, ' ');
      const amount = text.match(/\$([\d,]+\.\d{2})/);
      const duration = text.match(/\bfor\s+(\d+)\b/);
      if (!text.includes('Apple Upgrade') || !amount || Number(duration?.[1]) !== term) {
        throw new Error(`${storage}: unexpected lease summary: ${text}`);
      }
      const retail = Number(summary.seoPrice);
      if (!Number.isFinite(retail) || retail <= 0 ||
          (record.retail !== undefined && record.retail !== retail)) {
        throw new Error(`${storage}: invalid or inconsistent retail price`);
      }
      record.retail = retail;
      record[`monthly_${term}`] = Number(amount[1].replaceAll(',', ''));
      console.log(`${storage}, ${term} months: $${record[`monthly_${term}`]}`);
    }
    tiers[storage] = record;
  }
  return { iPhone: { 'iPhone 17 Pro Max': { storage_order: order, ...tiers } } };
})();
console.table(Object.fromEntries(
  applePricing.iPhone['iPhone 17 Pro Max'].storage_order.map(storage =>
    [storage, applePricing.iPhone['iPhone 17 Pro Max'][storage]])
));
