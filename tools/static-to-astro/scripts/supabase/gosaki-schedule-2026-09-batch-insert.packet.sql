-- =============================================================================
-- gosaki-2026-09-batch-insert-db-write-packet
-- FORWARD packet — operator SQL Editor, ONE paste, ONE execution
-- Status: NOT EXECUTED by Cursor. Do not auto-retry.
-- Project: static-to-astro-cms-staging / kmjqppxjdnwwrtaeqjta ONLY
-- NEVER run on vsbvndwuajjhnzpohghh (Sariswing production)
-- site_slug: gosaki-piano
-- approvalId: gosaki-2026-09-batch-insert-non-dry-run
-- Rows: INSERT 17 (legacy_id schedule-2026-09-002 .. 018)
-- NEVER INSERT/UPDATE/DELETE schedule-2026-09-001
-- =============================================================================
-- OPERATOR GATE (visual, before paste):
--   Dashboard URL / project ref MUST contain kmjqppxjdnwwrtaeqjta
-- STOP if timeout, empty result, or outcome is unclear.
-- Do not retry. Do not cleanup. Ask human.
-- =============================================================================

DO $packet$
DECLARE
  v_published integer;
  v_published_before_sept integer;
  v_max_sort integer;
  v_max_upd timestamptz;
  v_001_n integer;
  v_001_pub boolean;
  v_001_title text;
  v_001_date date;
  v_001_id uuid;
  v_target_exist integer;
  v_any_sept_pub integer;
  v_after_sept integer;
  v_after_ids integer;
  v_after_sort integer;
  v_dup integer;
  v_001_after_pub boolean;
  v_001_after_title text;
  v_existing_upd timestamptz;
  v_inserted integer;
  v_after_published integer;
  v_after_pre_sept integer;
