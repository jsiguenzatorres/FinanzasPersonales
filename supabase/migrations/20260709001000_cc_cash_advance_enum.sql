-- ===========================================================================
-- FlowFinance — 34a · Nuevo transaction_kind: cc_cash_advance
-- ===========================================================================
-- Separado de la migración de family_loans (34b) porque Postgres no permite
-- usar un valor de enum nuevo dentro de la misma transacción en la que se
-- crea (SQLSTATE 55P04) — el resto de la migración lo referencia en checks
-- y funciones, así que necesita ir en un archivo aparte que se confirme primero.
-- ===========================================================================

alter type transaction_kind add value if not exists 'cc_cash_advance';
