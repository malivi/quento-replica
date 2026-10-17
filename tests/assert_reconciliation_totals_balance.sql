-- Singular test: Ensure that the sum of event-level expected and actual billed amounts
-- in fct_cdr_billing_reconciliation exactly matches mart_revenue_assurance_summary.

with event_totals as (
    select
        billing_period,
        sum(expected_billed_amount) as expected_total,
        sum(actual_billed_amount) as actual_total,
        sum(revenue_leakage_amount) as leakage_total,
        sum(overbilling_exposure_amount) as overbilling_total
    from {{ ref('fct_cdr_billing_reconciliation') }}
    group by billing_period
),

summary_totals as (
    select
        billing_period,
        expected_retail_usage_revenue,
        actual_retail_usage_revenue,
        retail_revenue_leakage,
        retail_overbilling_exposure
    from {{ ref('mart_revenue_assurance_summary') }}
)

select
    e.billing_period,
    e.expected_total,
    s.expected_retail_usage_revenue,
    e.actual_total,
    s.actual_retail_usage_revenue
from event_totals e
inner join summary_totals s
    on e.billing_period = s.billing_period
where abs(e.expected_total - s.expected_retail_usage_revenue) > 0.001
   or abs(e.actual_total - s.actual_retail_usage_revenue) > 0.001
   or abs(e.leakage_total - s.retail_revenue_leakage) > 0.001
   or abs(e.overbilling_total - s.retail_overbilling_exposure) > 0.001
