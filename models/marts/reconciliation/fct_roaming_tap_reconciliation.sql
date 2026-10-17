with matched_tap as (
    select * from {{ ref('int_roaming_tap_matched') }}
),

classified as (
    select
        *,
        case
            when not is_present_in_home_switch and is_present_in_tap_file
                then 'MISSING_IN_HOME_SWITCH'
            when is_present_in_home_switch and not is_present_in_tap_file
                then 'MISSING_TAP_RECORD'
            when wholesale_amount_variance > {{ var('amount_tolerance_usd', 0.01) }}
                then 'TAP_OVERCHARGE'
            when wholesale_amount_variance < -{{ var('amount_tolerance_usd', 0.01) }}
                then 'TAP_UNDERCHARGE'
            else 'MATCHED_SETTLEMENT'
        end as tap_reconciliation_status
    from matched_tap
)

select
    cdr_id,
    tap_record_id,
    tap_file_batch_id,
    call_reference_id,
    partner_id,
    partner_name,
    tap_code,
    country_iso,
    agreement_type,
    subscriber_id,
    billing_period,
    service_type,
    event_timestamp,
    is_present_in_home_switch,
    is_present_in_tap_file,
    switch_usage_units,
    tap_usage_units,
    tap_units_variance,
    contracted_wholesale_rate,
    expected_wholesale_amount,
    tap_charged_amount,
    wholesale_amount_variance,
    case
        when tap_reconciliation_status in ('TAP_OVERCHARGE', 'MISSING_IN_HOME_SWITCH')
            then greatest(cast(0.00 as numeric(12, 2)), wholesale_amount_variance)
        else cast(0.00 as numeric(12, 2))
    end as wholesale_dispute_amount,
    case
        when tap_reconciliation_status = 'MISSING_TAP_RECORD'
            then expected_wholesale_amount
        else cast(0.00 as numeric(12, 2))
    end as unsettled_accrual_amount,
    settlement_currency,
    tap_reconciliation_status,
    (tap_reconciliation_status != 'MATCHED_SETTLEMENT') as has_tap_discrepancy
from classified
