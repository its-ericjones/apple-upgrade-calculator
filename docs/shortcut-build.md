# Shortcut Build

This guide records how I built the Pro Max version. You can use it to understand the existing shortcut or rebuild it one section at a time. Each section includes a short comment to paste into a Comment action, followed by the actions it describes.

A **variable** holds a value for later, such as the selected model or monthly payment. When a name appears in brackets below, insert it using Shortcuts’ variable picker; don’t type the brackets or the name as plain text.

A **dictionary** holds named values. The name you look up is called a **key**. Keys such as `retail`, `storage_order`, and `lease_terms` are typed text. For example, looking up `retail` in `DevicePricing` gets the selected device’s price.

The action blocks are a guide to building the shortcut, not code to paste into the app. After each menu, you can temporarily add Show Result to check that the selected value is what you expect.

## 1. Pricing Data

Comment:

```text
1. Pricing Data

Stores the pricing data the shortcut uses.
Currently includes iPhone 17 Pro Max configurations
for U.S. Apple Upgrade through Klarna.

Uses prices checked September 7, 2026.
Excludes tax and trade-in credits.

Uses storage_order to arrange each model’s storage options.
Uses lease_terms to list each configuration’s available terms.

Requires a matching monthly payment key for each term.
For example, 24 in lease_terms requires monthly_24.
```

Actions:

```text
Text: paste data/apple_pricing.json
Get Dictionary from [Text]
Set variable Catalog to [Dictionary]
```

## 2. Choose Category

Comment:

```text
2. Choose Category

Asks which type of device the customer has, then gets
the models available in that category.

Includes only iPhone for now.
```

Actions:

```text
Get All Keys in [Catalog]
Choose from [preceding Dictionary Value]
  Prompt: Choose device category
  Select Multiple: Off
Set variable SelectedCategory to [chooser output]
Get Value for [SelectedCategory] in [Catalog]
Set variable Models to [preceding Dictionary Value]
```

## 3. Choose Model

Comment:

```text
3. Choose Model

Shows the models in the selected category.
Saves the selection and gets its storage options.
```

Actions:

```text
Get All Keys in [Models]
Choose from [preceding Dictionary Value]
  Prompt: Choose device model
  Select Multiple: Off
Set variable SelectedModel to [chooser output]
Get Value for [SelectedModel] in [Models]
Set variable StorageOptions to [preceding Dictionary Value]
```

## 4. Choose Storage

Comment:

```text
4. Choose Storage

Shows storage options in the order listed in storage_order.

Saves the selected capacity and gets its pricing.
Requires each item in storage_order to match a storage key exactly.
```

Actions:

```text
Get Value for storage_order in [StorageOptions]
Choose from [preceding Dictionary Value]
  Prompt: Choose storage capacity
  Select Multiple: Off
Set variable SelectedStorage to [chooser output]
Get Value for [SelectedStorage] in [StorageOptions]
Set variable DevicePricing to [preceding Dictionary Value]
```

I use an array—an ordered list—for storage because Shortcuts can rearrange dictionary keys. Read `storage_order` here instead of All Keys. That keeps the capacities in the intended order and prevents `storage_order` itself from appearing as a choice.

## 5. Choose Lease Term

Comment:

```text
5. Choose Lease Term

Reads the available lease terms from DevicePricing
and shows them in the order listed in lease_terms.

Saves the selected term and gets its monthly payment.
For example, selecting 24 looks up monthly_24.
```

Actions:

```text
Get Value for lease_terms in [DevicePricing]
Choose from [preceding Dictionary Value]
  Prompt: Choose lease term in months
  Select Multiple: Off
Set variable LeaseTerm to [chooser output]
Text: monthly_[LeaseTerm]
Set variable MonthlyPriceKey to [Text]
Get Value for [MonthlyPriceKey] in [DevicePricing]
Set variable MonthlyPayment to [preceding Dictionary Value]
```

