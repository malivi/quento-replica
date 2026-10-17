with subscribers as (
    select * from {{ ref('stg_subscribers') }}
),

rate_plans as (
    select * from {{ ref('stg_rate_plans') }}
),

reconciliation_events as (
    select * from {{ ref('fct_cdr_billing_reconciliation') }}
),

subscriber_usage_agg as (
    select
        subscriber_id,
        billing_period,
        -- Domestic network usage
        sum(case when service_type = 'VOICE' and not is_roaming then network_usage_units else 0 end) as domestic_voice_minutes_used,
        sum(case when service_type = 'DATA' and not is_roaming then network_usage_units else 0 end) as domestic_data_mb_used,
        sum(case when service_type = 'SMS' and not is_roaming then network_usage_units else 0 end) as domestic_sms_count_used,

        -- Expected bundle consumption
        sum(case when service_type = 'VOICE' then expected_in_bundle_units else 0 end) as voice_bundle_minutes_consumed,
        sum(case when service_type = 'DATA' then expected_in_bundle_units else 0 end) as data_bundle_mb_consumed,
        sum(case when service_type = 'SMS' then expected_in_bundle_units else 0 end) as sms_bundle_count_consumed,

        -- Expected chargeable overage / roaming units
        sum(case when service_type = 'VOICE' and not is_roaming then expected_chargeable_units else 0 end) as expected_voice_overage_minutes,
        sum(case when service_type = 'DATA' and not is_roaming then expected_chargeable_units else 0 end) as expected_data_overage_mb,
        sum(case when service_type = 'SMS' and not is_roaming then expected_chargeable_units else 0 end) as expected_sms_overage_count,

        -- Financial totals
        sum(expected_billed_amount) as expected_usage_charges,
        sum(actual_billed_amount) as actual_billed_usage_charges,
        sum(revenue_leakage_amount) as total_revenue_leakage,
        sum(overbilling_exposure_amount) as total_overbilling_exposure,
        count(case when has_discrepancy then 1 end) as discrepancy_event_count
    from reconciliation_events
    group by subscriber_id, billing_period
)

select
    s.subscriber_id,
    s.msisdn,
    s.customer_segment,
    s.account_status,
    u.billing_period,
    p.plan_id,
    p.plan_name,
    p.monthly_fee,

    -- Voice bundle summary
    p.included_voice_minutes,
    u.domestic_voice_minutes_used,
    u.voice_bundle_minutes_consumed,
    u.expected_voice_overage_minutes,

    -- Data bundle summary
    p.included_data_mb,
    u.domestic_data_mb_used,
    u.data_bundle_mb_consumed,
    u.expected_data_overage_mb,

    -- SMS bundle summary
    p.included_sms_count,
    cast(u.domestic_sms_count_used as integer) as domestic_sms_count_used,
    cast(u.sms_bundle_count_consumed as integer) as sms_bundle_count_consumed,
    cast(u.expected_sms_overage_count as integer) as expected_sms_overage_count,

    -- Invoice reconciliation
    u.expected_usage_charges,
    u.actual_billed_usage_charges,
    p.monthly_fee + u.expected_usage_charges as expected_invoice_subtotal,
    p.monthly_fee + u.actual_billed_usage_charges as actual_invoice_subtotal,
    u.actual_billed_usage_charges - u.expected_usage_charges as net_usage_billing_variance,
    u.total_revenue_leakage,
    u.total_overbilling_exposure,
    u.discrepancy_event_count,
    case
        when {{ is_within_tolerance('u.actual_billed_usage_charges', 'u.expected_usage_charges') }}
             and u.discrepancy_event_count = 0
            then 'RECONCILED'
        when u.actual_billed_usage_charges > u.expected_usage_charges
            then 'NET_OVERBILLED'
        when u.actual_billed_usage_charges < u.expected_usage_charges
            then 'NET_UNDERBILLED_LEAKAGE'
        else 'OFFSETTING_DISCREPANCIES'
    end as subscriber_reconciliation_status
from subscriber_usage_agg u
inner join subscribers s
    on u.subscriber_id = s.subscriber_id
inner join rate_plans p
    on s.plan_id = p.plan_id
