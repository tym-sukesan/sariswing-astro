-- G-9c0c Gosaki schedule seed SQL template (canonical source_route)
-- TEMPLATE ONLY — DO NOT EXECUTE from Cursor / CI
-- Project: static-to-astro-cms-staging (operator manual SQL Editor only)
-- Generated from fixtures via extractAllGosakiScheduleSeeds — 60 rows
-- site_slug: gosaki-piano
-- source_route: /schedule/YYYY-MM/ (canonical — not legacy /YYYY-MM/)

begin;

-- schedule-2026-03-001 2026-03-01 /schedule/2026-03/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-03-001', 'gosaki-piano', '2026-03-01', 2026, '2026-03', '<ごちまきトリオ>', '銀座 N', '13:30', '14:00', '3,500円', '出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/', null, '2026-03.html', '/schedule/2026-03/', false, null, true, 10);

-- schedule-2026-03-002 2026-03-06 /schedule/2026-03/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-03-002', 'gosaki-piano', '2026-03-06', 2026, '2026-03', '<GG Funky Jazzy>', '用賀 キンのツボ', '18:00', '19:30', '3,850円(税込)', '出演：鍬田修一sax 鷲尾広太gt 後藤沙紀key 石垣陽菜b 関根豊明ds
会場website: https://kinnotsubo.com/', null, '2026-03.html', '/schedule/2026-03/', false, null, true, 20);

-- schedule-2026-03-003 2026-03-08 /schedule/2026-03/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-03-003', 'gosaki-piano', '2026-03-08', 2026, '2026-03', '<Live & Session>', '学芸大学 珈琲美学', '11:30', '12:30', '3,850円(税込)', '出演：【第一部Live】MAREE ARAKY vo,pf 後藤沙紀pianica,pf 【第二部Session】ホスト 後藤沙紀pf
会場website: https://www.coffeebigaku.com/', null, '2026-03.html', '/schedule/2026-03/', false, null, true, 30);

-- schedule-2026-03-004 2026-03-10 /schedule/2026-03/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-03-004', 'gosaki-piano', '2026-03-10', 2026, '2026-03', '<Duo>', '関内 apple', '19:00', '19:40', '5,000円(男性) 4,000円(女性)', '出演：小川恵理紗fl 後藤沙紀pf
会場website: https://ameblo.jp/jazzlivebar-apple/', null, '2026-03.html', '/schedule/2026-03/', false, null, true, 40);

-- schedule-2026-03-005 2026-03-11 /schedule/2026-03/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-03-005', 'gosaki-piano', '2026-03-11', 2026, '2026-03', '<Trio PEPINO>', '馬車道 Ben Tenuto', '19:00', '19:30', 'MC 3,000円 + TC 400円', '出演：『Trio PEPINO』鳴海望美vo 後藤沙紀pf 鈴木梨花子per
会場website: https://www.bentenuto-music-bar.com/', null, '2026-03.html', '/schedule/2026-03/', false, null, true, 50);

-- schedule-2026-03-006 2026-03-14 /schedule/2026-03/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-03-006', 'gosaki-piano', '2026-03-14', 2026, '2026-03', '<Trio>', '銀座 三井ガーデンホテル銀座プレミア 16階ロビー', null, '15:30', '無料', '出演：『Trio PEPINO』鳴海望美vo 後藤沙紀pf 鈴木梨花子per
会場website: https://www.bentenuto-music-bar.com/', null, '2026-03.html', '/schedule/2026-03/', false, null, true, 60);

-- schedule-2026-03-007 2026-03-15 /schedule/2026-03/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-03-007', 'gosaki-piano', '2026-03-15', 2026, '2026-03', '<Duo>', '川崎 ぴあにしも', '15:00', '15:30', '3,000円', '出演：長谷川薫vo 後藤沙紀pf
会場website: http://pubhpp.com/', null, '2026-03.html', '/schedule/2026-03/', false, null, true, 70);

