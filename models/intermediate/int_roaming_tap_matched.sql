with roaming_cdrs as (
    select *
    from {{ ref('stg_network_cdrs') }}
    where is_billable_event = true
      and is_roaming = true
),

tap_records as (
    select * from {{ ref('stg_partner_tap_records') }}
),

partners as (
    select * from {{ ref('stg_roaming_partners') }}
),

matched as (
    select
        coalesce(c.cdr_id, t.cdr_id) as cdr_id,
        t.tap_record_id,
        t.tap_file_batch_id,
        coalesce(c.call_reference_id, t.call_reference_id) as call_reference_id,
        coalesce(c.roaming_partner_id, t.partner_id) as partner_id,
        coalesce(c.subscriber_id, t.subscriber_id) as subscriber_id,
        coalesce(c.billing_period, t.billing_period) as billing_period,
        coalesce(c.service_type, t.service_type) as service_type,
        coalesce(c.event_timestamp, t.event_timestamp) as event_timestamp,
        (c.cdr_id is not null) as is_present_in_home_switch,
        (t.tap_record_id is not null) as is_present_in_tap_file,
        case coalesce(c.service_type, t.service_type)
            when 'VOICE' then coalesce(c.duration_minutes, 0.00)
            when 'DATA' then coalesce(c.data_volume_mb, 0.00)
            when 'SMS' then cast(coalesce(c.sms_count, 0) as numeric(12, 2))
        end as switch_usage_units,
        case coalesce(c.service_type, t.service_type)
            when 'VOICE' then coalesce(t.tap_duration_minutes, 0.00)
            when 'DATA' then coalesce(t.tap_data_volume_mb, 0.00)
            when 'SMS' then cast(coalesce(t.tap_sms_count, 0) as numeric(12, 2))
        end as tap_usage_units,
        coalesce(t.wholesale_charged_amount, 0.00) as tap_charged_amount,
        coalesce(t.settlement_currency, 'USD') as settlement_currency
    from roaming_cdrs c
    full outer join tap_records t
        on c.cdr_id = t.cdr_id
)

select
    m.cdr_id,
    m.tap_record_id,
    m.tap_file_batch_id,
    m.call_reference_id,
    m.partner_id,
    p.partner_name,
    p.tap_code,
    p.country_iso,
    p.agreement_type,
    m.subscriber_id,
    m.billing_period,
    m.service_type,
    m.event_timestamp,
    m.is_present_in_home_switch,
    m.is_present_in_tap_file,
    m.switch_usage_units,
    m.tap_usage_units,
    m.tap_usage_units - m.switch_usage_units as tap_units_variance,
    case m.service_type
        when 'VOICE' then p.wholesale_voice_rate_per_min
        when 'DATA' then p.wholesale_data_rate_per_mb
        when 'SMS' then p.wholesale_sms_rate_per_msg
    end as contracted_wholesale_rate,
    round(
        m.switch_usage_units * (
            case m.service_type
                when 'VOICE' then p.wholesale_voice_rate_per_min
                when 'DATA' then p.wholesale_data_rate_per_mb
                when 'SMS' then p.wholesale_sms_rate_per_msg
            end
        ),
        2
    ) as expected_wholesale_amount,
    m.tap_charged_amount,
    m.tap_charged_amount - round(
        m.switch_usage_units * (
            case m.service_type
                when 'VOICE' then p.wholesale_voice_rate_per_min
                when 'DATA' then p.wholesale_data_rate_per_mb
                when 'SMS' then p.wholesale_sms_rate_per_msg
            end
        ),
        2
    ) as wholesale_amount_variance,
    m.settlement_currency
from matched m
inner join partners p
    on m.partner_id = p.partner_id
