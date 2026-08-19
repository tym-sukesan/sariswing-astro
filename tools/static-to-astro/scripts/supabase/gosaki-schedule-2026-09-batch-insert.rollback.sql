-- =============================================================================
-- gosaki-2026-09-batch-insert-db-write-packet
-- ROLLBACK packet — SEPARATE from forward INSERT. Operator judgment only.
-- Status: NOT EXECUTED by Cursor. Do not auto-run. Do not auto-retry.
-- Project: static-to-astro-cms-staging / kmjqppxjdnwwrtaeqjta ONLY
-- NEVER run on vsbvndwuajjhnzpohghh
-- Deletes ONLY legacy_id schedule-2026-09-002 .. 018
-- NEVER deletes schedule-2026-09-001
-- =============================================================================
-- OPERATOR GATE (visual, before paste):
--   Dashboard URL / project ref MUST contain kmjqppxjdnwwrtaeqjta
-- STOP if timeout, empty result, or outcome is unclear.
-- Do not retry. Do not cleanup. Ask human.
-- =============================================================================

DO $rollback$
DECLARE
  v_target integer;
  v_fingerprint integer;
  v_001_pub boolean;
  v_001_id uuid;
  v_deleted integer;
  v_remain integer;
BEGIN
  SELECT count(*) INTO v_target
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano'
    AND legacy_id IN (
      'schedule-2026-09-002',
      'schedule-2026-09-003',
      'schedule-2026-09-004',
      'schedule-2026-09-005',
      'schedule-2026-09-006',
      'schedule-2026-09-007',
      'schedule-2026-09-008',
      'schedule-2026-09-009',
      'schedule-2026-09-010',
      'schedule-2026-09-011',
      'schedule-2026-09-012',
      'schedule-2026-09-013',
      'schedule-2026-09-014',
      'schedule-2026-09-015',
      'schedule-2026-09-016',
      'schedule-2026-09-017',
      'schedule-2026-09-018'
    );

  IF v_target IS DISTINCT FROM 17 THEN
    RAISE EXCEPTION 'ROLLBACK_PRECONDITION_FAIL: 002-018 count=% expected 17 — refuse (would miss or over-delete)', v_target;
  END IF;

  SELECT count(*) INTO v_fingerprint
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano'
    AND month = '2026-09'
    AND source_file = 'schedule-2026-09.html'
    AND source_route = '/schedule/2026-09/'
    AND sort_order BETWEEN 80 AND 96
    AND legacy_id IN (
      'schedule-2026-09-002',
      'schedule-2026-09-003',
      'schedule-2026-09-004',
      'schedule-2026-09-005',
      'schedule-2026-09-006',
      'schedule-2026-09-007',
      'schedule-2026-09-008',
      'schedule-2026-09-009',
      'schedule-2026-09-010',
      'schedule-2026-09-011',
      'schedule-2026-09-012',
      'schedule-2026-09-013',
      'schedule-2026-09-014',
      'schedule-2026-09-015',
      'schedule-2026-09-016',
      'schedule-2026-09-017',
      'schedule-2026-09-018'
    );

  IF v_fingerprint IS DISTINCT FROM 17 THEN
    RAISE EXCEPTION 'ROLLBACK_PRECONDITION_FAIL: 002-018 INSERT fingerprint matching % expected 17 — refuse DELETE', v_fingerprint;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.schedules
    WHERE site_slug = 'gosaki-piano'
      AND published = true
      AND month = '2026-09'
      AND legacy_id NOT IN (
      'schedule-2026-09-002',
      'schedule-2026-09-003',
      'schedule-2026-09-004',
      'schedule-2026-09-005',
      'schedule-2026-09-006',
      'schedule-2026-09-007',
      'schedule-2026-09-008',
      'schedule-2026-09-009',
      'schedule-2026-09-010',
      'schedule-2026-09-011',
      'schedule-2026-09-012',
      'schedule-2026-09-013',
      'schedule-2026-09-014',
      'schedule-2026-09-015',
      'schedule-2026-09-016',
      'schedule-2026-09-017',
      'schedule-2026-09-018'
      )
  ) THEN
    RAISE EXCEPTION 'ROLLBACK_PRECONDITION_FAIL: extra published September rows besides 002-018 — refuse';
  END IF;

  SELECT id, published INTO v_001_id, v_001_pub
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano'
    AND legacy_id = 'schedule-2026-09-001';

  IF v_001_id IS DISTINCT FROM '18b48259-9a9a-4b00-b136-6c0c4ff3b2f3'::uuid THEN
    RAISE EXCEPTION 'ROLLBACK_PRECONDITION_FAIL: 001 missing or wrong id';
  END IF;

  IF v_001_pub IS NOT DISTINCT FROM true THEN
    RAISE EXCEPTION 'ROLLBACK_PRECONDITION_FAIL: 001 is published — refuse rollback of 002-018 until reviewed';
  END IF;

  DELETE FROM public.schedules
  WHERE site_slug = 'gosaki-piano'
    AND legacy_id IN (
      'schedule-2026-09-002',
      'schedule-2026-09-003',
      'schedule-2026-09-004',
      'schedule-2026-09-005',
      'schedule-2026-09-006',
      'schedule-2026-09-007',
      'schedule-2026-09-008',
      'schedule-2026-09-009',
      'schedule-2026-09-010',
      'schedule-2026-09-011',
      'schedule-2026-09-012',
      'schedule-2026-09-013',
      'schedule-2026-09-014',
      'schedule-2026-09-015',
      'schedule-2026-09-016',
      'schedule-2026-09-017',
      'schedule-2026-09-018'
    );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted IS DISTINCT FROM 17 THEN
    RAISE EXCEPTION 'ROLLBACK_FAIL: deleted % expected 17 — rolling back DELETE', v_deleted;
  END IF;

  SELECT count(*) INTO v_remain
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano'
    AND legacy_id IN (
      'schedule-2026-09-002',
      'schedule-2026-09-003',
      'schedule-2026-09-004',
      'schedule-2026-09-005',
      'schedule-2026-09-006',
      'schedule-2026-09-007',
      'schedule-2026-09-008',
      'schedule-2026-09-009',
      'schedule-2026-09-010',
      'schedule-2026-09-011',
      'schedule-2026-09-012',
      'schedule-2026-09-013',
      'schedule-2026-09-014',
      'schedule-2026-09-015',
      'schedule-2026-09-016',
      'schedule-2026-09-017',
      'schedule-2026-09-018'
  );

  IF v_remain IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'ROLLBACK_FAIL: 002-018 still present (%)', v_remain;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.schedules
    WHERE site_slug = 'gosaki-piano'
      AND id = '18b48259-9a9a-4b00-b136-6c0c4ff3b2f3'::uuid
      AND legacy_id = 'schedule-2026-09-001'
      AND published = false
  ) THEN
    RAISE EXCEPTION 'ROLLBACK_FAIL: 001 missing or mutated';
  END IF;