No spaces or newline between `monthly_` and the LeaseTerm token.

## 6. Choose Buyout Timing

Comment:

```text
6. Choose Buyout Timing

Asks whether to estimate the buyout at the end of the lease
or after a specific number of payments.

Counts all payments when the end of the lease is selected.
Otherwise, builds a list from 0 through the selected term
to prevent invalid selections.

Adapts the payment-count list to the selected lease term.
Counts payments, not months since the lease started.
```

Actions:

```text
Choose from Menu: When will the customer purchase the device?

  At end of initial lease:
    Set variable PaymentsMade to [LeaseTerm]

  After a specific number of payments:
    Calculate [LeaseTerm] + 1
    Repeat [Calculation Result] times
      Calculate [Repeat Index] − 1
    End Repeat
    Choose from [Repeat Results]
      Prompt: How many monthly payments have been completed?
      Select Multiple: Off
    Set variable PaymentsMade to [chooser output]

End Menu
```

The calculation is the last action inside Repeat. A 24-month lease produces 25 choices: zero through 24. The earlier free-number input and validation section were removed because this list prevents invalid counts. Cancel still ends the run; it doesn’t return to the previous menu.

## 7. Calculate the Estimate

Comment:

```text
7. Calculate the Estimate

Multiplies the monthly payment by the number of payments,
then subtracts that total from the device price.

Rounds the amounts to cents.
Excludes tax, trade-in credits, and payment adjustments.
```

Actions after End Menu:

```text
Get Value for retail in [DevicePricing]
Set variable RetailPrice to [Dictionary Value]
Calculate [MonthlyPayment] × [PaymentsMade]
Round Number [Calculation Result] to Hundredths Place
Set variable TotalPaid to [Rounded Number]
Calculate [RetailPrice] − [TotalPaid]
Round Number [Calculation Result] to Hundredths Place
Set variable PreTaxBuyout to [Rounded Number]
```

## 8. Show the Summary

Comment:

```text
8. Show the Summary

Formats the dollar amounts to two decimal places.

Shows the estimated cost to keep the device first,
followed by the device details and calculation.

Reminds the team member to check Klarna for the customer’s
final purchase amount.
```

For each row below, add Format Number with two decimal places, then Set Variable using the name in the second column. This keeps the formatted text separate from the numbers used in the calculation:

| Input | Display variable |
|---|---|
| RetailPrice | RetailDisplay |
| MonthlyPayment | MonthlyDisplay |
| TotalPaid | PaidDisplay |
| PreTaxBuyout | BuyoutDisplay |

Add a Text action for the summary below, then Show Content using that Text output. This wording puts the estimate first and shows it once:

```text
Estimated cost to keep this device
$[BuyoutDisplay] before tax (USD)

[SelectedModel] • [SelectedStorage]
After [PaymentsMade] of [LeaseTerm] monthly payments

Calculation
Device price: $[RetailDisplay]
Monthly payment: $[MonthlyDisplay]
[PaymentsMade] payments total: $[PaidDisplay]

Based on the device price and monthly payment shown.
Trade-in credits and payment adjustments aren’t included.
Check Klarna for the customer’s final purchase amount.
```

The source prices still need to match the original lease. No customer agreement or payment history is retrieved automatically.

## Troubleshooting Notes

- A “No key was provided” error means a lookup received an empty key. Temporarily show the selected variable immediately before the lookup.
- A key-path error containing pricing JSON means a dictionary was passed as the key. Category and model choosers use All Keys; storage and term choosers use their explicit arrays.
- `SelectedStorage` should be text such as `2TB`. `DevicePricing` should be the corresponding dictionary.
- Similar “Dictionary Value” tokens can refer to different actions. Select the intended source explicitly.
- Long decimals in dictionary previews are floating-point artifacts. Round calculations to cents and format final display values.
- To show several lines, write them in a Text action and pass its output to Show Content.
