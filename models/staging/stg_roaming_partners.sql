with source as (
    select * from {{ ref('roaming_partners') }}
)

select
    partner_id,
    partner_name,
    tap_code,
    country_iso,
    agreement_type,
    cast(wholesale_voice_rate_per_min as numeric(10, 4)) as wholesale_voice_rate_per_min,
    cast(wholesale_data_rate_per_mb as numeric(10, 4)) as wholesale_data_rate_per_mb,
    cast(wholesale_sms_rate_per_msg as numeric(10, 4)) as wholesale_sms_rate_per_msg
from source
