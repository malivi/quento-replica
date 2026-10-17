with billable_cdrs as (
    select *
    from {{ ref('stg_network_cdrs') }}
    where is_billable_event = true
),

subscribers as (
    select * from {{ ref('stg_subscribers') }}
),

rate_plans as (
    select * from {{ ref('stg_rate_plans') }}
),

cdr_with_plan as (
    select
        c.cdr_id,
        c.call_reference_id,
        c.subscriber_id,
        c.msisdn,
        s.plan_id,
        p.plan_name,
        c.billing_period,
        c.service_type,
        c.event_timestamp,
        c.duration_seconds,
        c.duration_minutes,
        c.data_volume_mb,
        c.sms_count,
        c.is_roaming,
        c.roaming_partner_id,
        c.network_element_id,
        c.mediation_status,
        c.had_switch_duplicates,
        case c.service_type
            when 'VOICE' then c.duration_minutes
            when 'DATA' then c.data_volume_mb
            when 'SMS' then cast(c.sms_count as numeric(12, 2))
        end as usage_units,
        case c.service_type
            when 'VOICE' then p.included_voice_minutes
            when 'DATA' then p.included_data_mb
            when 'SMS' then cast(p.included_sms_count as numeric(12, 2))
        end as plan_included_units,
        case c.service_type
            when 'VOICE' then p.voice_overage_rate_per_min
            when 'DATA' then p.data_overage_rate_per_mb
            when 'SMS' then p.sms_overage_rate_per_msg
        end as domestic_overage_rate,
        case c.service_type
            when 'VOICE' then p.roaming_voice_rate_per_min
            when 'DATA' then p.roaming_data_rate_per_mb
            when 'SMS' then p.roaming_sms_rate_per_msg
        end as roaming_unit_rate
    from billable_cdrs c
    inner join subscribers s
        on c.subscriber_id = s.subscriber_id
    inner join rate_plans p
        on s.plan_id = p.plan_id
),

cumulative_window as (
    select
        *,
        sum(case when not is_roaming then usage_units else 0 end) over (
            partition by subscriber_id, billing_period, service_type
            order by event_timestamp asc, cdr_id asc
            rows between unbounded preceding and current row
        ) as cumulative_domestic_units_after
    from cdr_with_plan
),

bundle_allocation as (
    select
        *,
        cumulative_domestic_units_after
            - (case when not is_roaming then usage_units else 0 end)
            as cumulative_domestic_units_before,
        case
            when is_roaming then cast(0.00 as numeric(12, 2))
            else greatest(
                cast(0.00 as numeric(12, 2)),
                least(
                    usage_units,
                    plan_included_units - (
                        cumulative_domestic_units_after - usage_units
                    )
                )
            )
        end as in_bundle_units
    from cumulative_window
)

select
    cdr_id,
    call_reference_id,
    subscriber_id,
    msisdn,
    plan_id,
    plan_name,
    billing_period,
    service_type,
    event_timestamp,
    duration_seconds,
    duration_minutes,
    data_volume_mb,
    sms_count,
    is_roaming,
    roaming_partner_id,
    network_element_id,
    mediation_status,
    had_switch_duplicates,
    usage_units,
    plan_included_units,
    cumulative_domestic_units_before,
    cumulative_domestic_units_after,
    in_bundle_units,
    cast(usage_units - in_bundle_units as numeric(12, 2)) as chargeable_units,
    case
        when is_roaming then roaming_unit_rate
        when (usage_units - in_bundle_units) > 0 then domestic_overage_rate
        else cast(0.0000 as numeric(10, 4))
    end as expected_unit_rate,
    (usage_units - in_bundle_units) = 0 as expected_is_bundle_covered,
    round(
        (usage_units - in_bundle_units) * (
            case
                when is_roaming then roaming_unit_rate
                when (usage_units - in_bundle_units) > 0 then domestic_overage_rate
                else 0.0000
            end
        ),
        2
    ) as expected_billed_amount
from bundle_allocation
