-- G-20r3 Gosaki schedule August 2026 batch INSERT preflight SQL DRAFT
-- Status: NOT EXECUTED — preflight / operator execution (G-20r3a) only
-- Project: static-to-astro-cms-staging / kmjqppxjdnwwrtaeqjta ONLY
-- NEVER run on vsbvndwuajjhnzpohghh (Sariswing production)
-- approvalId: G-20r3-gosaki-schedule-august-batch-insert-non-dry-run-slice
-- Rows: 17 INSERT · hold #8 #18 excluded · sort_order bump prerequisite: Step 0

-- ========== STEP 0 (OPTION A — recommended): shift existing sort_order +19 ==========
-- UPDATE public.schedules
-- SET sort_order = sort_order + 19
-- WHERE site_slug = 'gosaki-piano';
-- Expected: 60 rows updated · verify count before COMMIT


-- schedule-2026-08-001 · order 1 · published=true
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-001',
  'gosaki-piano',
  '2026-08-01',
  2026,
  '2026-08',
  '<地ビールフェスト2026>',
  '甲府駅北口(アシストエンジニアリングよっちゃばれ広場)',
  NULL,
  NULL,
  NULL,
  '出演：『KHACHA BAND』
会場website: https://sannichiybs.info/beer/',
  true,
  false,
  NULL,
  1,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-002 · order 2 · published=true
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-002',
  'gosaki-piano',
  '2026-08-02',
  2026,
  '2026-08',
  '<地ビールフェスト2026>',
  '甲府駅北口(アシストエンジニアリングよっちゃばれ広場)',
  NULL,
  NULL,
  NULL,
  '出演：『KHACHA BAND』
会場website: https://sannichiybs.info/beer/',
  true,
  false,
  NULL,
  2,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-003 · order 3 · published=true
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-003',
  'gosaki-piano',
  '2026-08-06',
  2026,
  '2026-08',
  '<紀々音>',
  '銀座　The DEEP',
  '19:00',
  '19:30',
  '3,300円 + TC 550円',
  '出演：『紀々音』田村麻紀子cl,vo 後藤沙紀pf
会場website: https://jazz-thedeep.com/',
  true,
  false,
  NULL,
  3,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-004 · order 4 · published=true
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-004',
  'gosaki-piano',
  '2026-08-07',
  2026,
  '2026-08',
  '<Awesome Songbook 2ndEP"Ep.2"発売!Tour>',
  '熊谷 Jazz&Cafe SPACE1497',
  '18:30',
  '19:30',
  '3,500円',
  '出演：『Awesome Songbook』木村美保vo 丸山朝光vo,bjo 後藤沙紀pf
会場website: https://space1497.amebaownd.com/',
  true,
  false,
  NULL,
  4,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-005 · order 5 · published=true
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-005',
  'gosaki-piano',
  '2026-08-08',
  2026,
  '2026-08',
  '<Awesome Songbook 2ndEP"Ep.2"発売!Tour>',
  '宇都宮　リムジン',
  '19:00',
  '20:00',
  '4,000円(おつまみ、お通し付)',
  '出演：『Awesome Songbook』木村美保vo 丸山朝光vo,bjo 後藤沙紀pf
会場website: https://www.limous.jp/index.html',
  true,
  false,
  NULL,
  5,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-006 · order 6 · published=true
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-006',
  'gosaki-piano',
  '2026-08-09',
  2026,
  '2026-08',
  '<Awesome Songbook 2ndEP"Ep.2"発売!Tour>',
  '筑西　Jazz Live Spot village',
  '19:00',
  '19:30',
  '3,000円(1drink付)',
  '出演：『Awesome Songbook』木村美保vo 丸山朝光vo,bjo 後藤沙紀pf
会場website: http://www.jazz1126.com/',
  true,
  false,
  NULL,
  6,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-007 · order 7 · published=false
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-007',
  'gosaki-piano',
  '2026-08-10',
  2026,
  '2026-08',
  '<Duo>',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  false,
  NULL,
  7,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-009 · order 9 · published=false
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-009',
  'gosaki-piano',
  '2026-08-15',
  2026,
  '2026-08',
  '<Duo>',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  false,
  NULL,
  9,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-010 · order 10 · published=true
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-010',
  'gosaki-piano',
  '2026-08-16',
  2026,
  '2026-08',
  '<Quartet>',
  '蕨　Our Delight',
  '13:00',
  '13:30',
  '4,500円',
  '出演：谷口英治cl 杉内浩介gt 後藤沙紀pf 本川悠平b
会場website: https://ourdelight.blog.jp/',
  true,
  false,
  NULL,
  10,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-011 · order 11 · published=true
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-011',
  'gosaki-piano',
  '2026-08-16',
  2026,
  '2026-08',
  '<新谷健介オノマトペ>',
  '用賀　キンのツボ',
  '18:00',
  '19:00',
  NULL,
  '出演：『新谷健介オノマトペ』新谷健介cl 後藤沙紀pf 吹谷禎一郎b 田中涼ds
