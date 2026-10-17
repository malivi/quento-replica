with source as (
    select * from {{ ref('subscribers') }}
)

select
    subscriber_id,
    msisdn,
    cast(imsi as varchar) as imsi,
    plan_id,
    account_status,
    cast(activation_date as date) as activation_date,
    cast(billing_cycle_day as integer) as billing_cycle_day,
    customer_segment
from source
