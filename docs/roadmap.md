# Where the Project Goes Next

I started with the iPhone 17 Pro Max so I could get the whole process working on a small set of devices before expanding it. The goal is to give team members one shortcut they can use to estimate the cost of keeping an iPhone, iPad, Mac, or Apple Watch leased through U.S. Apple Upgrade with Klarna.

The shortcut should stay easy to use as more devices are added: choose the device, choose the lease term, select how many payments to count, and see an estimate before tax.

## Where Things Stand

The Pro Max version works. It includes all four storage sizes and both lease terms, and I checked the prices against Apple's configurator. I also tested the calculation before any payments, partway through a lease, and at the end of a lease.

The pricing lives inside the shortcut, so team members don't need a separate file to run it. The JSON, the structured text that holds the prices, also controls the order of the storage menu and which lease terms appear. That means I can add more devices without rebuilding every menu.

I also found a way to collect prices without clicking through every configuration. Apple's page contains a list of device part numbers, and its `updateSummary` request returns pricing for a selected device and lease term. The first script successfully collected all eight Pro Max lease prices. The saved version adds menu-order information and a few extra checks, so that revision still needs a browser test.

## Pick Up Here: Add iPhone 17 Pro

The next step is to add iPhone 17 Pro alongside Pro Max. It's a useful next test because it lets me check that the same process works for a second model before moving to a different device category.

The working `.shortcut` export is now in the repository. Before making changes, I’ll check that its embedded pricing matches the JSON file saved alongside it. Then I'll rerun the saved pricing script and compare its results with the Pro Max prices I've already checked.

From there, I'll:

1. Find the iPhone 17 Pro configurations and their part numbers in Apple's page data.
2. Confirm the available lease terms and collect the prices for each storage size.
3. Compare those prices with what the configurator shows.
4. Add the model to the JSON, including its `storage_order` and `lease_terms` lists.
5. Run the shortcut with both models to check that the menus and calculations still work.

The script currently creates a catalog containing only Pro Max. I'll need to update it so adding Pro doesn't replace the prices I've already saved.

## Then Add the Other iPhones

Once both Pro models work, I'll repeat the process for the other eligible iPhones. I'll check each model's available configurations and lease terms rather than assuming they're all the same.

So far, I've used Silver devices with the AT&T option to keep the initial comparison consistent. Before leaving carrier choices out of the wider catalog, I'll check whether they affect the price.

For each new model, the process stays the same: find its configurations, collect the prices, compare them with the website, and test the shortcut. This gives me a repeatable way to expand the catalog without entering every price by hand.

## Make Room for iPad, Mac, and Apple Watch

After the iPhone flow is established, I'll look at the other categories one at a time. I'll need to inspect how each configurator supplies its data; the iPhone request might not work for all of them.

The biggest menu change will be moving beyond storage alone. A Mac with 512GB of storage can have different chips and amounts of memory, and those differences can change the price. The choices need to describe the full configuration clearly.

| Category | Details the choices may need to include |
|---|---|
| iPad | Size, storage, and Wi-Fi or cellular |
| Mac | Size, chip, memory, and storage |
| Apple Watch | Case size, material, connectivity, and other options that affect the price |

At that point, I'll adapt `storage_order` into a more general `configuration_order` list where needed. The menu could show a label such as “13-inch • 16GB memory • 512GB SSD.” I'll also update the storage-specific variable names and comments so they still make sense.

The lease-term menu already reads its choices from the JSON. Once I've verified a device's supported terms and added the matching monthly prices, the shortcut can offer those terms without a separate hard-coded list.

## Keep Updates Easy to Share

For now, I'll keep the prices embedded in the shortcut. It's portable and doesn't require team members to set up access to another file. When the catalog changes, I'll update the embedded JSON and share a new shortcut export.

Before sharing it more widely, I'll test importing it on another device. I'll also keep a date and source for each pricing update and preserve older versions. That's important because today's price might not match the price used for an existing customer's lease.

As the catalog grows, I'll add checks that catch missing prices, duplicate configurations, and menu choices that don't have a matching record. I'll keep this maintenance information separate from the data used to build the customer-facing menus.

## What Can Wait

An automatic pricing updater could be useful later if sharing new exports becomes too much work. If I add one, I'd still want a saved catalog available when the device is offline. That isn't needed to finish the current version.

Trade-in credits and payment adjustments also need more research before they're included. I'll need to understand how they're applied to the customer's lease so the shortcut doesn't count a credit twice or use the wrong monthly amount.

The current scope stays straightforward: an estimate before tax using standard lease payments. Team members can use it to explain the expected cost of keeping a device, then check Klarna for the customer's final purchase amount.
