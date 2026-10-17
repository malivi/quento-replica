# Telecom CDR & Billing Reconciliation (dbt + DuckDB)

An end-to-end **Revenue Assurance & Billing Reconciliation** example [dbt](https://www.getdbt.com/) project for a telecommunications operator. Built on **DuckDB** (`dbt-duckdb`), it runs locally out of the box using included CSV seed data with zero external infrastructure required.

---

## Business Problem & Reconciliation Scenarios

Telecom operators process millions of network signaling events across Mobile Switching Centers (MSC), Packet Data Network Gateways (PGW), and SMS Centers (SMSC). Between network mediation, Online Charging Systems (OCS), postpaid billing engines, and wholesale roaming settlement (GSMA TAP3), discrepancies cause **revenue leakage**, **customer overbilling**, and **wholesale settlement disputes**.

This dbt project models and detects four core Revenue Assurance scenarios:

1. **Unbilled Usage Detection (`UNBILLED_CDR` & `PHANTOM_BILLING`)**
   - Identifies billable Call Detail Records (CDRs) captured on network switches that were dropped during mediation or failed to reach the billing invoice (`UNBILLED_CDR`).
   - Detects billed usage lines on customer invoices that have no originating network switch CDR (`PHANTOM_BILLING`).
   - Filters out non-billable signaling events (e.g., rejected call setups with zero duration) and deduplicates raw switch records in staging.

2. **Overbilling & Rating Discrepancies (`VOLUME_DISCREPANCY` & `RATE_DISCREPANCY`)**
   - Independently re-rates network CDRs against commercial tariff schedules (`rate_plans`) and compares expected vs. billed unit rates and durations/volumes.
   - Flags tariff misconfigurations (`RATE_DISCREPANCY`) and switch-to-billing duration/volume mismatches (`VOLUME_DISCREPANCY`).

3. **Subscriber Plan & Bundle Allowance Validation (`BUNDLE_ALLOWANCE_ERROR`)**
   - Tracks cumulative monthly domestic usage per subscriber across **Voice (minutes)**, **Data (MB)**, and **SMS** using chronological window functions.
   - Splits each event into **in-bundle units** vs. **chargeable overage units** and detects OCS quota synchronization bugs (e.g., charging overage while a subscriber still has included allowance, or granting free usage after bundle exhaustion).

4. **Roaming & Interconnect Wholesale Settlement (`fct_roaming_tap_reconciliation`)**
   - Reconciles outbound roaming CDRs recorded on the home network switch against incoming **GSMA TAP3** files from visited partner operators (`PARTNER_VOD_UK`, `PARTNER_DT_DE`, `PARTNER_ORG_FR`).
   - Flags partner volume/rate overcharges (`TAP_OVERCHARGE`), unverified partner claims missing from the home switch (`MISSING_IN_HOME_SWITCH`), and unbilled wholesale accruals (`MISSING_TAP_RECORD`).

---

## Project Architecture & Lineage

```text
seeds/ (raw_seed)
├── subscribers.csv               # Subscriber directory (MSISDN, IMSI, rate plan)
├── rate_plans.csv                # Monthly fees, bundle allowances, overage & roaming tariffs
├── roaming_partners.csv          # Visited network operators & bilateral TAP3 wholesale rates
├── raw_network_cdrs.csv          # Raw switch CDRs/UDRs (MSC, PGW, SMSC)
├── raw_billing_records.csv       # Rated & billed postpaid invoice usage lines
└── raw_partner_tap_records.csv   # Incoming wholesale TAP3 settlement records

models/
├── staging/ (views)
│   ├── stg_subscribers.sql
│   ├── stg_rate_plans.sql
│   ├── stg_roaming_partners.sql
│   ├── stg_network_cdrs.sql      # Switch CDR deduplication & billable event classification
│   ├── stg_billing_records.sql
│   └── stg_partner_tap_records.sql
│
├── intermediate/ (views)
│   ├── int_cdr_rated_usage.sql         # Cumulative bundle tracking & independent CDR rating
│   ├── int_cdr_to_billing_matched.sql  # Full outer join aligning switch CDRs & billed records
│   └── int_roaming_tap_matched.sql     # Full outer join aligning roaming CDRs & partner TAP3 files
│
└── marts/reconciliation/ (tables)
    ├── fct_cdr_billing_reconciliation.sql       # Event-level retail discrepancy classification
    ├── fct_subscriber_bundle_reconciliation.sql # Subscriber monthly quota & invoice reconciliation
    ├── fct_roaming_tap_reconciliation.sql       # Wholesale roaming TAP3 settlement reconciliation
    └── mart_revenue_assurance_summary.sql       # Executive KPI summary (leakage, overbilling, TAP disputes)
```

---

## Quickstart

### 1. Install Dependencies

Using `uv` (or standard `venv` + `pip`):

```bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### 2. Run `dbt build` (Seeds + Models + Tests)

The repository includes a pre-configured `profiles.yml` pointing to a local DuckDB database (`telco_reconciliation.duckdb`):

```bash
dbt build --profiles-dir .
```

Or run each step individually:

```bash
dbt seed --profiles-dir .
dbt run --profiles-dir .
dbt test --profiles-dir .
```

### 3. Inspect Reconciliation Results

You can query the generated DuckDB database directly via Python or the DuckDB CLI:

```sql
-- Executive Revenue Assurance Summary
SELECT * FROM main_marts.mart_revenue_assurance_summary;

-- Event-level CDR vs. Billing Discrepancies
SELECT
    cdr_id,
    subscriber_id,
    service_type,
    reconciliation_status,
    expected_billed_amount,
    actual_billed_amount,
    revenue_leakage_amount,
    overbilling_exposure_amount,
    root_cause_hint
FROM main_marts.fct_cdr_billing_reconciliation
WHERE has_discrepancy = true
ORDER BY cdr_id;

-- Wholesale Roaming TAP3 Discrepancies
SELECT
    cdr_id,
    tap_record_id,
    partner_name,
    service_type,
    tap_reconciliation_status,
    expected_wholesale_amount,
    tap_charged_amount,
    wholesale_dispute_amount,
    unsettled_accrual_amount
FROM main_marts.fct_roaming_tap_reconciliation
WHERE has_tap_discrepancy = true;
```
