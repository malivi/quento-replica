-- Singular test: Ensure no billable network CDR has zero or negative usage units
-- or negative expected billed amounts.

select
    cdr_id,
    subscriber_id,
    service_type,
    usage_units,
    expected_billed_amount
from {{ ref('int_cdr_rated_usage') }}
where usage_units <= 0
   or chargeable_units < 0
   or in_bundle_units < 0
   or expected_billed_amount < 0
