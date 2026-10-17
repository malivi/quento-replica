with retail as (
    select
        billing_period,
        count(*) as total_reconciled_events,
        count(case when is_present_in_network then 1 end) as total_billable_network_cdrs,
        count(case when is_present_in_billing then 1 end) as total_billing_records,
        count(case when reconciliation_status = 'MATCHED' then 1 end) as matched_event_count,
        count(case when reconciliation_status = 'UNBILLED_CDR' then 1 end) as unbilled_cdr_count,
        count(case when reconciliation_status = 'PHANTOM_BILLING' then 1 end) as phantom_billing_count,
        count(case when reconciliation_status = 'BUNDLE_ALLOWANCE_ERROR' then 1 end) as bundle_error_count,
        count(case when reconciliation_status = 'VOLUME_DISCREPANCY' then 1 end) as volume_discrepancy_count,
        count(case when reconciliation_status = 'RATE_DISCREPANCY' then 1 end) as rate_discrepancy_count,
        sum(expected_billed_amount) as expected_retail_usage_revenue,
        sum(actual_billed_amount) as actual_retail_usage_revenue,
        sum(revenue_leakage_amount) as retail_revenue_leakage,
        sum(overbilling_exposure_amount) as retail_overbilling_exposure
    from {{ ref('fct_cdr_billing_reconciliation') }}
    group by billing_period
),

wholesale as (
    select
        billing_period,
        count(*) as total_roaming_settlement_events,
        count(case when tap_reconciliation_status = 'MATCHED_SETTLEMENT' then 1 end) as matched_tap_count,
        count(case when tap_reconciliation_status = 'TAP_OVERCHARGE' then 1 end) as tap_overcharge_count,
        count(case when tap_reconciliation_status = 'MISSING_IN_HOME_SWITCH' then 1 end) as unverified_tap_claim_count,
        count(case when tap_reconciliation_status = 'MISSING_TAP_RECORD' then 1 end) as missing_tap_record_count,
        sum(expected_wholesale_amount) as expected_wholesale_roaming_cost,
        sum(tap_charged_amount) as billed_tap_wholesale_cost,
        sum(wholesale_dispute_amount) as wholesale_tap_dispute_amount,
        sum(unsettled_accrual_amount) as wholesale_unsettled_accrual_amount
    from {{ ref('fct_roaming_tap_reconciliation') }}
    group by billing_period
)

select
    r.billing_period,
    r.total_reconciled_events,
    r.total_billable_network_cdrs,
    r.total_billing_records,
    r.matched_event_count,
    r.unbilled_cdr_count,
    r.phantom_billing_count,
    r.bundle_error_count,
    r.volume_discrepancy_count,
    r.rate_discrepancy_count,
    r.expected_retail_usage_revenue,
    r.actual_retail_usage_revenue,
    r.actual_retail_usage_revenue - r.expected_retail_usage_revenue as net_retail_revenue_variance,
    r.retail_revenue_leakage,
    r.retail_overbilling_exposure,
    round(
        (r.retail_revenue_leakage / nullif(r.expected_retail_usage_revenue, 0)) * 100.0,
        2
    ) as retail_revenue_leakage_pct,
    coalesce(w.total_roaming_settlement_events, 0) as total_roaming_settlement_events,
    coalesce(w.matched_tap_count, 0) as matched_tap_count,
    coalesce(w.tap_overcharge_count, 0) as tap_overcharge_count,
    coalesce(w.unverified_tap_claim_count, 0) as unverified_tap_claim_count,
    coalesce(w.missing_tap_record_count, 0) as missing_tap_record_count,
    coalesce(w.expected_wholesale_roaming_cost, 0.00) as expected_wholesale_roaming_cost,
    coalesce(w.billed_tap_wholesale_cost, 0.00) as billed_tap_wholesale_cost,
    coalesce(w.wholesale_tap_dispute_amount, 0.00) as wholesale_tap_dispute_amount,
    coalesce(w.wholesale_unsettled_accrual_amount, 0.00) as wholesale_unsettled_accrual_amount
from retail r
left join wholesale w
    on r.billing_period = w.billing_period