-- schedule-2026-03-008 2026-03-17 /schedule/2026-03/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-03-008', 'gosaki-piano', '2026-03-17', 2026, '2026-03', '<Latin Quintet>', '銀座 Swing', '18:00', '19:00', '¥ 4,000(会員) / ¥ 4,500(会員同伴) / ¥ 5,500(一般)', '出演：山田翔一tb 後藤沙紀pf 新井健太郎b 岩月香央梨per guest:赤木りえfl
会場website: https://ginzaswing.jp/', null, '2026-03.html', '/schedule/2026-03/', false, null, true, 80);

-- schedule-2026-03-009 2026-03-19 /schedule/2026-03/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-03-009', 'gosaki-piano', '2026-03-19', 2026, '2026-03', '<ちょっとよりみちライブ>', '船橋市民文化創造館(きららホール)', '18:00', '18:30', '無料', '出演：『カリビアンファンクション』山田翔一tb 後藤沙紀pf 新井健太郎b 木川保奈美per
会場website: https://www.city.funabashi.lg.jp/shisetsu/bunka/0001/0002/0001/p011078.html', null, '2026-03.html', '/schedule/2026-03/', false, null, true, 90);

-- schedule-2026-03-010 2026-03-21 /schedule/2026-03/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-03-010', 'gosaki-piano', '2026-03-21', 2026, '2026-03', '<新谷健介オノマトペ>', '浅草 HUB', '18:00', '19:00', '2,200円', '出演：『新谷健介オノマトペ』新谷健介cl 後藤沙紀pf 吹谷禎一郎b 田中涼ds
会場website: https://www.pub-hub.com/index.php/shop/detail/6', null, '2026-03.html', '/schedule/2026-03/', false, null, true, 100);

-- schedule-2026-03-011 2026-03-25 /schedule/2026-03/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-03-011', 'gosaki-piano', '2026-03-25', 2026, '2026-03', '<Good Swing Jazz Band>', '浅草 HUB', '18:00', '19:00', '2,750円', '出演：『Good Swing Jazz Band』宮崎佳彦cl 河原真彩tp 加治雄太gt 後藤沙紀pf 新井健太郎b
会場website: https://www.pub-hub.com/index.php/shop/detail/6', null, '2026-03.html', '/schedule/2026-03/', false, null, true, 110);

-- schedule-2026-03-012 2026-03-27 /schedule/2026-03/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-03-012', 'gosaki-piano', '2026-03-27', 2026, '2026-03', '<Golden PODs>', '用賀 キンのツボ', '18:00', '19:30', '4,180円(税込)', '出演：『Golden PODs』坂本愛江vo 工藤精b 後藤沙紀pf 田中涼ds
会場website: https://kinnotsubo.com/', null, '2026-03.html', '/schedule/2026-03/', false, null, true, 120);

-- schedule-2026-03-013 2026-03-31 /schedule/2026-03/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-03-013', 'gosaki-piano', '2026-03-31', 2026, '2026-03', '<宮益屋本店>', '馬車道 Ben Tenuto', '19:00', '19:30', 'MC 3,000円 + TC 500円', '出演：『宮益屋本店』益田英生cl 宮脇惇cl 後藤沙紀pf 入船裕次b たきざわあつきds
会場website: https://www.bentenuto-music-bar.com/', null, '2026-03.html', '/schedule/2026-03/', false, null, true, 130);

-- schedule-2026-04-001 2026-04-02 /schedule/2026-04/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-04-001', 'gosaki-piano', '2026-04-02', 2026, '2026-04', '<Duo>', '池袋 P''s Bar', '19:00', '19:30', '3,000円', '出演：高木悠圭per,vo 後藤沙紀pf
会場website: https://psbar.net/', null, '2026-04.html', '/schedule/2026-04/', false, null, true, 10);

