with source as (
    select * from {{ ref('rate_plans') }}
)

select
    plan_id,
    plan_name,
    cast(monthly_fee as numeric(12, 2)) as monthly_fee,
    cast(included_voice_minutes as numeric(12, 2)) as included_voice_minutes,
    cast(included_data_mb as numeric(12, 2)) as included_data_mb,
    cast(included_sms_count as integer) as included_sms_count,
    cast(voice_overage_rate_per_min as numeric(10, 4)) as voice_overage_rate_per_min,
    cast(data_overage_rate_per_mb as numeric(10, 4)) as data_overage_rate_per_mb,
    cast(sms_overage_rate_per_msg as numeric(10, 4)) as sms_overage_rate_per_msg,
    cast(roaming_voice_rate_per_min as numeric(10, 4)) as roaming_voice_rate_per_min,
    cast(roaming_data_rate_per_mb as numeric(10, 4)) as roaming_data_rate_per_mb,
    cast(roaming_sms_rate_per_msg as numeric(10, 4)) as roaming_sms_rate_per_msg
from source