END
$rollback$;

SELECT
  (SELECT count(*) FROM public.schedules
     WHERE site_slug = 'gosaki-piano' AND published = true) AS published_total,
  (SELECT count(*) FROM public.schedules
     WHERE site_slug = 'gosaki-piano' AND published = true AND month = '2026-09') AS published_september,
  (SELECT count(*) FROM public.schedules
     WHERE site_slug = 'gosaki-piano'
       AND legacy_id IN (
      'schedule-2026-09-002',
      'schedule-2026-09-003',
      'schedule-2026-09-004',
      'schedule-2026-09-005',
      'schedule-2026-09-006',
      'schedule-2026-09-007',
      'schedule-2026-09-008',
      'schedule-2026-09-009',
      'schedule-2026-09-010',
      'schedule-2026-09-011',
      'schedule-2026-09-012',
      'schedule-2026-09-013',
      'schedule-2026-09-014',
      'schedule-2026-09-015',
      'schedule-2026-09-016',
      'schedule-2026-09-017',
      'schedule-2026-09-018'
     )) AS ids_002_018_remaining,
  (SELECT count(*) FROM public.schedules
     WHERE site_slug = 'gosaki-piano'
       AND legacy_id = 'schedule-2026-09-001' AND published = false
       AND id = '18b48259-9a9a-4b00-b136-6c0c4ff3b2f3') AS test_001_unpublished,
  (
    (SELECT count(*) FROM public.schedules WHERE site_slug = 'gosaki-piano' AND published = true) = 74
    AND (SELECT count(*) FROM public.schedules WHERE site_slug = 'gosaki-piano' AND published = true AND month = '2026-09') = 0
    AND (SELECT count(*) FROM public.schedules
          WHERE site_slug = 'gosaki-piano'
            AND legacy_id IN (
      'schedule-2026-09-002',
      'schedule-2026-09-003',
      'schedule-2026-09-004',
      'schedule-2026-09-005',
      'schedule-2026-09-006',
      'schedule-2026-09-007',
      'schedule-2026-09-008',
      'schedule-2026-09-009',
      'schedule-2026-09-010',
      'schedule-2026-09-011',
      'schedule-2026-09-012',
      'schedule-2026-09-013',
      'schedule-2026-09-014',
      'schedule-2026-09-015',
      'schedule-2026-09-016',
      'schedule-2026-09-017',
      'schedule-2026-09-018'
    )) = 0
    AND (SELECT count(*) FROM public.schedules
          WHERE site_slug = 'gosaki-piano'
            AND legacy_id = 'schedule-2026-09-001' AND published = false
            AND id = '18b48259-9a9a-4b00-b136-6c0c4ff3b2f3') = 1
  ) AS rollback_ok;