-- schedule-2026-04-002 2026-04-08 /schedule/2026-04/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-04-002', 'gosaki-piano', '2026-04-08', 2026, '2026-04', '<Golden PODs〜春の里帰りツアー〜>', '野毛 Jazz Spot DOLPHY', '18:30', '19:30', '4,000円(予約) / 4,500円(当日)', '出演：『Golden PODs』坂本愛江vo,gt 工藤精b 後藤沙紀pf 田中涼ds
会場website: https://dolphy-jazzspot.com/', null, '2026-04.html', '/schedule/2026-04/', false, null, true, 20);

-- schedule-2026-04-003 2026-04-09 /schedule/2026-04/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-04-003', 'gosaki-piano', '2026-04-09', 2026, '2026-04', '<Golden PODs〜春の里帰りツアー〜>', '岡山 LIVEHOUSE BIRD', '19:30', '20:00', '4,000円', '出演：『Golden PODs』坂本愛江vo,gt 工藤精b 後藤沙紀pf 田中涼ds
会場website: https://livehousebird.com/', null, '2026-04.html', '/schedule/2026-04/', false, null, true, 30);

-- schedule-2026-04-004 2026-04-10 /schedule/2026-04/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-04-004', 'gosaki-piano', '2026-04-10', 2026, '2026-04', '<Golden PODs〜春の里帰りツアー〜>', '高知 ピアノバーSometime', '19:30', '20:00', '4,000円', '出演：『Golden PODs』坂本愛江vo,gt 工藤精b 後藤沙紀pf 田中涼ds
会場website: https://barsometime.com/', null, '2026-04.html', '/schedule/2026-04/', false, null, true, 40);

-- schedule-2026-04-005 2026-04-12 /schedule/2026-04/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-04-005', 'gosaki-piano', '2026-04-12', 2026, '2026-04', '<Trio>', '吉祥寺 Strings', '12:00', '13:00', '3,300円(tax in)', '出演：宮崎幸子vo 後藤沙紀pf 寺尾陽介b
会場website: https://www.jazz-strings.com/', null, '2026-04.html', '/schedule/2026-04/', false, null, true, 50);

-- schedule-2026-04-006 2026-04-22 /schedule/2026-04/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-04-006', 'gosaki-piano', '2026-04-22', 2026, '2026-04', '<Big Easy 3>', '関内 メグスタ', '18:30', '19:30', 'チップ制', '出演：藤瀬友希sax 河原真彩tp 後藤沙紀pf
会場website: http://megusta2288869.web.fc2.com/', null, '2026-04.html', '/schedule/2026-04/', false, null, true, 60);

-- schedule-2026-04-007 2026-04-24 /schedule/2026-04/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-04-007', 'gosaki-piano', '2026-04-24', 2026, '2026-04', '<カリビアンファンクション>', '浅草 HUB', '18:00', '19:00', '2,750円', '出演：『カリビアンファンクション』山田翔一tb 後藤沙紀pf 新井健太郎b 木川保奈美per
会場website: https://www.pub-hub.com/index.php/shop/detail/6', null, '2026-04.html', '/schedule/2026-04/', false, null, true, 70);

-- schedule-2026-04-008 2026-04-26 /schedule/2026-04/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-04-008', 'gosaki-piano', '2026-04-26', 2026, '2026-04', '<Set Sail>', '池袋 インディペンデンス', '18:00', '18:30', '3,000円', '出演：『set sail』天野丘gt 後藤沙紀pf
会場website: http://jazz-independence.com/', null, '2026-04.html', '/schedule/2026-04/', false, null, true, 80);

-- schedule-2026-04-009 2026-04-27 /schedule/2026-04/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-04-009', 'gosaki-piano', '2026-04-27', 2026, '2026-04', '<紀々音>', '銀座 The Deep', '19:00', '19:30', 'MC 3,300円 + TC 550円', '出演：『紀々音』田村麻紀子cl 後藤沙紀pf
会場website: https://jazz-thedeep.com/', null, '2026-04.html', '/schedule/2026-04/', false, null, true, 90);