BEGIN
  SELECT count(*) INTO v_published
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano' AND published = true;

  IF v_published IS DISTINCT FROM 74 THEN
    RAISE EXCEPTION 'PRECONDITION_FAIL: published gosaki-piano count=% expected 74', v_published;
  END IF;

  SELECT count(*) INTO v_published_before_sept
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano'
    AND published = true
    AND date < DATE '2026-09-01';

  IF v_published_before_sept IS DISTINCT FROM 74 THEN
    RAISE EXCEPTION 'PRECONDITION_FAIL: published pre-September count=% expected 74', v_published_before_sept;
  END IF;

  SELECT max(sort_order) INTO v_max_sort
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano';

  IF v_max_sort IS DISTINCT FROM 79 THEN
    RAISE EXCEPTION 'PRECONDITION_FAIL: max sort_order=% expected 79', v_max_sort;
  END IF;

  SELECT max(updated_at) INTO v_max_upd
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano' AND published = true;

  IF v_max_upd IS DISTINCT FROM TIMESTAMPTZ '2026-07-21 15:02:48.475629+00' THEN
    RAISE EXCEPTION 'PRECONDITION_FAIL: published max(updated_at)=% expected 2026-07-21 15:02:48.475629+00 — existing rows changed; do not INSERT', v_max_upd;
  END IF;

  SELECT count(*), min(id::text)::uuid, min(title), min(date), bool_or(published)
  INTO v_001_n, v_001_id, v_001_title, v_001_date, v_001_pub
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano'
    AND legacy_id = 'schedule-2026-09-001';

  IF v_001_n IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'PRECONDITION_FAIL: schedule-2026-09-001 count=% expected 1', v_001_n;
  END IF;

  IF v_001_id IS DISTINCT FROM '18b48259-9a9a-4b00-b136-6c0c4ff3b2f3'::uuid THEN
    RAISE EXCEPTION 'PRECONDITION_FAIL: schedule-2026-09-001 id=% expected 18b48259-9a9a-4b00-b136-6c0c4ff3b2f3 — wrong project or row', v_001_id;
  END IF;

  IF v_001_pub IS NOT DISTINCT FROM true THEN
    RAISE EXCEPTION 'PRECONDITION_FAIL: schedule-2026-09-001 is published — refuse (do not reuse test row)';
  END IF;

  IF v_001_title IS DISTINCT FROM $d$【G-22eテスト】新規追加テストイベント$d$ THEN
    RAISE EXCEPTION 'PRECONDITION_FAIL: schedule-2026-09-001 title changed (%)', v_001_title;
  END IF;

  IF v_001_date IS DISTINCT FROM DATE '2026-09-12' THEN
    RAISE EXCEPTION 'PRECONDITION_FAIL: schedule-2026-09-001 date=% expected 2026-09-12', v_001_date;
  END IF;

  SELECT count(*) INTO v_target_exist
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

  IF v_target_exist IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'PRECONDITION_FAIL: % of 002-018 already exist — refuse duplicate INSERT', v_target_exist;
  END IF;

  SELECT count(*) INTO v_any_sept_pub
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano'
    AND published = true
    AND (
      month = '2026-09'
      OR (date >= DATE '2026-09-01' AND date <= DATE '2026-09-30')
    );

  IF v_any_sept_pub IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'PRECONDITION_FAIL: published September count=% expected 0', v_any_sept_pub;
  END IF;

  INSERT INTO public.schedules (
    legacy_id, site_slug, date, date_status, year, month, title, venue,
    open_time, start_time, price, description, published,
    show_on_home, home_order, sort_order, source_file, source_route, image_url
  ) VALUES
  (
    $d$schedule-2026-09-002$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-01$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<Duo>$d$,
    $d$広尾 barおくむら$d$,
    NULL,
    $d$19:30$d$,
    $d$2,000円$d$,
    $d$出演：出口優日vo 後藤沙紀pf
イベントwebsite：https://hiro-o-kumura.com/section/bar/$d$,
    true,
    false,
    NULL,
    80,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-003$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-04$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<Duo>$d$,
    $d$高田馬場 Gate One$d$,
    $d$18:30$d$,
    $d$19:00$d$,
    $d$3,000円$d$,
    $d$出演：長谷川薫vo 後藤沙紀pf
イベントwebsite：https://jazzgateone.com/schedule.html$d$,
    true,
    false,
    NULL,
    81,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-004$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-05$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<Jive at FIVE>$d$,
    $d$我孫子 我孫子市民プラザ 多目的ホール$d$,
    $d$13:40$d$,
    $d$14:00$d$,
    $d$前売りチケット 1,200円$d$,
    $d$出演：『Jive at FIVE』
出口優日vo 上野まことsax 矢野伸行b たきざわあつきds 後藤沙紀pf
会場website: https://www.s-seiun.co.jp/shisetsu/abiko/$d$,
    true,
    false,
    NULL,
    82,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-005$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-06$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<Good Swing Jazz Band & Orchestra>$d$,
    $d$センター南 都筑公会堂$d$,
    $d$14:00$d$,
    $d$14:30$d$,
    $d$一般 5,000円 / 小中高生 1,000円 /つづきジャズ音楽友の会会員 4,000円$d$,
    $d$(当日料金はそれぞれプラス1,000円up)
出演：『Good Swing Jazz Band & Orchestra』
宮崎佳彦cl 河原真彩tp 小野優佳tp 西村健司tb 上野まことsax 後藤沙紀pf 加治雄太gt 新井健太郎b 川島佑介ds
会場website: https://tsuzuki-kokaido.jp/$d$,
    true,
    false,
    NULL,
    83,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-006$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-07$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<ごさきりかこTrio>$d$,
    $d$池袋 Apple Jump$d$,
    $d$19:00$d$,
    $d$19:30$d$,
    $d$3,500円$d$,
    $d$出演：『ごさきりかこTrio』
後藤沙紀pf 鈴木梨花子ds 寺尾陽介b
会場website: https://applejump.net/$d$,
    true,
    false,
    NULL,
    84,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-007$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-08$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<Trio PEPINO>$d$,
    $d$馬車道 Ben Tenuto$d$,
    $d$19:00$d$,
    $d$19:30$d$,
    NULL,
    $d$出演：『Trio PEPINO』
鳴海望美vo 後藤沙紀pf 鈴木梨花子perc
会場website: https://www.bentenuto-music-bar.com/$d$,
    true,
    false,
    NULL,
    85,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-008$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-11$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<Set Sail>$d$,
    $d$池袋 Independence$d$,
    $d$19:00$d$,
    $d$19:30$d$,
    $d$3,000円$d$,
    $d$出演：『set sail』天野丘gt 後藤沙紀pf
会場website: http://jazz-independence.com/$d$,
    true,
    false,
    NULL,
    86,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-009$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-12$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<宮崎幸子trio>$d$,
    $d$吉祥寺 Strings$d$,
    $d$12:00$d$,
    $d$13:00$d$,
    $d$3,500円$d$,
    $d$出演：宮崎幸子vo 後藤沙紀pf 寺尾陽介b
会場website: https://www.jazz-strings.com/$d$,
    true,
    false,
    NULL,
    87,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-010$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-16$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<Duo>$d$,
    $d$新宿 PolkaDots$d$,
    $d$18:30$d$,
    $d$19:30$d$,
    $d$チップ制$d$,
    $d$出演：宮崎佳彦cl,sax 河原真彩tp 後藤沙紀pf
会場website: https://www.jazz-polkadots.com/$d$,
    true,
    false,
    NULL,
    88,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-011$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-19$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<新谷健介オノマトペ>$d$,
    $d$浅草 HUB$d$,
    $d$18:00$d$,
    $d$19:00$d$,
    $d$2,200円$d$,
    $d$出演：『新谷健介オノマトペ』新谷健介cl 後藤沙紀pf 吹谷禎一郎b 田中涼ds
会場website: https://www.pub-hub.com/index.php/shop/detail/6$d$,
    true,
    false,
    NULL,
    89,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-012$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-23$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<宮益屋本店>$d$,
    $d$浅草 HUB$d$,
    $d$17:00$d$,
    $d$18:00$d$,
    $d$2,750円$d$,
    $d$出演：『宮益屋本店』益田英生cl 宮脇惇cl 後藤沙紀pf 入船裕次b たきざわあつきds
会場website: https://www.pub-hub.com/index.php/shop/detail/6$d$,
    true,
    false,
    NULL,
    90,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-013$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-24$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<Duo>$d$,
    $d$横須賀 ケント倶楽部$d$,
    $d$18:00$d$,
    $d$20:00$d$,
    $d$2,000円$d$,
    $d$出演：宮脇惇cl 後藤沙紀pf
会場website: https://tabelog.com/kanagawa/A1406/A140601/14064107/$d$,
    true,
    false,
    NULL,
    91,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-014$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-25$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<Golden PODs>$d$,
    $d$桜木町 Dolphy$d$,
    $d$18:30$d$,
    $d$19:30$d$,
    $d$予約 4,000円 / 当日 4,500円$d$,
    $d$出演：坂本愛江vo 工藤精b 後藤沙紀pf 田中涼ds
会場website: https://dolphy-jazzspot.com/$d$,
    true,
    false,
    NULL,
    92,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-015$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-26$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<丸山朝光ニューアルバム"Sing Trads!"発売記念ライブ>$d$,
    $d$用賀 キンのツボ$d$,
    $d$18:00$d$,
    $d$19:00$d$,
    $d$3,300円$d$,
    $d$出演：丸山朝光bjo,vo 後藤沙紀pf 寺尾陽介b
会場website: https://kinnotsubo.com/$d$,
    true,
    false,
    NULL,
    93,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-016$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-27$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<YOKOHAMA SWINGIN REVIEW>$d$,
    $d$関内 グレースバリ横浜関内 3F アロナ$d$,
    $d$12:00$d$,
    NULL,
    $d$予約 4,500円 / 当日 4,800円 / 中学生以下入場無料$d$,
    $d$出演：『Sari with Special Band』『MAIKO』『横浜スイングダンスコミュニティ』
紗理vo 後藤沙紀pf 新井健太郎b 利光玲奈ds,vo 浅葉裕文gt
イベントwebsite：https://www.arcyswingdancestudio.com/yokohamaswinginreview
会場website: https://www.grace-bali.com/shop/yokohama_kannai/enkai/$d$,
    true,
    false,
    NULL,
    94,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-017$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-28$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<3 clarinet>$d$,
    $d$銀座 Swing$d$,
    $d$18:00$d$,
    $d$19:00$d$,
    $d$4,500円 + 2drinks & 1 order$d$,
    $d$出演：熊倉未佐子cl 宮崎佳彦cl 宮脇惇cl 後藤沙紀pf 遠藤定b
会場website: https://ginzaswing.jp/$d$,
    true,
    false,
    NULL,
    95,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  ),
  (
    $d$schedule-2026-09-018$d$,
    $d$gosaki-piano$d$,
    $d$2026-09-30$d$::date,
    $d$confirmed$d$,
    2026,
    $d$2026-09$d$,
    $d$<Duo>$d$,
    $d$自由が丘 Dana Point$d$,
    $d$18:00$d$,
    $d$19:00$d$,
    $d$チップ制$d$,
    $d$出演：出口優日vo 後藤沙紀pf
会場website: https://danapoint-grill.com/$d$,
    true,
    false,
    NULL,
    96,
    $d$schedule-2026-09.html$d$,
    $d$/schedule/2026-09/$d$,
    NULL
  );

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted IS DISTINCT FROM 17 THEN
    RAISE EXCEPTION 'POST_WRITE_FAIL: inserted % expected 17 — rolling back', v_inserted;
  END IF;

  SELECT count(*) INTO v_after_published
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano' AND published = true;

  IF v_after_published IS DISTINCT FROM 91 THEN
    RAISE EXCEPTION 'POST_WRITE_FAIL: published gosaki total=% expected 91', v_after_published;
  END IF;

  SELECT count(*) INTO v_after_pre_sept
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano'
    AND published = true
    AND date < DATE '2026-09-01';

  IF v_after_pre_sept IS DISTINCT FROM 74 THEN
    RAISE EXCEPTION 'POST_WRITE_FAIL: published pre-September=% expected 74', v_after_pre_sept;
  END IF;

  SELECT count(*) INTO v_after_sept
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano'
    AND published = true
    AND month = '2026-09';

  IF v_after_sept IS DISTINCT FROM 17 THEN
    RAISE EXCEPTION 'POST_WRITE_FAIL: published September=% expected 17', v_after_sept;
  END IF;

  SELECT count(*) INTO v_after_ids
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano'
    AND published = true
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

  IF v_after_ids IS DISTINCT FROM 17 THEN
    RAISE EXCEPTION 'POST_WRITE_FAIL: published 002-018 count=% expected 17', v_after_ids;
  END IF;

  SELECT count(*) INTO v_after_sort
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano'
    AND published = true
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
    )
    AND sort_order BETWEEN 80 AND 96;

  IF v_after_sort IS DISTINCT FROM 17 THEN
    RAISE EXCEPTION 'POST_WRITE_FAIL: sort_order 80-96 count=% expected 17', v_after_sort;
  END IF;

  SELECT count(*) INTO v_dup
  FROM (
    SELECT legacy_id
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
    )
    GROUP BY legacy_id
    HAVING count(*) <> 1
  ) d;

  IF v_dup IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'POST_WRITE_FAIL: duplicate legacy_id among 002-018';
  END IF;

  SELECT published, title
  INTO v_001_after_pub, v_001_after_title
  FROM public.schedules
  WHERE id = '18b48259-9a9a-4b00-b136-6c0c4ff3b2f3'::uuid
    AND site_slug = 'gosaki-piano'
    AND legacy_id = 'schedule-2026-09-001';

  IF v_001_after_pub IS NOT DISTINCT FROM true
     OR v_001_after_title IS DISTINCT FROM $d$【G-22eテスト】新規追加テストイベント$d$ THEN
    RAISE EXCEPTION 'POST_WRITE_FAIL: schedule-2026-09-001 mutated';
  END IF;

  SELECT max(updated_at) INTO v_existing_upd
  FROM public.schedules
  WHERE site_slug = 'gosaki-piano'
    AND published = true
    AND date < DATE '2026-09-01';

  IF v_existing_upd IS DISTINCT FROM TIMESTAMPTZ '2026-07-21 15:02:48.475629+00' THEN
    RAISE EXCEPTION 'POST_WRITE_FAIL: existing published rows updated_at changed (%)', v_existing_upd;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.schedules
    WHERE site_slug = 'gosaki-piano'
      AND legacy_id = 'schedule-2026-09-001'
      AND published = true
  ) THEN
    RAISE EXCEPTION 'POST_WRITE_FAIL: 001 published';
  END IF;
