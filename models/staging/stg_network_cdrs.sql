with raw_cdrs as (
    select
        *,
        row_number() over (
            partition by cdr_id
            order by event_timestamp asc
        ) as cdr_row_num,
        count(*) over (
            partition by cdr_id
        ) as raw_occurrence_count
    from {{ ref('raw_network_cdrs') }}
),

deduplicated as (
    select *
    from raw_cdrs
    where cdr_row_num = 1
)

select
    cdr_id,
    call_reference_id,
    subscriber_id,
    msisdn,
    service_type,
    cast(event_timestamp as timestamp) as event_timestamp,
    strftime(cast(event_timestamp as timestamp), '%Y-%m') as billing_period,
    cast(duration_seconds as integer) as duration_seconds,
    {{ seconds_to_billable_minutes('duration_seconds') }} as duration_minutes,
    cast(data_volume_mb as numeric(12, 2)) as data_volume_mb,
    cast(sms_count as integer) as sms_count,
    origin_country,
    destination_country,
    cast(is_roaming as boolean) as is_roaming,
    nullif(trim(roaming_partner_id), '') as roaming_partner_id,
    cell_tower_id,
    network_element_id,
    termination_cause,
    mediation_status,
    raw_occurrence_count,
    (raw_occurrence_count > 1) as had_switch_duplicates,
    case
        when termination_cause = 'NORMAL_CLEARING'
         and (duration_seconds > 0 or data_volume_mb > 0 or sms_count > 0)
        then true
        else false
    end as is_billable_event
from deduplicated