-- schedule-2026-04-010 2026-04-29 /schedule/2026-04/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-04-010', 'gosaki-piano', '2026-04-29', 2026, '2026-04', 'LEADER LIVE', '草加 Sugar Hill', '16:30', '17:00', '3,500円', '<ブラジリアンTrio>
出演：後藤沙紀pf 石川周之介sax,fl 見谷聡一per
会場website: https://sugarhill.jp/', null, '2026-04.html', '/schedule/2026-04/', false, null, true, 100);

-- schedule-2026-05-001 2026-05-03 /schedule/2026-05/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-05-001', 'gosaki-piano', '2026-05-03', 2026, '2026-05', '<新谷健介オノマトペ>', '用賀 キンのツボ', '18:00', '19:00', '3,300円(tax in)', '出演：『新谷健介オノマトペ』新谷健介cl 後藤沙紀pf 吹谷禎一郎b 田中涼ds
会場website: https://kinnotsubo.com/', null, '2026-05.html', '/schedule/2026-05/', false, null, true, 10);

-- schedule-2026-05-002 2026-05-04 /schedule/2026-05/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-05-002', 'gosaki-piano', '2026-05-04', 2026, '2026-05', '※Sold Out', '草加 Sugar Hill', '17:30', '18:30', '3,500円', '<Roselili>
出演：『Roselili』やまざきさえこvo Nahomi vo 山田夢子vo 後藤沙紀pf
会場website: https://sugarhill.jp/', null, '2026-05.html', '/schedule/2026-05/', false, null, true, 20);

-- schedule-2026-05-003 2026-05-08 /schedule/2026-05/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-05-003', 'gosaki-piano', '2026-05-08', 2026, '2026-05', '<GG JAZZ Vocal Night>', '用賀 キンのツボ', '18:00', '19:30', '3,300円(tax in)', '出演：出口優日vo 後藤沙紀pf 遠藤定b 田中涼ds
会場website: https://kinnotsubo.com/', null, '2026-05.html', '/schedule/2026-05/', false, null, true, 30);

-- schedule-2026-05-004 2026-05-09 /schedule/2026-05/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-05-004', 'gosaki-piano', '2026-05-09', 2026, '2026-05', '<トロ⇄ドラ⇄ピアノ>', '池袋 P''s Bar', '19:00', '19:30', '3,500円', '出演：『トロ⇄ドラ⇄ピアノ』三塚知貴tb 髙木悠圭per,vo 後藤沙紀pf
会場website: https://psbar.net/', null, '2026-05.html', '/schedule/2026-05/', false, null, true, 40);

-- schedule-2026-05-005 2026-05-10 /schedule/2026-05/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-05-005', 'gosaki-piano', '2026-05-10', 2026, '2026-05', '<未優沙>', '北千住 Birdland', '13:00', '13:30', '3,500円', '出演：『未優沙』熊倉未佐子cl 出口優日vo 後藤沙紀pf
会場website: https://www.jazz.co.jp/LiveSpot/birdland-senjyu.html', null, '2026-05.html', '/schedule/2026-05/', false, null, true, 50);

-- schedule-2026-05-006 2026-05-17 /schedule/2026-05/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-05-006', 'gosaki-piano', '2026-05-17', 2026, '2026-05', '<マルス駒ヶ岳蒸溜所祭り2026 オトナのJAZZ LIVE>', '長野 駒ヶ岳蒸留所', null, null, '入場無料', '時間：15:00〜16:00
出演：紗理vo 中村誠一ts 田辺充邦gt 後藤沙紀key 清水昭好b 利光玲奈ds
会場website: https://www.hombo.co.jp/', null, '2026-05.html', '/schedule/2026-05/', false, null, true, 60);

-- schedule-2026-05-007 2026-05-18 /schedule/2026-05/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-05-007', 'gosaki-piano', '2026-05-18', 2026, '2026-05', 'Leader Live', '日吉 WonderWall Yokohama', '18:00', '19:00', '4,950円(tax in)', '<ごさきりかこTrio Feat.石川周之介>
出演：『ごさきりかこTrio』後藤沙紀pf 鈴木梨花子ds 寺尾陽介b guest:石川周之介sax,fl
会場website: https://wonderwall-yokohama.jp/', null, '2026-05.html', '/schedule/2026-05/', false, null, true, 70);

