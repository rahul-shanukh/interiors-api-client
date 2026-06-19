Nice — I searched industry sources and distilled a short, practical list of **advanced Stock fields** you should consider adding at creation time (i.e. fields that make sense to set when a Stock record is created, not rapidly changing runtime counters). Grouped and concise, with why each matters.

(Backed by GS1, WMS best-practices, lot/serial tracking guides and Amazon inventory docs.) ([gs1.org][1])

---

## Identification

* **GTIN / GTINType (or ASIN/PlatformId)** — global product identifier for cross-system lookups and vendor/catalog mapping.
* **SKU** — merchant-specific identifier (useful for seller mappings; keep separate from global ID).
* **Barcode / BarcodeType** — primary scan key used in warehouses.
  Why: canonical product identity prevents duplicate products and enables cross-system joins. ([gs1.org][1])

## Traceability & compliance

* **Lot / Batch number** — batch-level traceability for recalls and quality.
* **Serial number support flag** (and serial format rules) — whether individual units are serialized.
* **Expiration / Manufacture date** — required for perishable/regulatory categories.
  Why: lot/serial + dates are core to recalls, regulatory compliance and WMS traceability. ([netsuite.com][2])

## Logistics / storage

* **Primary storage location / bin code pattern** — where stock should live in the warehouse.
* **Storage conditions / temperature class** (ambient, chilled, frozen, hazardous) — affects routing/fulfillment.
* **Package size / units per pack / weight / dimensions** — needed for capacity & pick/pack logic.
  Why: storage & packing attributes drive picking, safety and capacity planning. ([LaceUp Solutions][3])

## Commercial / ownership

* **OwnerId / SellerId** — who owns the inventory (marketplace seller vs platform).
* **Vendor / Supplier reference** (supplier SKU, lead-time days) — used for replenishment and PO workflows.
  Why: multi-seller marketplaces and vendor-managed inventory require explicit ownership and supplier metadata. ([Openbridge][4])

## Policies & thresholds (domain invariants)

* **RotationPolicy** (FIFO/LIFO/FEFO) — determines pick logic for perishable/serial items.
* **LowStockThreshold / ReorderPoint / MaxStockThreshold** — refill triggers and capacity guards.
* **Returnable / WarrantyFlag / HazardousFlag** — business rules affecting returns and handling.
  Why: these are invariants or policies the aggregate must enforce; they belong with the Stock at creation. ([netsuite.com][2])

## Trace & audit helpers

* **Traceability tags / serialized attribute schema** (how serials are formed/stored)
* **Schema version / sourceSystem** — where the stock record originated (catalog, vendor, WMS).
  Why: makes investigation, reconciliation and integrations reliable (think inventory ledger and audits). ([Openbridge][4])

## Optional advanced fields (for high-scale operations)

* **Kitting / ParentProductId** — if this stock is part of a kit or bundle.
* **Quarantine flag / qualityStatus** — for stock under QC or blocked.
* **ShelfLifeDays / rotationKey** — precomputed rotation inputs for fast FEFO picks.
* **Traceability links (previousLot, sourcePO, inboundReceiptId)** — for root-cause tracking across supply chain. ([netsuite.com][2])

---

### Quick rules for what to include at creation time

* Include **identity**, **ownership**, **policies** and **traceability metadata** at creation.
* **Do not** include transient counters (on-hand, reserved, allocated) — those are runtime state updated by behaviors.
* Favor **opaque global IDs** (GTIN/ASIN/ULID for StockId) and keep seller/local SKUs separate. ([gs1.org][1])

---

If you want, I can now:

* produce a compact `Stock` constructor field list (exact names + short types), or
* mark which of these should be `final` vs mutable and why. Which do you want next?

[1]: https://www.gs1.org/standards/id-keys/gtin?utm_source=chatgpt.com "Global Trade Item Number (GTIN)"
[2]: https://www.netsuite.com/portal/resource/articles/inventory-management/lot-tracking.shtml?utm_source=chatgpt.com "Lot Tracking Explained: A Comprehensive Overview"
[3]: https://www.laceupsolutions.com/guide-to-setting-up-a-wms-for-lot-traceability/?utm_source=chatgpt.com "Guide to Setting Up a WMS for Lot Traceability at all levels"
[4]: https://blog.openbridge.com/amazon-inventory-ledger-report-1272fd6a6a3f?utm_source=chatgpt.com "Amazon Inventory Ledger Report | Openbridge"