会場website: https://kinnotsubo.com/',
  true,
  false,
  NULL,
  11,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-012 · order 12 · published=true
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-012',
  'gosaki-piano',
  '2026-08-20',
  2026,
  '2026-08',
  '<Brazilian Jazz Trio>',
  '草加　Sugar Hill',
  '18:30',
  '19:30',
  '3,500円',
  '✳︎Leader Live✳︎
出演：後藤沙紀pf 石川周之介sax,fl 見谷聡一perc
会場website: https://sugarhill.jp/',
  true,
  false,
  NULL,
  12,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-013 · order 13 · published=false
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-013',
  'gosaki-piano',
  '2026-08-21',
  2026,
  '2026-08',
  '<原田茅子Quartet>',
  '松戸　コルコバード',
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  false,
  NULL,
  13,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-014 · order 14 · published=true
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-014',
  'gosaki-piano',
  '2026-08-23',
  2026,
  '2026-08',
  '<子どもと一緒にジャズライブ>',
  '岡山　tonica',
  '12:30',
  '13:00',
  '大人3,000円 / 未就学児 500円 / こども(高校生まで) 1,000円 / 大学生 1,500円',
  '✳︎Leader Live✳︎
出演：後藤沙紀pf 鈴木梨花子ds
会場website: https://gosakirikakotrio.wixsite.com/gosakirikakotrio
時間：【第一部】開場 12:30 / 開演 13:00  【第二部】開演 15:30 / 開演 15:00',
  true,
  false,
  NULL,
  14,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-015 · order 15 · published=true
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-015',
  'gosaki-piano',
  '2026-08-24',
  2026,
  '2026-08',
  '<ごさきりかこTrio>',
  '岡山　SOHO',
  '19:00',
  '19:45',
  '予約 4,000円 / 当日 5,000円',
  '✳︎Leader Live✳︎
出演：『ごさきりかこTrio』後藤沙紀pf 鈴木梨花子ds 寺尾陽介b
会場website: https://soho214.blog.fc2.com/',
  true,
  false,
  NULL,
  15,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-016 · order 16 · published=true
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-016',
  'gosaki-piano',
  '2026-08-25',
  2026,
  '2026-08',
  '<ごさきりかこTrio>',
  '名古屋　The Wiz',
  '18:00',
  '19:00',
  '予約 3,800円 / 当日 4,300円',
  '✳︎Leader Live✳︎
出演：『ごさきりかこTrio 』後藤沙紀pf 鈴木梨花子ds 寺尾陽介b
会場website: https://www.wizjazz.jp/',
  true,
  false,
  NULL,
  16,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-017 · order 17 · published=true
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-017',
  'gosaki-piano',
  '2026-08-28',
  2026,
  '2026-08',
  '<カリビアンファンクション>',
  '浅草　HUB',
  '18:00',
  '19:00',
  '2,750円',
  '出演：『カリビアンファンクション 』山田翔一tb 後藤沙紀pf 新井健太郎b 木川保奈美perc
会場website: https://www.pub-hub.com/index.php/shop/detail/6',
  true,
  false,
  NULL,
  17,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- schedule-2026-08-019 · order 19 · published=true
INSERT INTO public.schedules (
  legacy_id, site_slug, date, year, month, title, venue,
  open_time, start_time, price, description, published,
  show_on_home, home_order, sort_order, source_file, source_route, image_url
) VALUES (
  'schedule-2026-08-019',
  'gosaki-piano',
  '2026-08-30',
  2026,
  '2026-08',
  '<KHACHA BAND>',
  '浅草　HUB',
  '17:00',
  '18:00',
  '2,750円',
  '出演：『KHACHA BAND』丸山朝光vo,bjo 河原真彩tp 後藤沙紀pf 菊池芳将b 田中涼ds
会場website: https://www.pub-hub.com/index.php/shop/detail/6',
  true,
  false,
  NULL,
  19,
  'schedule-2026-08.html',
  '/schedule/2026-08/',
  NULL
);

-- ========== ROLLBACK (staging only — run if batch must be undone) ==========
-- DELETE FROM public.schedules
-- WHERE site_slug = 'gosaki-piano'
--   AND legacy_id IN (
--     'schedule-2026-08-001',
--     'schedule-2026-08-002',
--     'schedule-2026-08-003',
--     'schedule-2026-08-004',
--     'schedule-2026-08-005',
--     'schedule-2026-08-006',
--     'schedule-2026-08-007',
--     'schedule-2026-08-009',
--     'schedule-2026-08-010',
--     'schedule-2026-08-011',
--     'schedule-2026-08-012',
--     'schedule-2026-08-013',
--     'schedule-2026-08-014',
--     'schedule-2026-08-015',
--     'schedule-2026-08-016',
--     'schedule-2026-08-017',
--     'schedule-2026-08-019'
--   );
-- UPDATE public.schedules SET sort_order = sort_order - 19
-- WHERE site_slug = 'gosaki-piano' AND sort_order >= 20;
