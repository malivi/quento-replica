{% macro seconds_to_billable_minutes(duration_seconds_col) %}
    round(cast({{ duration_seconds_col }} as numeric(12, 4)) / 60.0, 2)
{% endmacro %}

{% macro is_within_tolerance(amount_a, amount_b, tolerance_var='amount_tolerance_usd') %}
    abs(coalesce({{ amount_a }}, 0) - coalesce({{ amount_b }}, 0)) <= {{ var(tolerance_var, 0.01) }}
{% endmacro %}
