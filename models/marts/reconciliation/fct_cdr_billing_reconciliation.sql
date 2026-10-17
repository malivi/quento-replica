with matched_events as (
    select * from {{ ref('int_cdr_to_billing_matched') }}
),

classified as (
    select
        *,
        case
            when is_present_in_network and not is_present_in_billing
                then 'UNBILLED_CDR'
            when not is_present_in_network and is_present_in_billing
                then 'PHANTOM_BILLING'
            when expected_is_bundle_covered != actual_is_bundle_covered
                 and not ({{ is_within_tolerance('actual_billed_amount', 'expected_billed_amount') }})
                then 'BUNDLE_ALLOWANCE_ERROR'
            when abs(usage_units_variance) > 0.01
                 and not ({{ is_within_tolerance('actual_billed_amount', 'expected_billed_amount') }})
                then 'VOLUME_DISCREPANCY'
            when abs(billed_unit_rate - expected_unit_rate) > 0.0001
                 and not ({{ is_within_tolerance('actual_billed_amount', 'expected_billed_amount') }})
                then 'RATE_DISCREPANCY'
            when not ({{ is_within_tolerance('actual_billed_amount', 'expected_billed_amount') }})
                then 'AMOUNT_DISCREPANCY'
            else 'MATCHED'
        end as reconciliation_status
    from matched_events
)

select
    cdr_id,
    billing_record_id,
    invoice_id,
    subscriber_id,
    billing_period,
    service_type,
    plan_id,
    plan_name,
    network_event_timestamp,
    billed_timestamp,
    coalesce(is_roaming, false) as is_roaming,
    roaming_partner_id,
    network_element_id,
    mediation_status,
    coalesce(had_switch_duplicates, false) as had_switch_duplicates,
    is_present_in_network,
    is_present_in_billing,
    network_usage_units,
    expected_in_bundle_units,
    expected_chargeable_units,
    billed_usage_units,
    usage_units_variance,
    expected_is_bundle_covered,
    actual_is_bundle_covered,
    expected_unit_rate,
    billed_unit_rate,
    expected_billed_amount,
    actual_billed_amount,
    billing_amount_variance,
    greatest(cast(0.00 as numeric(12, 2)), expected_billed_amount - actual_billed_amount) as revenue_leakage_amount,
    greatest(cast(0.00 as numeric(12, 2)), actual_billed_amount - expected_billed_amount) as overbilling_exposure_amount,
    reconciliation_status,
    (reconciliation_status != 'MATCHED') as has_discrepancy,
    case reconciliation_status
        when 'UNBILLED_CDR' then 'Network switch CDR was not rated/billed (check mediation drop status)'
        when 'PHANTOM_BILLING' then 'Billed usage record has no originating network switch CDR'
        when 'BUNDLE_ALLOWANCE_ERROR' then 'OCS bundle quota tracking out of sync with cumulative plan allowance'
        when 'VOLUME_DISCREPANCY' then 'Billed duration/volume differs from network switch measurement'
        when 'RATE_DISCREPANCY' then 'Applied tariff unit rate does not match subscriber rate plan schedule'
        when 'AMOUNT_DISCREPANCY' then 'Calculated charge differs from expected rated amount'
        else 'Reconciled within tolerance'
    end as root_cause_hint
from classified