-- schedule-2026-05-008 2026-05-24 /schedule/2026-05/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-05-008', 'gosaki-piano', '2026-05-24', 2026, '2026-05', '<Trio>', '町田 Nica''s', '13:30', '14:00', '3,300円(ご予約200引き)', '出演：谷口英治cl 山田翔一tb 後藤沙紀pf
会場website: https://nicas.pinoko.jp/nicas/', null, '2026-05.html', '/schedule/2026-05/', false, null, true, 80);

-- schedule-2026-05-009 2026-05-26 /schedule/2026-05/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-05-009', 'gosaki-piano', '2026-05-26', 2026, '2026-05', '<Duo>', '銀座 The Deep', '19:00', '19:30', '3,300円 + 550円(テーブルチャージ)', '出演：出口優日vo 後藤沙紀pf
会場website: https://jazz-thedeep.com/', null, '2026-05.html', '/schedule/2026-05/', false, null, true, 90);

-- schedule-2026-05-010 2026-05-27 /schedule/2026-05/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-05-010', 'gosaki-piano', '2026-05-27', 2026, '2026-05', '<Swingin'' Jazz Factory-Dixie Trio->', '新宿 Jazz PolkaDots', '18:30', '19:30', 'チップ制', '出演：『Swingin'' Jazz Factory-Dixie Trio-』宮崎佳彦cl 河原真彩tp 後藤沙紀pf
会場website: https://www.jazz-polkadots.com/', null, '2026-05.html', '/schedule/2026-05/', false, null, true, 100);

-- schedule-2026-05-011 2026-05-28 /schedule/2026-05/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-05-011', 'gosaki-piano', '2026-05-28', 2026, '2026-05', '<紀々音>', '大泉学園 in F', '19:30', '20:00', '3,000円', '出演：『紀々音』田村麻紀子cl,vo 後藤沙紀pf
会場website: https://in-f.live/site/', null, '2026-05.html', '/schedule/2026-05/', false, null, true, 110);

-- schedule-2026-05-012 2026-05-30 /schedule/2026-05/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-05-012', 'gosaki-piano', '2026-05-30', 2026, '2026-05', '<ジャズコーラス ブルー・スカイズ 定期演奏会>', '川崎・溝口 高津市民館大ホール (ノクティ・ホール)', '15:00', '15:30', '無料', '出演：ブルースカイズcho 中村誠一(総監督/t.sax.cl)
後藤沙紀pf 新井健太郎b 利光玲奈ds 紗理(指揮/vo) 白仁 "KOTETSU" 賢哉 (指揮/vo)
バンドwebsite：https://www.blueskies.jp/', null, '2026-05.html', '/schedule/2026-05/', false, null, true, 120);

-- schedule-2026-06-001 2026-06-02 /schedule/2026-06/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-06-001', 'gosaki-piano', '2026-06-02', 2026, '2026-06', '<Trio PEPINO>', '阿佐ヶ谷 スタッカート', '19:00', '19:30', '3,500円', '出演：『Trio PEPINO』鳴海望美vo 後藤沙紀pf 鈴木梨花子per
会場website: https://www.a-staccato.com/', null, '2026-06.html', '/schedule/2026-06/', false, null, true, 10);

-- schedule-2026-06-002 2026-06-03 /schedule/2026-06/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-06-002', 'gosaki-piano', '2026-06-03', 2026, '2026-06', '<Duo>', '川崎 ぴあにしも', '18:00', '19:00', '3,000円', '出演：長谷川薫vo 後藤沙紀pf
会場website: http://pubhpp.com/', null, '2026-06.html', '/schedule/2026-06/', false, null, true, 20);

