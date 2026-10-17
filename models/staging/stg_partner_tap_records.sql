with source as (
    select * from {{ ref('raw_partner_tap_records') }}
)

select
    tap_record_id,
    tap_file_batch_id,
    call_reference_id,
    cdr_id,
    partner_id,
    subscriber_id,
    service_type,
    cast(event_timestamp as timestamp) as event_timestamp,
    strftime(cast(event_timestamp as timestamp), '%Y-%m') as billing_period,
    cast(tap_duration_seconds as integer) as tap_duration_seconds,
    {{ seconds_to_billable_minutes('tap_duration_seconds') }} as tap_duration_minutes,
    cast(tap_data_volume_mb as numeric(12, 2)) as tap_data_volume_mb,
    cast(tap_sms_count as integer) as tap_sms_count,
    cast(wholesale_charged_amount as numeric(12, 2)) as wholesale_charged_amount,
    settlement_currency
from source