END
$packet$;

-- Visible verification grid (run as part of the same paste after DO succeeds).
-- Expected: one row, all *_ok true, published_september=17, published_total=91.
SELECT
  (SELECT count(*) FROM public.schedules
     WHERE site_slug = 'gosaki-piano' AND published = true) AS published_total,
  (SELECT count(*) FROM public.schedules
     WHERE site_slug = 'gosaki-piano' AND published = true AND month = '2026-09') AS published_september,
  (SELECT count(*) FROM public.schedules
     WHERE site_slug = 'gosaki-piano' AND published = true AND date < DATE '2026-09-01') AS published_pre_september,
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
     )) AS ids_002_018,
  (SELECT count(*) FROM public.schedules
     WHERE site_slug = 'gosaki-piano'
       AND legacy_id = 'schedule-2026-09-001' AND published = false
       AND id = '18b48259-9a9a-4b00-b136-6c0c4ff3b2f3') AS test_001_unpublished,
  (SELECT count(*) FROM public.schedules
     WHERE site_slug = 'gosaki-piano' AND published = true
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
       )
       AND sort_order BETWEEN 80 AND 96) AS sort_80_96,
  (SELECT max(updated_at) FROM public.schedules
     WHERE site_slug = 'gosaki-piano' AND published = true AND date < DATE '2026-09-01') AS existing74_max_updated_at,
  (
    (SELECT count(*) FROM public.schedules WHERE site_slug = 'gosaki-piano' AND published = true) = 91
    AND (SELECT count(*) FROM public.schedules WHERE site_slug = 'gosaki-piano' AND published = true AND month = '2026-09') = 17
    AND (SELECT count(*) FROM public.schedules WHERE site_slug = 'gosaki-piano' AND published = true AND date < DATE '2026-09-01') = 74
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
    )) = 17
    AND (SELECT count(*) FROM public.schedules
          WHERE site_slug = 'gosaki-piano'
            AND legacy_id = 'schedule-2026-09-001' AND published = false
            AND id = '18b48259-9a9a-4b00-b136-6c0c4ff3b2f3') = 1
    AND (SELECT max(updated_at) FROM public.schedules
          WHERE site_slug = 'gosaki-piano' AND published = true AND date < DATE '2026-09-01')
        = TIMESTAMPTZ '2026-07-21 15:02:48.475629+00'
  ) AS all_ok;
