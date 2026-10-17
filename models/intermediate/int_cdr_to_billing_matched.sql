with rated_cdrs as (
    select * from {{ ref('int_cdr_rated_usage') }}
),

billing_records as (
    select
        *,
        case service_type
            when 'VOICE' then billed_duration_minutes
            when 'DATA' then billed_data_volume_mb
            when 'SMS' then cast(billed_sms_count as numeric(12, 2))
        end as billed_usage_units
    from {{ ref('stg_billing_records') }}
)

select
    coalesce(c.cdr_id, b.cdr_id) as cdr_id,
    b.billing_record_id,
    b.invoice_id,
    coalesce(c.subscriber_id, b.subscriber_id) as subscriber_id,
    coalesce(c.billing_period, b.billing_period) as billing_period,
    coalesce(c.service_type, b.service_type) as service_type,
    c.plan_id,
    c.plan_name,
    c.event_timestamp as network_event_timestamp,
    b.billed_timestamp,
    c.is_roaming,
    c.roaming_partner_id,
    c.network_element_id,
    c.mediation_status,
    c.had_switch_duplicates,

    -- Presence flags
    (c.cdr_id is not null) as is_present_in_network,
    (b.billing_record_id is not null) as is_present_in_billing,

    -- Network vs Billed volume metrics
    coalesce(c.usage_units, 0.00) as network_usage_units,
    coalesce(c.in_bundle_units, 0.00) as expected_in_bundle_units,
    coalesce(c.chargeable_units, 0.00) as expected_chargeable_units,
    coalesce(b.billed_usage_units, 0.00) as billed_usage_units,
    coalesce(b.billed_usage_units, 0.00) - coalesce(c.usage_units, 0.00) as usage_units_variance,

    -- Bundle coverage & tariff rates
    c.expected_is_bundle_covered,
    b.is_bundle_covered as actual_is_bundle_covered,
    coalesce(c.expected_unit_rate, 0.0000) as expected_unit_rate,
    coalesce(b.applied_unit_rate, 0.0000) as billed_unit_rate,

    -- Monetary amounts (excluding tax)
    coalesce(c.expected_billed_amount, 0.00) as expected_billed_amount,
    coalesce(b.billed_amount, 0.00) as actual_billed_amount,
    coalesce(b.billed_amount, 0.00) - coalesce(c.expected_billed_amount, 0.00) as billing_amount_variance
from rated_cdrs c
full outer join billing_records b
    on c.cdr_id = b.cdr_id