-- schedule-2026-06-003 2026-06-04 /schedule/2026-06/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-06-003', 'gosaki-piano', '2026-06-04', 2026, '2026-06', '<堤智恵子カルテット>', '銀座 Swing', '18:00', '19:00', '5,000円', '出演：堤智恵子sax 後藤沙紀pf 芹沢薫樹b ジーン重村ds
会場website: https://ginzaswing.jp/', null, '2026-06.html', '/schedule/2026-06/', false, null, true, 30);

-- schedule-2026-06-004 2026-06-07 /schedule/2026-06/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-06-004', 'gosaki-piano', '2026-06-07', 2026, '2026-06', 'Leader Live', '長津田 ハーモナイズポケット', null, null, '大人 2,200円 / 未就学児 500円 / 子ども(高校生まで)800円', '<ごさきりかこの子どもと一緒にジャズライブ>
[第一部]開場 10:30 / 開演 11:00
[第二部]開場 13:00 / 開演 13:30
出演：後藤沙紀(pf)、鈴木梨花子(ds)
会場website: https://tabelog.com/kanagawa/A1401/A140208/14093975/', null, '2026-06.html', '/schedule/2026-06/', false, null, true, 40);

-- schedule-2026-06-005 2026-06-08 /schedule/2026-06/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-06-005', 'gosaki-piano', '2026-06-08', 2026, '2026-06', '<THE SILKROAD Vol.375>', '錦糸町 シルクロードカフェ', '18:45', '19:30', '4,000円', '出演：田村麻紀子cl 坂本貴啓ds 後藤沙紀pf
会場website: https://www.silkroad-cafe.com/', null, '2026-06.html', '/schedule/2026-06/', false, null, true, 50);

-- schedule-2026-06-006 2026-06-10 /schedule/2026-06/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-06-006', 'gosaki-piano', '2026-06-10', 2026, '2026-06', '<ケアレスホーネッツレコ発ライブ>', '浅草 HUB', '18:00', '19:00', '2,750円(tax in)', '出演：『ケアレスホーネッツ』中村好江tp 田村麻紀子cl 後藤沙紀pf 新井健太郎b 三輪朋彦ds
会場website: https://www.pub-hub.com/index.php/shop/detail/6', null, '2026-06.html', '/schedule/2026-06/', false, null, true, 60);

-- schedule-2026-06-007 2026-06-15 /schedule/2026-06/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-06-007', 'gosaki-piano', '2026-06-15', 2026, '2026-06', '<宮益屋本店>', '浅草 HUB', '18:00', '19:00', '2,750円', '出演：『宮益屋本店』益田英生cl 宮脇惇cl 後藤沙紀pf 入船裕次b たきざわあつきds
会場website: https://www.pub-hub.com/index.php/shop/detail/6', null, '2026-06.html', '/schedule/2026-06/', false, null, true, 70);

-- schedule-2026-06-008 2026-06-17 /schedule/2026-06/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-06-008', 'gosaki-piano', '2026-06-17', 2026, '2026-06', 'Leader Live', '桐生 Village', '19:00', '19:30', '一般 3,500円 / 学割 1,700円', '<ごさきりかこTrio>
出演：『ごさきりかこTrio』後藤沙紀pf 鈴木梨花子ds 寺尾陽介b
会場website: https://villagejazz.jp/', null, '2026-06.html', '/schedule/2026-06/', false, null, true, 80);

-- schedule-2026-06-009 2026-06-25 /schedule/2026-06/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-06-009', 'gosaki-piano', '2026-06-25', 2026, '2026-06', '<Duo>', '横須賀 ケント倶楽部', '18:00', '20:00', '2,000円', '出演：宮脇惇cl 後藤沙紀pf
会場website: https://tabelog.com/kanagawa/A1406/A140601/14064107/', null, '2026-06.html', '/schedule/2026-06/', false, null, true, 90);

