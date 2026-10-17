with source as (
    select * from {{ ref('raw_billing_records') }}
)

select
    billing_record_id,
    cdr_id,
    invoice_id,
    subscriber_id,
    billing_period,
    service_type,
    cast(billed_timestamp as timestamp) as billed_timestamp,
    cast(billed_duration_seconds as integer) as billed_duration_seconds,
    {{ seconds_to_billable_minutes('billed_duration_seconds') }} as billed_duration_minutes,
    cast(billed_data_volume_mb as numeric(12, 2)) as billed_data_volume_mb,
    cast(billed_sms_count as integer) as billed_sms_count,
    cast(applied_unit_rate as numeric(10, 4)) as applied_unit_rate,
    cast(billed_amount as numeric(12, 2)) as billed_amount,
    cast(is_bundle_covered as boolean) as is_bundle_covered,
    cast(tax_amount as numeric(12, 2)) as tax_amount,
    cast(total_amount as numeric(12, 2)) as total_amount
from source
