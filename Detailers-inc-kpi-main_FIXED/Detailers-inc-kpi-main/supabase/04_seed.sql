-- =====================================================================
-- Detailers Inc. — 04_seed.sql
-- Every row restored from detailers-compass-rebuilt_260918.backup.
-- Safe to re-run: existing ids are skipped (on conflict do nothing).
-- Run AFTER 01_schema.sql.
-- =====================================================================
begin;

-- services (33 rows)
insert into public.services (id, category, stage, vehicle_type, service_name, price, labour_cost, product_cost, total_cost, profit, sort_order, created_at, updated_at) values
  ('6d32c0e6-be52-4bf2-85a4-4f04df711e8e', 'Vehicle Polishing', 'Stage 1 - Finish', 'Sedan/Hatch', 'Stage 1 Finish (Paint Enhancement) - Sedan/Hatch', '2299', '500', '214.38', '714.38', '1584.62', '10', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('936e1497-b561-4adc-9e47-7f297511f462', 'Vehicle Polishing', 'Stage 1 - Finish', 'Mini SUV/Cross', 'Stage 1 Finish (Paint Enhancement) - Mini SUV/Cross', '2499', '500', '221.28', '721.28', '1777.72', '11', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('c9d64aef-4522-4759-bc0a-7f20f035832e', 'Vehicle Polishing', 'Stage 1 - Finish', 'Large SUV/4x4', 'Stage 1 Finish (Paint Enhancement) - Large SUV/4x4', '2999', '500', '412.08', '912.08', '2086.92', '12', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('f22b29a4-5685-4e8a-b468-a24dbd78bf87', 'Vehicle Polishing', 'Stage 2 - Cut and Polish', 'Sedan/Hatch', 'Stage 2 Cut and Polish (Paint Correction) - Sedan/Hatch', '3299', '500', '318.13', '818.13', '2480.87', '20', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('2e2fe105-c9f1-48ae-9e54-c17cfccdd3f3', 'Vehicle Polishing', 'Stage 2 - Cut and Polish', 'Mini SUV/Cross', 'Stage 2 Cut and Polish (Paint Correction) - Mini SUV/Cross', '3499', '500', '324.63', '824.63', '2674.37', '21', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('8d2f38f6-395f-4643-ade4-29fea0d7ff0a', 'Vehicle Polishing', 'Stage 2 - Cut and Polish', 'Large SUV/4x4', 'Stage 2 Cut and Polish (Paint Correction) - Large SUV/4x4', '4999', '1000', '423.54', '1423.54', '3575.46', '22', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('7e8a7641-4b1f-4ad1-b5ed-83c28294988e', 'Interior Detail', NULL, 'Sedan/Hatch', 'Interior Detail - Sedan/Hatch', '1999', '500', '91.48', '591.48', '1407.52', '30', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('dbf69a92-5ce9-4013-8c44-04b3547df9cf', 'Interior Detail', NULL, 'Mini SUV/Cross', 'Interior Detail - Mini SUV/Cross', '2499', '500', '91.48', '591.48', '1907.52', '31', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('a645a152-a28e-4b78-ad11-bb05ef5ea37f', 'Interior Detail', NULL, 'Large SUV/4x4', 'Interior Detail - Large SUV/4x4', '2999', '500', '91.48', '591.48', '2407.52', '32', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('e251eec2-ac7d-47eb-843b-9546a4366cdf', 'Full Detail', 'Stage 1 Full Detail', 'Sedan/Hatch', 'Stage 1 Full Detail (Interior + Polish) - Sedan/Hatch', '3999', '500', '354.11', '854.11', '3144.89', '40', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('d57e26b1-0540-4005-8952-8f4477510ca6', 'Full Detail', 'Stage 1 Full Detail', 'Mini SUV/Cross', 'Stage 1 Full Detail (Interior + Polish) - Mini SUV/Cross', '4699', '500', '354.11', '854.11', '3844.89', '41', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('dc7f520b-f983-483b-aed1-7f7010f5e9ca', 'Full Detail', 'Stage 1 Full Detail', 'Large SUV/4x4', 'Stage 1 Full Detail (Interior + Polish) - Large SUV/4x4', '5499', '1000', '354.11', '1354.11', '4144.89', '42', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('6e26110c-8f5b-49c9-9f84-5bc1d6b82786', 'Full Detail', 'Stage 2 Full Detail', 'Sedan/Hatch', 'Stage 2 Full Detail (Interior + Cut and Polish) - Sedan/Hatch', '6199', '500', '457.86', '957.86', '5241.14', '50', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('96a71c71-769b-411d-8111-f19f5af442d9', 'Full Detail', 'Stage 2 Full Detail', 'Mini SUV/Cross', 'Stage 2 Full Detail (Interior + Cut and Polish) - Mini SUV/Cross', '6999', '500', '457.86', '957.86', '6042.00', '51', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('dce607a7-8a24-4e81-86f8-6ed045d589e6', 'Full Detail', 'Stage 2 Full Detail', 'Large SUV/4x4', 'Stage 2 Full Detail (Interior + Cut and Polish) - Large SUV/4x4', '7999', '1000', '534.11', '1534.11', '6465.00', '52', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('961a5ae7-50ae-4380-b372-b820247c1ae9', 'Combo Deals', 'Stage 1 Combo', 'Sedan/Hatch', 'Stage 1 Combo - Full Detail + Ceramic Coating (CAR PRO UK/MOTOVANA) - Sedan/Hatch', '6999', '500', '1076.61', '1576.61', '5422.39', '60', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('fb99829e-cdd6-40e3-b191-f220c1782d61', 'Combo Deals', 'Stage 1 Combo', 'Mini SUV/Cross', 'Stage 1 Combo - Full Detail + Ceramic Coating (CAR PRO UK/MOTOVANA) - Mini SUV/Cross', '8499', '500', '1318.11', '1818.11', '6680.89', '61', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('6818e602-5fa0-49c3-a9b9-e87c04f5d045', 'Combo Deals', 'Stage 1 Combo', 'Large SUV/4x4', 'Stage 1 Combo - Full Detail + Ceramic Coating (CAR PRO UK/MOTOVANA) - Large SUV/4x4', '10499', '1000', '1799.11', '2799.11', '7699.89', '62', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('da348100-fbd0-4bc5-a77e-26b69887f295', 'Combo Deals', 'Stage 2 Combo', 'Sedan/Hatch', 'Stage 2 Combo - Full Detail + Cut and Polish + Ceramic Coating - Sedan/Hatch', '9499', '500', '1180.36', '1680.36', '7818.64', '70', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('7732b386-d049-4d6c-a405-1d942d8b7eed', 'Combo Deals', 'Stage 2 Combo', 'Mini SUV/Cross', 'Stage 2 Combo - Full Detail + Cut and Polish + Ceramic Coating - Mini SUV/Cross', '9999', '500', '1421.86', '1921.86', '8077.14', '71', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('cefc6d60-c5af-4731-a41a-e1c2f4b36f44', 'Combo Deals', 'Stage 2 Combo', 'Large SUV/4x4', 'Stage 2 Combo - Full Detail + Cut and Polish + Ceramic Coating - Large SUV/4x4', '12999', '1000', '2082.86', '3082.86', '9916.14', '72', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('75c92b9a-dceb-43a2-a3c1-61fa43831b11', 'Combo Deals', 'Stage 1 Combo (CAR PRO SKIN)', 'Sedan/Hatch', 'Stage 1 Combo - Full Detail + Ceramic Coating (CAR PRO SKIN) - Sedan/Hatch', '6999', '500', '1075.36', '1575.36', '5423.64', '80', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('2b410b3c-8950-47dd-b094-57865cdf7fee', 'Combo Deals', 'Stage 1 Combo (CAR PRO SKIN)', 'Mini SUV/Cross', 'Stage 1 Combo - Full Detail + Ceramic Coating (CAR PRO SKIN) - Mini SUV/Cross', '8499', '500', '1341.19', '1841.19', '6657.81', '81', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('77b67238-02e4-458c-b2db-b187b98dc825', 'Combo Deals', 'Stage 1 Combo (CAR PRO SKIN)', 'Large SUV/4x4', 'Stage 1 Combo - Full Detail + Ceramic Coating (CAR PRO SKIN) - Large SUV/4x4', '10499', '1000', '1872.86', '2872.86', '7626.14', '82', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('cad54b20-09fa-41dd-9a3c-0911d34a4965', 'Ceramic Coating', 'Stage 1', 'Sedan/Hatch', 'Stage 1 Ceramic Coating - Sedan/Hatch', '5999', '500', '936.88', '1436.88', '4562.12', '90', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('fe655dc4-4092-47e4-923e-4ee3d3c607b8', 'Ceramic Coating', 'Stage 1', 'Mini SUV/Cross', 'Stage 1 Ceramic Coating - Mini SUV/Cross', '7499', '500', '1277.71', '1777.71', '5721.29', '91', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('f8f7ccf1-64ef-4f9e-bb37-5579868c35fc', 'Ceramic Coating', 'Stage 1', 'Large SUV/4x4', 'Stage 1 Ceramic Coating - Large SUV/4x4', '8598', '1000', '1659.38', '2659.38', '5938.62', '92', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('2f33ba25-4572-40fd-a797-420b05c55399', 'Ceramic Coating', 'Stage 2', 'Sedan/Hatch', 'Stage 2 Ceramic Coating (with Cut and Polish prep) - Sedan/Hatch', '7298', '500', '1040.63', '1540.63', '5757.37', '100', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('da34070b-a88c-4c0e-bcf6-9e4894a04efb', 'Ceramic Coating', 'Stage 2', 'Mini SUV/Cross', 'Stage 2 Ceramic Coating (with Cut and Polish prep) - Mini SUV/Cross', '8499', '500', '1381.13', '1881.13', '6617.87', '101', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('7965b80e-a258-45fe-934a-0bd8e8ba0ad3', 'Ceramic Coating', 'Stage 2', 'Large SUV/4x4', 'Stage 2 Ceramic Coating (with Cut and Polish prep) - Large SUV/4x4', '10598', '1000', '1763.13', '2763.13', '7834.87', '102', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('33f7783f-f364-4f56-9355-77f67b556896', 'Mobile Wash', NULL, 'Sedan/Hatch', 'Mobile Wash - Monthly Subscription - Sedan/Hatch', '299', '0', '6.33', '6.33', '292.67', '110', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('6c76145f-55d9-4d69-83f1-9ace4714b06f', 'Mobile Wash', NULL, 'Mini SUV/Cross', 'Mobile Wash - Monthly Subscription - Mini SUV/Cross', '349', '0', '6.33', '6.33', '342.67', '111', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00'),
  ('771b1ff9-30f4-48f3-90a8-118da92e2a56', 'Mobile Wash', NULL, 'Large SUV/4x4', 'Mobile Wash - Monthly Subscription - Large SUV/4x4', '399', '0', '6.33', '6.33', '392.67', '112', '2026-08-20 13:36:05.913417+00', '2026-08-20 13:36:05.913417+00')
on conflict (id) do nothing;

-- clients (26 rows)
insert into public.clients (id, name, email, phone, area, notes, created_at, monthly_subscription, client_type, jobs_override) values
  ('94c03b22-a41f-4c85-8f9a-9d275f20b462', 'Ember', NULL, '072 397 1503', 'Villa La Von', NULL, '2026-08-21 10:00:00+00', '1123.50', 'MOBILE', '0'),
  ('33d5a13b-1af2-4fdb-906a-bbda4c322e1e', 'Erin', NULL, '073 321 5940', 'Riverhorse Office Park', NULL, '2026-08-21 07:04:06.28466+00', '100.00', 'MOBILE', '0'),
  ('364bd3eb-a5c5-4d58-8e72-108e18608dd8', 'Faiez', NULL, '082 600 2906', 'Villa La Von', NULL, '2026-08-21 10:00:00+00', '749.00', 'MOBILE', '1'),
  ('52b4fd3c-12ae-4a48-8849-c4b065dfccca', 'Jared', NULL, '076 770 5000', 'Villa La Von', NULL, '2026-08-21 10:00:00+00', '599.00', 'MOBILE', '0'),
  ('4a4660ff-0385-4a17-8a7d-ee13f233b057', 'Jason', NULL, '071 267 6766', 'Cornubia Office Park', NULL, '2026-08-21 06:57:45.780243+00', '249.00', 'MOBILE', '0'),
  ('2f3cd0cf-02c9-4667-8fde-4a18fa24b159', 'Mark Strydom', NULL, '083 274 5272', 'Sports RX', NULL, '2026-09-04 10:00:00+00', '897.00', 'MOBILE', '0'),
  ('5d939d55-aa4e-4918-8ec9-5c73a24c0a12', 'Polly', NULL, '066 047 5697', 'Villa La Von', NULL, '2026-08-21 07:00:48.214093+00', '249.00', 'MOBILE', '0'),
  ('75d008e7-a445-4598-ad16-664ea2d692a9', 'Amil', NULL, '063 775 0076', 'Mount Edgecombe', NULL, '2026-08-21 06:52:33.808342+00', '349.00', 'MOBILE', '0'),
  ('961e4f1d-0435-433b-9f4c-a21ecda3a614', 'Carla', NULL, '082 706 2370', 'Riverhorse Office Park', NULL, '2026-08-21 07:05:13.974012+00', '199.00', 'MOBILE', '0'),
  ('6f18d161-8fcc-48a0-8885-f624fbb49fc6', 'Reniel', NULL, '083 241 3859', 'Bethsida Church', NULL, '2026-08-21 07:26:16.96472+00', '299.00', 'MOBILE', '0'),
  ('38cbd176-e548-43ab-85cb-1fa10ba99a86', 'Chris', NULL, '072 197 8054', 'Riverhorse Office Park', NULL, '2026-08-21 10:00:00+00', '199.00', 'MOBILE', '0'),
  ('7a68d756-17e3-47d4-92e9-b2920368d624', 'Craig', NULL, '083 632 7146', 'Barrington Estate', NULL, '2026-08-21 06:58:26.907299+00', '762.00', 'MOBILE', '0'),
  ('ea9da12b-d442-4211-b57e-2ad96e8d1f54', 'Danielle', NULL, '060 505 4008', 'Cornubia Office Park', 'June 2026 Invoice 

Please note that you have missed one wash for the month of June, however I have subtracted that from the invoice.', '2026-08-21 06:53:43.968932+00', '224.25', 'MOBILE', '0'),
  ('4bd19899-4659-4a39-b49a-eb7741f114db', 'Erick', NULL, '082 448 6815', 'Riverhorse Office Park', NULL, '2026-08-21 07:07:05.472898+00', '224.50', 'MOBILE', '0'),
  ('aed33296-3f2c-4278-a1da-e8eaa1bb0d21', 'Kyleen', NULL, '082 813 0180', 'Riverhorse Office Park', NULL, '2026-08-21 07:03:46.096237+00', '199.00', 'MOBILE', '0'),
  ('9fb23881-525b-4b45-bf6f-dd05e9469e30', 'Lourenzo', NULL, '067 967 5838', 'Cornubia Office Park', NULL, '2026-08-21 06:53:19.55895+00', '299.00', 'MOBILE', '0'),
  ('456feced-d048-441d-a15e-f73789af6646', 'Mark', NULL, '081 797 7979', 'Pinnacle', NULL, '2026-09-04 13:52:21.091475+00', '399.00', 'MOBILE', '0'),
  ('76ce5a0c-4e0b-4688-96bf-ae2f2c145924', 'Pierre', NULL, '076 154 2473', 'Riverhorse Office Park', NULL, '2026-08-21 07:06:27.432076+00', '399.00', 'MOBILE', '0'),
  ('104f9e54-bac9-4051-91a2-d85ca5b950d5', 'Daz', NULL, '082 634 7449', 'Riverhorse Office Park', 'Please note that you have missed one wash for the month of August, however I have subtracted that from the invoice.', '2026-08-21 07:02:26.813333+00', '299.00', 'MOBILE', '0'),
  ('9a3a9791-71af-46fa-92d9-16c89742c270', 'Deon', NULL, '082 531 9925', 'Barrington Estate', NULL, '2026-08-21 07:28:47.810273+00', '390.00', 'DETAIL', '0'),
  ('b5c7c92c-fc79-4232-9ee0-0b3e0884eae3', 'Desiraye', NULL, '084 436 1500', 'Phoenix, Newclay Rd', NULL, '2026-08-21 06:50:49.318491+00', '599.00', 'MOBILE', '0'),
  ('14a619e9-e6f9-4020-848f-4ce408e4bea5', 'Emma', NULL, '078 459 0550', 'Mount Edgecombe Trade Park', NULL, '2026-08-21 07:07:56.412583+00', '349.00', 'MOBILE', '0'),
  ('d4bb64a9-b75a-49b5-9301-fbe7033c198b', 'Lourenzo GTI', NULL, '081 218 2197', 'Mount Edgecombe', NULL, '2026-08-21 07:27:48.532623+00', '299.00', 'MOBILE', '0'),
  ('a0a7e5f4-2c7c-4347-a3bb-1f9c6e2eb8eb', 'Shiven', NULL, '081 579 0524', 'Chartwell Estate Musgrave', NULL, '2026-09-08 10:00:00+00', '1489.50', 'MOBILE', '0'),
  ('040ad0da-bb89-4bf9-a136-7b86d790b953', 'Summit Wholesalers (PTY) LTD', NULL, '082 798 2638', 'Springfield Park', NULL, '2026-08-21 07:25:33.182723+00', '449.00', 'MOBILE', '0'),
  ('319c4979-3728-4916-bb4e-a852d83dbaab', 'Zain', NULL, '082 318 3197', 'Chartwell Estate Musgrave', NULL, '2026-09-09 10:00:00+00', '1050.00', 'DETAIL', '0')
on conflict (id) do nothing;

-- client_month_subscriptions (26 rows)
insert into public.client_month_subscriptions (id, client_id, amount, start_date, end_date, status, notes, created_at, updated_at, payment_status) values
  ('65009c70-e3a8-4799-9fe0-6aa63b30a8a9', 'b5c7c92c-fc79-4232-9ee0-0b3e0884eae3', '599.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 06:50:49.692925+00', '2026-08-21 06:51:11.8493+00', 'UNPAID'),
  ('6541a60e-4bd5-46eb-893e-c426e6a5d7df', 'aed33296-3f2c-4278-a1da-e8eaa1bb0d21', '199.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 07:03:46.400279+00', '2026-08-21 07:03:46.400279+00', 'UNPAID'),
  ('ad74f955-aa9d-46d7-a0cb-c164863884b7', '76ce5a0c-4e0b-4688-96bf-ae2f2c145924', '399.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 07:06:27.679955+00', '2026-08-21 07:06:27.679955+00', 'UNPAID'),
  ('1a52b189-3e92-48ff-8881-ad87838df747', '4a4660ff-0385-4a17-8a7d-ee13f233b057', '249.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 06:57:46.221437+00', '2026-09-04 13:44:26.487766+00', 'PAID'),
  ('a872d9b0-4200-4924-82b7-a9818e81fb1e', 'ea9da12b-d442-4211-b57e-2ad96e8d1f54', '224.25', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 06:53:44.270196+00', '2026-09-04 13:45:00.806706+00', 'PAID'),
  ('ed3cabe5-f73e-4842-b5a4-ee200ca13b6a', '961e4f1d-0435-433b-9f4c-a21ecda3a614', '199.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 07:05:14.243428+00', '2026-09-04 13:46:19.250411+00', 'PAID'),
  ('f168acc5-102e-4c7a-a998-9d3349b07643', '75d008e7-a445-4598-ad16-664ea2d692a9', '349.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 06:52:34.175217+00', '2026-08-28 08:59:17.299616+00', 'PAID'),
  ('dfdc1c6a-ef8d-4bf3-8d54-f0ffd4fa4a3f', '456feced-d048-441d-a15e-f73789af6646', '399.00', '2026-09-04', NULL, 'ACTIVE', NULL, '2026-09-04 13:52:21.452443+00', '2026-09-04 13:52:21.452443+00', 'UNPAID'),
  ('f1c951a4-a7cc-470f-8041-26115cdbc32b', '33d5a13b-1af2-4fdb-906a-bbda4c322e1e', '100.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 07:04:06.657319+00', '2026-09-04 13:54:07.94324+00', 'PAID'),
  ('ada8c875-f130-41af-8f89-57c1a646d9da', '4bd19899-4659-4a39-b49a-eb7741f114db', '224.50', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 07:07:05.756477+00', '2026-08-28 09:44:03.918696+00', 'UNPAID'),
  ('c532ae7a-3242-483c-b429-cc3d54407778', '6f18d161-8fcc-48a0-8885-f624fbb49fc6', '299.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 07:26:17.258521+00', '2026-09-04 13:54:52.630953+00', 'PAID'),
  ('13161cfe-7091-4d73-a97e-3c0c4e64b474', '9fb23881-525b-4b45-bf6f-dd05e9469e30', '299.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 06:53:19.799912+00', '2026-08-28 11:01:57.160598+00', 'UNPAID'),
  ('2be705c5-3558-40e0-a698-15526a3f2095', 'a0a7e5f4-2c7c-4347-a3bb-1f9c6e2eb8eb', '1489.50', '2026-09-08', NULL, 'ACTIVE', NULL, '2026-09-08 14:00:00.558177+00', '2026-09-08 14:00:00.558177+00', 'UNPAID'),
  ('5afdb295-7535-46b9-9e10-e5bcd56e6e82', '104f9e54-bac9-4051-91a2-d85ca5b950d5', '299.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 07:02:27.124376+00', '2026-08-28 13:56:43.389984+00', 'PAID'),
  ('2d0543fe-0703-44df-a39f-8af96d469743', '38cbd176-e548-43ab-85cb-1fa10ba99a86', '199.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 07:03:14.339069+00', '2026-09-09 08:01:10.574533+00', 'UNPAID'),
  ('a5569495-ac23-4a61-87c4-9a77d9f98a30', 'd4bb64a9-b75a-49b5-9301-fbe7033c198b', '299.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 07:27:48.804005+00', '2026-08-28 13:59:47.170029+00', 'PAID'),
  ('287719b8-3449-4616-a5be-598b1dc488cb', '040ad0da-bb89-4bf9-a136-7b86d790b953', '449.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 07:25:33.539136+00', '2026-08-28 14:00:19.539684+00', 'PAID'),
  ('4eac8f7d-7974-4797-a1da-afd8b0a43c80', '14a619e9-e6f9-4020-848f-4ce408e4bea5', '349.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 07:07:56.649413+00', '2026-08-31 09:39:00.644868+00', 'PAID'),
  ('fc5f5b06-7172-4ec4-bd6c-1e58b84d0a70', '7a68d756-17e3-47d4-92e9-b2920368d624', '762.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 06:58:27.206585+00', '2026-08-31 09:39:51.751774+00', 'PAID'),
  ('a1f09088-e4a5-4362-931f-cfa35c0b7530', '5d939d55-aa4e-4918-8ec9-5c73a24c0a12', '249.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 07:00:48.518912+00', '2026-08-31 09:40:34.383599+00', 'PAID'),
  ('02a87c33-00a3-4dee-8cfb-11e57a80e79b', '9a3a9791-71af-46fa-92d9-16c89742c270', '390.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 07:28:48.087348+00', '2026-08-31 09:42:04.189919+00', 'PAID'),
  ('aef1af9c-d8ed-4b10-a195-d76780f3ce21', '94c03b22-a41f-4c85-8f9a-9d275f20b462', '1123.50', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 06:59:44.418607+00', '2026-09-09 08:03:00.157436+00', 'UNPAID'),
  ('446714ff-ac93-45ae-a3a4-5172019ca6fb', '364bd3eb-a5c5-4d58-8e72-108e18608dd8', '749.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 07:00:16.230535+00', '2026-09-09 08:07:34.007847+00', 'UNPAID'),
  ('a7d02b93-b335-4c77-9a56-0dcd693f952d', '52b4fd3c-12ae-4a48-8849-c4b065dfccca', '599.00', '2026-08-21', NULL, 'ACTIVE', NULL, '2026-08-21 06:59:06.417648+00', '2026-09-09 08:08:08.98359+00', 'UNPAID'),
  ('007af5cc-e889-4bd3-b810-f475818d363d', '2f3cd0cf-02c9-4667-8fde-4a18fa24b159', '897.00', '2026-09-04', NULL, 'ACTIVE', NULL, '2026-09-04 13:50:40.098909+00', '2026-09-09 08:10:12.783744+00', 'UNPAID'),
  ('fd2ca21d-1f38-4b58-9e3e-e58cdaa81a3a', '319c4979-3728-4916-bb4e-a852d83dbaab', '1050.00', '2026-09-09', NULL, 'ACTIVE', NULL, '2026-09-09 07:57:00.581762+00', '2026-09-09 08:13:16.68382+00', 'UNPAID')
on conflict (id) do nothing;

-- client_pushes (26 rows)
insert into public.client_pushes (id, client_id, group_type, push_date, period, jobs, amount, payment_status, notes, created_at, updated_at) values
  ('7af8e063-7c23-44b9-8ee9-a2acde7b50d1', '75d008e7-a445-4598-ad16-664ea2d692a9', 'MOBILE', '2026-09-09', '2026-09', '0', '349', 'UNPAID', NULL, '2026-09-09 08:00:30.724693+00', '2026-09-09 08:00:30.724693+00'),
  ('4d4115a8-8fa0-4a1c-976e-38eb33fbc836', '961e4f1d-0435-433b-9f4c-a21ecda3a614', 'MOBILE', '2026-09-09', '2026-09', '0', '199', 'UNPAID', NULL, '2026-09-09 08:00:47.836779+00', '2026-09-09 08:00:47.836779+00'),
  ('2c32edb9-225d-47d3-ab6f-4b815dda52dc', '38cbd176-e548-43ab-85cb-1fa10ba99a86', 'MOBILE', '2026-09-09', '2026-09', '0', '199', 'UNPAID', NULL, '2026-09-09 08:01:18.137905+00', '2026-09-09 08:01:18.137905+00'),
  ('e42614ac-4eaa-4c4e-8b77-277888c4fd1f', '7a68d756-17e3-47d4-92e9-b2920368d624', 'MOBILE', '2026-09-09', '2026-09', '0', '762', 'UNPAID', NULL, '2026-09-09 08:01:27.377276+00', '2026-09-09 08:01:27.377276+00'),
  ('9076ba48-2865-4f16-ad68-a9f0d3ee021f', 'ea9da12b-d442-4211-b57e-2ad96e8d1f54', 'MOBILE', '2026-09-09', '2026-09', '0', '199', 'UNPAID', NULL, '2026-09-09 08:01:39.096244+00', '2026-09-09 08:01:39.096244+00'),
  ('94c439fd-71a2-4ce8-897d-7363ec7e9a27', '104f9e54-bac9-4051-91a2-d85ca5b950d5', 'MOBILE', '2026-09-09', '2026-09', '0', '299', 'UNPAID', NULL, '2026-09-09 08:01:52.047992+00', '2026-09-09 08:01:52.047992+00'),
  ('a55a3057-f234-4312-9b8d-8798331246bd', '9a3a9791-71af-46fa-92d9-16c89742c270', 'DETAIL', '2026-09-09', '2026-09', '0', '390', 'UNPAID', NULL, '2026-09-09 08:02:05.107787+00', '2026-09-09 08:02:05.107787+00'),
  ('4c325571-47d2-434e-8e4a-4a87c4363ccf', 'b5c7c92c-fc79-4232-9ee0-0b3e0884eae3', 'MOBILE', '2026-09-09', '2026-09', '0', '599', 'UNPAID', NULL, '2026-09-09 08:02:23.284762+00', '2026-09-09 08:02:23.284762+00'),
  ('c84f8762-8758-4e9d-b7f8-8ea1a8f95d33', '94c03b22-a41f-4c85-8f9a-9d275f20b462', 'MOBILE', '2026-09-09', '2026-09', '0', '1123.5', 'UNPAID', NULL, '2026-09-09 08:03:09.197327+00', '2026-09-09 08:03:09.197327+00'),
  ('88c09c33-5e91-4521-82e0-f4e90801c0f1', '14a619e9-e6f9-4020-848f-4ce408e4bea5', 'MOBILE', '2026-09-09', '2026-09', '0', '349', 'UNPAID', NULL, '2026-09-09 08:06:31.472344+00', '2026-09-09 08:06:31.472344+00'),
  ('598ccd0e-b88f-4c05-8bd2-b70d3fc5dada', '33d5a13b-1af2-4fdb-906a-bbda4c322e1e', 'MOBILE', '2026-09-09', '2026-09', '0', '199', 'UNPAID', NULL, '2026-09-09 08:07:05.46798+00', '2026-09-09 08:07:05.46798+00'),
  ('7cf94830-f712-4778-a3fc-6637c7425bea', '364bd3eb-a5c5-4d58-8e72-108e18608dd8', 'MOBILE', '2026-09-09', '2026-09', '1', '749', 'UNPAID', NULL, '2026-09-09 08:07:41.08212+00', '2026-09-09 08:07:41.08212+00'),
  ('d882104a-7e2b-40b4-9fa6-f414cdb0cbb5', '52b4fd3c-12ae-4a48-8849-c4b065dfccca', 'MOBILE', '2026-09-09', '2026-09', '0', '599', 'UNPAID', NULL, '2026-09-09 08:08:14.393522+00', '2026-09-09 08:08:14.393522+00'),
  ('c5928256-a16a-4bf6-8f38-de8c1dfc0505', '4a4660ff-0385-4a17-8a7d-ee13f233b057', 'MOBILE', '2026-09-09', '2026-09', '0', '249', 'UNPAID', NULL, '2026-09-09 08:08:21.787487+00', '2026-09-09 08:08:21.787487+00'),
  ('5349002d-ef4d-41f6-beb7-05b8e6384345', '2f3cd0cf-02c9-4667-8fde-4a18fa24b159', 'MOBILE', '2026-09-09', '2026-09', '0', '897', 'UNPAID', NULL, '2026-09-09 08:10:20.226931+00', '2026-09-09 08:10:20.226931+00'),
  ('36759f7d-58ed-4fa6-b84d-9e709fc7708c', '5d939d55-aa4e-4918-8ec9-5c73a24c0a12', 'MOBILE', '2026-09-09', '2026-09', '0', '249', 'UNPAID', NULL, '2026-09-09 08:10:40.750904+00', '2026-09-09 08:10:40.750904+00'),
  ('b58d9778-110c-4a10-8cb8-4a3bcf723ea6', '6f18d161-8fcc-48a0-8885-f624fbb49fc6', 'MOBILE', '2026-09-09', '2026-09', '0', '299', 'UNPAID', NULL, '2026-09-09 08:10:47.896908+00', '2026-09-09 08:10:47.896908+00'),
  ('b9e793d4-e434-44c5-92df-b9760b7e45b2', '4bd19899-4659-4a39-b49a-eb7741f114db', 'MOBILE', '2026-09-09', '2026-09', '0', '299', 'UNPAID', NULL, '2026-09-09 08:06:52.18448+00', '2026-09-09 08:16:53.195005+00'),
  ('0cdea686-b25d-401b-8aee-29efe102ca2d', 'aed33296-3f2c-4278-a1da-e8eaa1bb0d21', 'MOBILE', '2026-09-09', '2026-09', '0', '199', 'UNPAID', NULL, '2026-09-09 08:08:27.444934+00', '2026-09-09 08:17:02.21712+00'),
  ('ff11a233-5262-43f0-93c3-f3e238d2fdcc', '9fb23881-525b-4b45-bf6f-dd05e9469e30', 'MOBILE', '2026-09-09', '2026-09', '0', '299', 'UNPAID', NULL, '2026-09-09 08:08:33.490001+00', '2026-09-09 08:17:03.468729+00'),
  ('0c5628e0-99c2-40de-a8a9-9f1dddb0ce5e', 'd4bb64a9-b75a-49b5-9301-fbe7033c198b', 'MOBILE', '2026-09-09', '2026-09', '0', '299', 'UNPAID', NULL, '2026-09-09 08:08:40.476983+00', '2026-09-09 08:17:05.458409+00'),
  ('871bc1f7-32d5-4c38-bf9b-93b126639900', '456feced-d048-441d-a15e-f73789af6646', 'MOBILE', '2026-09-09', '2026-09', '0', '399', 'UNPAID', NULL, '2026-09-09 08:09:21.961889+00', '2026-09-09 08:17:06.903869+00'),
  ('43e0f1f0-9316-4777-b0ab-9ce4fb9d2d11', '76ce5a0c-4e0b-4688-96bf-ae2f2c145924', 'MOBILE', '2026-09-09', '2026-09', '0', '399', 'UNPAID', NULL, '2026-09-09 08:10:33.812942+00', '2026-09-09 08:17:09.480952+00'),
  ('c3bebbbb-9b3e-44ef-8a1a-4dca153c51bd', 'a0a7e5f4-2c7c-4347-a3bb-1f9c6e2eb8eb', 'MOBILE', '2026-09-09', '2026-09', '0', '1489.5', 'UNPAID', NULL, '2026-09-09 08:11:24.920457+00', '2026-09-09 08:17:11.842648+00'),
  ('026b0d07-e307-4362-b976-e4cdcd7656ce', '040ad0da-bb89-4bf9-a136-7b86d790b953', 'MOBILE', '2026-09-09', '2026-09', '0', '449', 'UNPAID', NULL, '2026-09-09 08:11:32.560692+00', '2026-09-09 08:17:17.767347+00'),
  ('b3d3b207-cada-423f-9e9d-463ac639a194', '319c4979-3728-4916-bb4e-a852d83dbaab', 'DETAIL', '2026-09-09', '2026-09', '0', '1050', 'PAID', NULL, '2026-09-09 07:57:44.938064+00', '2026-09-09 08:17:20.251006+00')
on conflict (id) do nothing;

-- quotes (11 rows)
insert into public.quotes (id, quote_number, client_id, client_name, service, vehicle_type, site, quote_date, valid_until, subtotal, vat_enabled, vat_amount, amount, status, notes, created_at, updated_at, outcome) values
  ('cd062f36-07e1-4e35-adfd-20f2c5a58b59', 'QTE-2026-0002', NULL, 'Shahan', 'Mobile Wash', 'Large SUV/4x4', 'Zimbali Estate', '2026-08-19', '2026-08-26', '1166.3', false, '0', '1166.3', 'DRAFT', NULL, '2026-08-19 09:29:11.565067+00', '2026-09-18 10:55:04.284874+00', 'FAILED'),
  ('a7826018-674b-483c-8783-0a658b21b16a', 'QTE-2026-0003', NULL, 'Diresh', 'Stage 1 Ceramic Coating - Large SUV/4x4', 'Large SUV/4x4', 'Mount Edgecombe', '2026-08-30', '2026-09-30', '8598', false, '0', '8598', 'DRAFT', '3-year CarPro ceramic protection for your vehicle''s exterior paint, rims, and leather interior, delivering exceptional gloss, superior hydrophobic protection, durability, and effortless maintenance.', '2026-08-30 10:21:19.915673+00', '2026-09-18 10:55:09.151621+00', 'FAILED'),
  ('279113d0-77a2-4e05-902c-d8eb6baf8278', 'QTE-2026-0006', NULL, 'Shiven', '249', 'Large SUV/4x4', 'Chartwell Estaste Musgrave', '2026-09-10', '2026-09-17', '996', false, '0', '996', 'DRAFT', NULL, '2026-09-10 10:34:48.408476+00', '2026-09-18 10:55:16.353059+00', 'SUCCESS'),
  ('5f612ef1-d934-4cff-b8ec-cd0b08e28aa2', 'QTE-2026-0008', NULL, 'Jedidiah', 'Interior Detail - Sedan/Hatch', 'Sedan/Hatch', 'Unit 9- Rydalvale, Phoenix', '2026-09-14', '2026-09-21', '1999', false, '0', '1999', 'DRAFT', NULL, '2026-09-14 07:07:46.648354+00', '2026-09-18 10:59:30.296069+00', 'SUCCESS'),
  ('72c9f09e-bef8-4689-a492-b35508065974', 'QTE-2026-0009', NULL, 'Mckayla', 'Mobile Wash', 'Sedan/Hatch', '14 Ireland Street, Verulam', '2026-09-15', '2026-09-22', '370.28', false, '0', '370.28', 'DRAFT', NULL, '2026-09-15 08:40:13.409656+00', '2026-09-18 10:59:35.074303+00', 'SUCCESS'),
  ('d3bf1156-5706-4a45-abe5-1b5b6bd13086', 'QTE-2026-0001', NULL, 'Kerina', '3 services', 'Large SUV/4x4', '220 Umhlanga Rocks Drive', '2026-08-18', '2026-08-25', '1837.56', false, '0', '1837.56', 'DRAFT', NULL, '2026-08-18 08:53:47.597663+00', '2026-09-18 10:59:57.112001+00', 'FAILED'),
  ('5787f18d-8efe-49d3-8696-eb499285bb39', 'QTE-2026-0010', NULL, 'Nicholas', 'Interior Detail', 'Sedan/Hatch', 'Millclay, Phoenix', '2026-09-18', '2026-09-25', '1999', false, '0', '1999', 'DRAFT', NULL, '2026-09-18 11:25:00.660707+00', '2026-09-18 11:25:00.660707+00', 'PENDING'),
  ('a0b88f2e-f15b-4d08-a656-aff6aac88848', 'QTE-2026-0011', NULL, 'Nicholas', 'Mobile Wash', 'Sedan/Hatch', 'Millclay, Phoenix', '2026-09-18', '2026-09-25', '299', false, '0', '299', 'DRAFT', NULL, '2026-09-18 11:26:19.059472+00', '2026-09-18 11:26:19.059472+00', 'PENDING'),
  ('479196b4-b405-4527-a578-914310885a1c', 'QTE-2026-0004', NULL, 'Shiven', 'Stage 1 Finish (Paint Enhancement) - Large SUV/4x4', 'Large SUV/4x4', 'Chartwell Estaste Musgrave', '2026-09-10', '2026-09-17', '2999', false, '0', '2999', 'DRAFT', NULL, '2026-09-10 10:15:33.905741+00', '2026-09-10 10:15:33.905741+00', 'PENDING'),
  ('b2bfeafb-c295-4c09-aa04-7b53cd09e812', 'QTE-2026-0005', NULL, 'Shiven', 'Vehicle Polishing — Stage 1 - Finish', 'Large SUV/4x4', NULL, '2026-09-10', '2026-09-17', '4998', false, '0', '4998', 'DRAFT', NULL, '2026-09-10 10:30:32.199739+00', '2026-09-10 10:30:32.199739+00', 'PENDING'),
  ('08c0061e-b3be-4df1-a81e-c36a4507f0f6', 'QTE-2026-0007', NULL, 'Matthews', 'Interior Detail', 'Mini SUV/Cross', 'Mount Edgecombe Mill', '2026-09-11', '2026-09-18', '2499', false, '0', '2499', 'DRAFT', NULL, '2026-09-11 12:39:29.323476+00', '2026-09-11 12:39:29.323476+00', 'PENDING')
on conflict (id) do nothing;

-- quote_items (21 rows)
insert into public.quote_items (id, quote_id, service_id, description, quantity, quantity_label, unit_price, total_price, labour_cost, product_cost, sort_order, created_at) values
  ('d1cd9f71-d062-4f68-afaa-4e43cce1d2b5', 'd3bf1156-5706-4a45-abe5-1b5b6bd13086', '771b1ff9-30f4-48f3-90a8-118da92e2a56', 'Mobile Wash - Monthly Subscription - Large SUV/4x4', '2', NULL, '399', '798', '0', '6.33', '0', '2026-08-18 08:55:39.937505+00'),
  ('2d16578d-881e-4b69-96b0-b2ce5a287716', 'd3bf1156-5706-4a45-abe5-1b5b6bd13086', '771b1ff9-30f4-48f3-90a8-118da92e2a56', 'Mobile Wash - Monthly Subscription - Large SUV/4x4', '2', NULL, '399', '798', '0', '6.33', '1', '2026-08-18 08:55:39.937505+00'),
  ('8b6e8d59-3742-4ec7-8556-59ff3995b600', 'd3bf1156-5706-4a45-abe5-1b5b6bd13086', NULL, 'Call out Fee', '2', NULL, '120.78', '241.56', '0', '0', '2', '2026-08-18 08:55:39.937505+00'),
  ('103f9c33-ef8d-41d0-a07f-7cc46af6b97f', 'cd062f36-07e1-4e35-adfd-20f2c5a58b59', '771b1ff9-30f4-48f3-90a8-118da92e2a56', 'Mobile Wash - Monthly Subscription - Large SUV/4x4', '1', NULL, '899', '899', '0', '6.33', '0', '2026-08-19 09:29:12.267796+00'),
  ('320b7883-9c32-40fa-ab2c-9d1bf3b01798', 'cd062f36-07e1-4e35-adfd-20f2c5a58b59', NULL, 'Call out Fee', '1', NULL, '267.3', '267.3', '0', '0', '1', '2026-08-19 09:29:12.267796+00'),
  ('7fa997b1-31ee-469b-b580-abeea8492b8b', 'a7826018-674b-483c-8783-0a658b21b16a', 'f8f7ccf1-64ef-4f9e-bb37-5579868c35fc', 'Stage 1 Ceramic Coating - Large SUV/4x4', '1', NULL, '8598', '8598', '1000', '1659.38', '0', '2026-08-30 10:24:44.400662+00'),
  ('ff1bb3ac-1b92-46e7-b97b-1e6f6b3633d0', '479196b4-b405-4527-a578-914310885a1c', 'c9d64aef-4522-4759-bc0a-7f20f035832e', 'Stage 1 Finish (Paint Enhancement) - Large SUV/4x4', '1', NULL, '2999', '2999', '500', '412.08', '0', '2026-09-10 10:15:34.815429+00'),
  ('8ba7a574-4be0-48ca-b887-43de69c5ec9c', 'b2bfeafb-c295-4c09-aa04-7b53cd09e812', 'c9d64aef-4522-4759-bc0a-7f20f035832e', 'Stage 1 Finish (Paint Enhancement) - Large SUV/4x4', '1', NULL, '2999', '2999', '500', '412.08', '0', '2026-09-10 10:30:33.004578+00'),
  ('f3a6d529-ea8a-4c7e-9be6-e5476d5e60ab', 'b2bfeafb-c295-4c09-aa04-7b53cd09e812', NULL, 'Three Year Ceramic Coating (Car Pro)', '1', NULL, '1999', '1999', '0', '0', '1', '2026-09-10 10:30:33.004578+00'),
  ('6bdc11e1-4a32-44af-9b60-64ea2f664a3e', '279113d0-77a2-4e05-902c-d8eb6baf8278', NULL, '249', '4', NULL, '249', '996', '0', '0', '0', '2026-09-10 10:34:49.025834+00'),
  ('fd6d7057-4515-4b01-a0f0-2a655685ae15', '08c0061e-b3be-4df1-a81e-c36a4507f0f6', 'dbf69a92-5ce9-4013-8c44-04b3547df9cf', 'Interior Detail - Mini SUV/Cross', '1', NULL, '2499', '2499', '500', '91.48', '0', '2026-09-11 12:39:30.060296+00'),
  ('a749fffb-a279-424a-9fd4-c4481d399f0f', '08c0061e-b3be-4df1-a81e-c36a4507f0f6', NULL, 'Engen Bay Detail', '1', NULL, '0', '0', '0', '0', '1', '2026-09-11 12:39:30.060296+00'),
  ('5910d5a9-0018-40dc-bcbf-44bee4098892', '5f612ef1-d934-4cff-b8ec-cd0b08e28aa2', '7e8a7641-4b1f-4ad1-b5ed-83c28294988e', 'Interior Detail - Sedan/Hatch', '1', NULL, '1999', '1999', '500', '91.48', '0', '2026-09-14 07:39:26.741809+00'),
  ('e7c4cac8-8618-4b3d-8e13-2d9135713e24', '72c9f09e-bef8-4689-a492-b35508065974', '33f7783f-f364-4f56-9355-77f67b556896', 'Mobile Wash - Sedan/Hatch', '1', NULL, '299', '299', '0', '6.33', '0', '2026-09-15 08:40:14.054602+00'),
  ('00d49b3b-1121-4fe4-afba-dfb65ffaaa74', '72c9f09e-bef8-4689-a492-b35508065974', NULL, 'Pet Hair Removal', '1', NULL, '0', '0', '0', '0', '1', '2026-09-15 08:40:14.054602+00'),
  ('84b2e2e1-d413-41a9-8232-437bcea4e358', '72c9f09e-bef8-4689-a492-b35508065974', NULL, 'Call Out Fee', '1', NULL, '71.28', '71.28', '0', '0', '2', '2026-09-15 08:40:14.054602+00'),
  ('02f1c249-2887-4694-aac0-5094560fdfdd', '5787f18d-8efe-49d3-8696-eb499285bb39', '7e8a7641-4b1f-4ad1-b5ed-83c28294988e', 'Interior Detail - Sedan/Hatch', '1', NULL, '1999', '1999', '500', '91.48', '0', '2026-09-18 11:25:01.426656+00'),
  ('13958627-715d-40e7-9591-0ad8e13b7c1b', '5787f18d-8efe-49d3-8696-eb499285bb39', NULL, 'Call Out Fee', '1', NULL, '0', '0', '0', '0', '1', '2026-09-18 11:25:01.426656+00'),
  ('1fe6a815-ba06-4100-a6b5-84d33472f793', '5787f18d-8efe-49d3-8696-eb499285bb39', NULL, 'Exterior Wash', '1', NULL, '0', '0', '0', '0', '2', '2026-09-18 11:25:01.426656+00'),
  ('15a32c50-259e-45a1-85ab-6ad4c867425f', 'a0b88f2e-f15b-4d08-a656-aff6aac88848', '33f7783f-f364-4f56-9355-77f67b556896', 'Mobile Wash - Sedan/Hatch', '1', NULL, '299', '299', '0', '6.33', '0', '2026-09-18 11:26:19.76253+00'),
  ('462b7136-9839-416d-8622-07f61277306d', 'a0b88f2e-f15b-4d08-a656-aff6aac88848', NULL, 'Call Out Fee', '1', NULL, '0', '0', '0', '0', '1', '2026-09-18 11:26:19.76253+00')
on conflict (id) do nothing;

-- expenses (32 rows)
insert into public.expenses (id, category, description, vendor, amount, expense_date, paid_by, notes, created_at) values
  ('9271e72f-67a3-4f3d-845c-f67182ff463d', 'Equipment', 'Pressure Gun Repair', 'Tipper Hydraulic Services', '200.00', '2026-08-12', 'Petty Cash', NULL, '2026-08-13 06:37:58.72381+00'),
  ('87a763db-1c4d-40f4-ba65-0e1a0683ea71', 'Fuel', 'Vehicle Fill up', 'Engen Garage', '1776.65', '2026-08-05', 'Fuel Card', NULL, '2026-08-13 06:38:51.317115+00'),
  ('804dfe7e-e07a-45c1-9224-41e626200d1d', 'Fuel', 'Generator Fill up', 'Engen Garage', '174.45', '2026-08-03', 'Fuel Card', NULL, '2026-08-13 06:39:36.417532+00'),
  ('c061acd1-ab27-4261-ba96-73dc61fee192', 'Fuel', 'Vehicle Fill up', 'Engen Garage', '200.05', '2026-08-19', 'Fuel Card', NULL, '2026-08-19 09:48:04.465659+00'),
  ('f6f27770-f326-4421-8014-f2e4a196e7cf', 'Vehicle & Maintenance', 'Repaired Reverse Camera', 'Sound Lab', '1300.00', '2026-08-19', 'Petty Cash', NULL, '2026-08-19 09:48:55.246036+00'),
  ('d66b742b-787c-497c-b797-2f8ca7d83c18', 'Salaries / Wages', 'Salary', 'Rickayle', '7600.00', '2026-08-31', 'Detailers Inc', NULL, '2026-08-19 09:50:36.099194+00'),
  ('f2eaa448-bc20-4a64-8726-155e7bebd0b1', 'Salaries / Wages', 'Salary', 'Randal', '5000.00', '2026-08-31', 'Detailers Inc', NULL, '2026-08-19 09:51:08.788446+00'),
  ('ce2c38e0-ed6c-4097-9b7c-be5283f29c56', 'Salaries / Wages', 'Salary', 'Louyanda', '5000.00', '2026-08-31', 'Detailers Inc', NULL, '2026-08-19 09:51:59.204511+00'),
  ('5df75a55-963b-4a8f-8428-715df8f37c08', 'Marketing', 'Marketing', 'Ricin Marketing', '1950.00', '2026-08-31', 'Detailers Inc', NULL, '2026-08-19 09:52:54.599491+00'),
  ('da8750dc-d103-43ba-a7f7-533cc4b31be0', 'Insurance', 'Insurance', 'Outsurance', '7047.64', '2026-08-31', 'Detailers Inc', NULL, '2026-08-19 09:56:14.479215+00'),
  ('d0bfc17d-6c4a-48ec-8ffe-cab812856cb7', 'Products & Chemicals', 'Equipment', 'Makro', '129.20', '2026-08-19', 'Petty Cash', NULL, '2026-08-19 10:48:18.606612+00'),
  ('66a43c45-ecf1-4115-acd8-655c4d6f00ef', 'Airtime & Data', 'Cellphone Allowance', 'Rickayle', '250.00', '2026-08-31', 'Detailers Inc', NULL, '2026-08-19 09:57:40.486688+00'),
  ('237c71d8-9361-45e9-b1ab-0f7d60f7b3bf', 'Other', 'Fuel Account', 'Engen Garage', '5000.00', '2026-08-20', 'Detailers Inc', NULL, '2026-08-20 07:46:13.161619+00'),
  ('a654dec3-edb7-4ee2-a98a-7a4ab4c2e4ee', 'Fuel', 'Generator Fill up', 'Engen Garage', '229.05', '2026-08-19', 'Fuel Card', NULL, '2026-08-20 07:42:46.351493+00'),
  ('ecb93a8e-0260-458f-aa9c-b02c2a073bcc', 'Fuel', 'Generator Fill up', 'Engen Garage', '224.95', '2026-08-13', 'Fuel Card', NULL, '2026-08-20 07:43:19.410802+00'),
  ('10c3d139-4a86-4744-89eb-34117d39ca6a', 'Fuel', 'Vehicle Fill up', 'Engen Garage', '1597.85', '2026-08-24', 'Fuel Card', NULL, '2026-09-10 13:30:39.368677+00'),
  ('9b42f740-325b-40d7-8f37-2292e97fe64c', 'Fuel', 'Generator Fill up', 'Engen Garage', '175.45', '2026-08-24', 'Fuel Card', NULL, '2026-09-10 13:31:08.781235+00'),
  ('6bcfa56e-c689-458e-a85c-5a8f0fd53640', 'Fuel', 'Vehicle Fill up Chevy', 'Engen Garage', '500.00', '2026-08-25', 'Detailers Inc', NULL, '2026-09-10 13:32:00.327516+00'),
  ('7cdd06a7-489e-4aaf-a9df-f3c679b0eac2', 'Products & Chemicals', 'Car Shampoo', 'Makro', '198.00', '2026-08-26', 'Detailers Inc', NULL, '2026-09-10 13:34:00.553624+00'),
  ('00b2be60-702d-427a-92ab-8c74f78058f6', 'Marketing', 'Flyers', 'Print It Post It', '270.00', '2026-08-27', 'Detailers Inc', NULL, '2026-09-10 13:34:46.036236+00'),
  ('b62d49c8-6f1c-49e4-8c08-55e8db0873f8', 'Equipment', 'Containers', 'House Hold Plastics', '75.10', '2026-08-27', 'Detailers Inc', NULL, '2026-09-10 13:35:55.522917+00'),
  ('0c172ee2-209e-482b-9da6-e4cec558d603', 'Products & Chemicals', 'Car Shampoo', 'Tevo', '172.13', '2026-08-27', 'Detailers Inc', NULL, '2026-09-10 13:37:04.371388+00'),
  ('210fb805-16cb-4766-b003-34b21fbfc7fd', 'Fuel', 'Generator Fill up', 'Engen Garage', '239.80', '2026-09-01', 'Fuel Card', NULL, '2026-09-10 13:37:50.873385+00'),
  ('13da60a7-2622-4fe3-afc6-a9b7b149a8aa', 'Marketing', 'Flyers', 'Print It Post It', '270.00', '2026-09-07', 'Detailers Inc', NULL, '2026-09-10 13:38:26.631459+00'),
  ('dca0cbe5-0c40-4bdc-a857-fcba44758966', 'Products & Chemicals', 'Cloths', 'Midas', '215.00', '2026-09-10', 'Detailers Inc', NULL, '2026-09-10 13:39:05.839487+00'),
  ('d49c6aad-e67f-4369-a870-be3d4edaeded', 'Fuel', 'Diesel Top Up', 'Old Mill Engen Garage', '1943.75', '2026-09-14', 'Detailers Inc', NULL, '2026-09-16 08:35:59.588032+00'),
  ('4e36c75f-70a5-49da-9529-4a810ed42417', 'Fuel', 'Generator Top Up', 'Old Mill Engen Garage', '246.55', '2026-09-10', 'Detailers Inc', NULL, '2026-09-16 08:37:37.859212+00'),
  ('3443d863-fb60-483e-ac4d-d7295f8537f8', 'Products & Chemicals', 'Alcantara Cleaner', 'Autostyle Umhlanga', '250.00', '2026-09-16', 'Detailers Inc', 'Purchased for Interior Detail', '2026-09-16 11:26:43.609665+00'),
  ('40f1f002-2228-4301-9817-85f01af2e1ec', 'Products & Chemicals', 'Distilled Water', 'Masterparts Phoenix', '33.52', '2026-09-16', 'Detailers Inc', 'Purchased for Interior Detail', '2026-09-16 11:27:56.802248+00'),
  ('6053ee01-a780-4dc9-b260-281719127f7a', 'Vehicle & Maintenance', 'Fiat Brake Lights', 'Masterparts Phoenix', '31.76', '2026-09-18', 'Detailers Inc', NULL, '2026-09-18 09:29:30.704988+00'),
  ('63b02bd0-93a3-4d51-baff-483bd69a48bb', 'Vehicle & Maintenance', 'Fiat Headlights', 'Midas', '30.00', '2026-09-18', 'Detailers Inc', NULL, '2026-09-18 09:30:57.705111+00'),
  ('ccb7bc0f-6d42-45dc-84d1-d0c6d2164271', 'Fuel', 'Ratchet Screwdriver', 'Quick Hardware', '85.00', '2026-09-18', 'Detailers Inc', NULL, '2026-09-18 09:32:36.052447+00')
on conflict (id) do nothing;

commit;

-- Row counts after seeding:
--   services                     33
--   clients                      26
--   client_month_subscriptions   26
--   client_pushes                26
--   quotes                       11
--   quote_items                  21
--   expenses                     32