-- schedule-2026-06-010 2026-06-27 /schedule/2026-06/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-06-010', 'gosaki-piano', '2026-06-27', 2026, '2026-06', '<Jazz>', '吉祥寺 Bar Days', '19:00', '19:30', '予約1,500円 / 当日2,000円', '出演：リョコモンスターtb,vo 山下拓郎cl 三輪朋彦ds 後藤沙紀pf
会場website: https://tabelog.com/tokyo/A1320/A132001/13265018/', null, '2026-06.html', '/schedule/2026-06/', false, null, true, 100);

-- schedule-2026-06-011 2026-06-28 /schedule/2026-06/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-06-011', 'gosaki-piano', '2026-06-28', 2026, '2026-06', '<Duo>', '長津田 ハーモナイズポケット', '12:30', '13:00', '2,500円', '出演：田中充tp 後藤沙紀pf
会場website: https://tabelog.com/kanagawa/A1401/A140208/14093975/', null, '2026-06.html', '/schedule/2026-06/', false, null, true, 110);

-- schedule-2026-07-001 2026-07-03 /schedule/2026-07/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-07-001', 'gosaki-piano', '2026-07-03', 2026, '2026-07', '<Awesome Songbook>', '用賀 キンのツボ', '18:00', '19:30', '3,300円', '出演：『Awesome Songbook』木村美保vo 丸山朝光vo,bjo 後藤沙紀pf
会場website: https://kinnotsubo.com/', null, '2026-07.html', '/schedule/2026-07/', false, null, true, 10);

-- schedule-2026-07-002 2026-07-07 /schedule/2026-07/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-07-002', 'gosaki-piano', '2026-07-07', 2026, '2026-07', '<Duo>', '広尾 Barおくむら', null, null, null, '出演：出口優日vo 後藤沙紀pf', null, '2026-07.html', '/schedule/2026-07/', false, null, true, 20);

-- schedule-2026-07-003 2026-07-09 /schedule/2026-07/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-07-003', 'gosaki-piano', '2026-07-09', 2026, '2026-07', 'Leader LIVE', '赤坂 Jazz Dining B-flat', '18:00', '19:00', '一般 4,950円 /学割 2,200円', '<ごさき＆りかこ W Birthday LIVE>
出演：『ごさきりかこTrio』後藤沙紀pf 鈴木梨花子ds 寺尾陽介b
Special Guest 土屋絢子vo
会場website: https://bflat.yamano-music.co.jp/', null, '2026-07.html', '/schedule/2026-07/', false, null, true, 30);

-- schedule-2026-07-004 2026-07-11 /schedule/2026-07/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-07-004', 'gosaki-piano', '2026-07-11', 2026, '2026-07', '<出口優日カルテット>', '入間市 新しきを知る公園野外ステージ', null, null, '無料', '時間：17:00〜19:00
出演：出口優日vo 後藤沙紀pf 寺尾陽介b 田村陽介ds', null, '2026-07.html', '/schedule/2026-07/', false, null, true, 40);

-- schedule-2026-07-005 2026-07-12 /schedule/2026-07/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-07-005', 'gosaki-piano', '2026-07-12', 2026, '2026-07', '<楽屋30周年記念ライブ 2日目>', '中目黒 楽屋', '14:00', '14:45', '予約 3,300円 / 当日 3,850円 (1バンドのみ鑑賞時)', '出演：『Golden PODs』坂本愛江vo 工藤精b 後藤沙紀pf 田中涼ds
会場website: https://www.rakuya.asia/', null, '2026-07.html', '/schedule/2026-07/', false, null, true, 50);

-- schedule-2026-07-006 2026-07-15 /schedule/2026-07/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-07-006', 'gosaki-piano', '2026-07-15', 2026, '2026-07', '<宮益屋本店>', '馬車道 Ben Tenuto', null, null, null, '出演：『宮益屋本店』益田英生cl 宮脇惇cl 後藤沙紀pf 入船裕次b たきざわあつきds
会場website: https://www.bentenuto-music-bar.com/', null, '2026-07.html', '/schedule/2026-07/', false, null, true, 60);

-- schedule-2026-07-007 2026-07-16 /schedule/2026-07/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-07-007', 'gosaki-piano', '2026-07-16', 2026, '2026-07', '<ケアレスホーネッツ>', '三重 大紀町 HINOKIYA STOVE', '18:30', '19:00', '予約 3,500円 / 当日 3,800円', '出演：『ケアレスホーネッツ』中村好江tp 田村麻紀子cl 後藤沙紀pf 三輪朋彦ds 田野重松b', null, '2026-07.html', '/schedule/2026-07/', false, null, true, 70);

-- schedule-2026-07-008 2026-07-17 /schedule/2026-07/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-07-008', 'gosaki-piano', '2026-07-17', 2026, '2026-07', '<>', null, null, null, null, '出演：', null, '2026-07.html', '/schedule/2026-07/', false, null, true, 80);

-- schedule-2026-07-009 2026-07-18 /schedule/2026-07/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-07-009', 'gosaki-piano', '2026-07-18', 2026, '2026-07', '<>', null, null, null, null, '出演：', null, '2026-07.html', '/schedule/2026-07/', false, null, true, 90);

-- COLLISION WARNING: legacy_id schedule-2026-07-010 conflicts with existing G-6 PoC row (G-6 staging write PoC row id aa440e29-5be8-402e-9190-0d81c48434c0).
-- Resolve before execution: rename PoC legacy_id to schedule-2026-07-010-poc (operator approval).
-- See gosaki-schedule-seed-sql-planning.md §8.
-- schedule-2026-07-010 2026-07-19 /schedule/2026-07/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-07-010', 'gosaki-piano', '2026-07-19', 2026, '2026-07', '<>', null, null, null, null, '出演：', null, '2026-07.html', '/schedule/2026-07/', false, null, true, 100);

-- schedule-2026-07-011 2026-07-20 /schedule/2026-07/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-07-011', 'gosaki-piano', '2026-07-20', 2026, '2026-07', '<ケアレスホーネッツ NEWアルバム発売記念ライブ>', '大阪 ニューサントリー5', '13:15', '14:00', '3,500円(1ドリンク付)', '出演：『ケアレスホーネッツ』中村好江tp 田村麻紀子cl 後藤沙紀pf 三輪朋彦ds 斎藤一郎b
会場website: https://www.newsuntory5.jp/', null, '2026-07.html', '/schedule/2026-07/', false, null, true, 110);

-- schedule-2026-07-012 2026-07-22 /schedule/2026-07/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-07-012', 'gosaki-piano', '2026-07-22', 2026, '2026-07', '<Good Swing Jazz Band>', '浅草 HUB', '18:00', '19:00', '2,750円', '出演：『Good Swing Jazz Band』宮崎佳彦cl 河原真彩tp 加治雄太gt 後藤沙紀pf 新井健太郎b
会場website: https://www.pub-hub.com/index.php/shop/detail/6', null, '2026-07.html', '/schedule/2026-07/', false, null, true, 120);

-- schedule-2026-07-013 2026-07-28 /schedule/2026-07/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-07-013', 'gosaki-piano', '2026-07-28', 2026, '2026-07', '<Beer Street Strutters>', '赤坂 Jazz Dining B-Flat', '18:00', '19:00', '一般 4,400円 / 学生 2,750円', '出演：『Beer Street Strutters』河原真彩tp 田村麻紀子cl 山田翔一tb 丸山朝光bjo 後藤沙紀pf 寺尾陽介b 田中涼ds
会場website: https://bflat.yamano-music.co.jp/', null, '2026-07.html', '/schedule/2026-07/', false, null, true, 130);

-- schedule-2026-07-014 2026-07-30 /schedule/2026-07/
insert into public.schedules (legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order) values ('schedule-2026-07-014', 'gosaki-piano', '2026-07-30', 2026, '2026-07', '<Duo>', '南青山 カナユニ', null, null, null, '時間：18:50〜 (40分×3ステージ)
出演：MAREE ARAKY vo 後藤沙紀pf', null, '2026-07.html', '/schedule/2026-07/', false, null, true, 140);

commit;
