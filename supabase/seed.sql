-- Seed data for incidents in Chennai, India
-- This file contains sample incident data for testing and development

-- First, let's create some test users
INSERT INTO users (id, email, is_verified, created_at, last_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'rajesh.kumar@example.com', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 hour'),
('550e8400-e29b-41d4-a716-446655440002', 'priya.sharma@example.com', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '30 minutes'),
('550e8400-e29b-41d4-a716-446655440003', 'arun.singh@example.com', true, NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 hours'),
('550e8400-e29b-41d4-a716-446655440004', 'meera.patel@example.com', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '15 minutes'),
('550e8400-e29b-41d4-a716-446655440005', 'suresh.reddy@example.com', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '45 minutes');

-- Sample incidents in Chennai, India
-- Using PostGIS ST_Point for location coordinates (longitude, latitude)
INSERT INTO incidents (
  id,
  user_id,
  title,
  description,
  type,
  severity,
  location,
  address,
  status,
  images,
  created_at,
  expires_at,
  is_verified
) VALUES
-- Water logging incidents
(
  '550e8400-e29b-41d4-a716-446655440101',
  '550e8400-e29b-41d4-a716-446655440001',
  'Heavy water logging on Anna Salai',
  'Water level has reached 2 feet on Anna Salai near Teynampet. Traffic is completely blocked. Several vehicles are stranded.',
  'water_logging',
  'high',
  POINT(80.2319, 13.0418), -- Anna Salai, Chennai
  'Anna Salai, Teynampet, Chennai, Tamil Nadu 600018',
  'active',
  ARRAY['https://example.com/images/water-logging-1.jpg', 'https://example.com/images/water-logging-2.jpg'],
  NOW() - INTERVAL '2 hours',
  NOW() + INTERVAL '46 hours',
  false
),
(
  '550e8400-e29b-41d4-a716-446655440102',
  '550e8400-e29b-41d4-a716-446655440002',
  'Water logging near Marina Beach',
  'Severe water logging near Marina Beach entrance. Water has entered nearby shops and restaurants.',
  'water_logging',
  'urgent',
  POINT(80.2831, 13.0418), -- Marina Beach area
  'Marina Beach Road, Chennai, Tamil Nadu 600005',
  'active',
  ARRAY['https://example.com/images/marina-water-logging.jpg'],
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '47 hours',
  true
),

-- Fallen trees incidents
(
  '550e8400-e29b-41d4-a716-446655440103',
  '550e8400-e29b-41d4-a716-446655440003',
  'Large tree fallen on Mount Road',
  'A large banyan tree has fallen across Mount Road near Gemini Circle, blocking traffic completely.',
  'fallen_trees',
  'high',
  POINT(80.2206, 13.0604), -- Mount Road, Chennai
  'Mount Road, Gemini Circle, Chennai, Tamil Nadu 600002',
  'active',
  ARRAY['https://example.com/images/fallen-tree-1.jpg', 'https://example.com/images/fallen-tree-2.jpg'],
  NOW() - INTERVAL '3 hours',
  NOW() + INTERVAL '45 hours',
  false
),
(
  '550e8400-e29b-41d4-a716-446655440104',
  '550e8400-e29b-41d4-a716-446655440004',
  'Tree branch blocking Besant Nagar road',
  'Large tree branch has fallen on Besant Nagar main road, partially blocking traffic.',
  'fallen_trees',
  'medium',
  POINT(80.2628, 12.9941), -- Besant Nagar, Chennai
  'Besant Nagar Main Road, Chennai, Tamil Nadu 600090',
  'active',
  ARRAY['https://example.com/images/besant-nagar-tree.jpg'],
  NOW() - INTERVAL '30 minutes',
  NOW() + INTERVAL '47.5 hours',
  false
),

-- Sewage issues
(
  '550e8400-e29b-41d4-a716-446655440105',
  '550e8400-e29b-41d4-a716-446655440005',
  'Sewage overflow in T. Nagar',
  'Sewage water is overflowing onto the main road in T. Nagar, creating health hazards.',
  'sewage_issues',
  'high',
  POINT(80.2344, 13.0418), -- T. Nagar, Chennai
  'Pondy Bazaar, T. Nagar, Chennai, Tamil Nadu 600017',
  'active',
  ARRAY['https://example.com/images/sewage-overflow.jpg'],
  NOW() - INTERVAL '4 hours',
  NOW() + INTERVAL '44 hours',
  true
),

-- House flooding
(
  '550e8400-e29b-41d4-a716-446655440106',
  '550e8400-e29b-41d4-a716-446655440001',
  'Residential area flooding in Adyar',
  'Several houses in Adyar residential area are flooded due to heavy rains. Water level rising rapidly.',
  'house_flooding',
  'urgent',
  POINT(80.2204, 13.0067), -- Adyar, Chennai
  'Adyar Residential Area, Chennai, Tamil Nadu 600020',
  'active',
  ARRAY['https://example.com/images/adyar-flooding-1.jpg', 'https://example.com/images/adyar-flooding-2.jpg'],
  NOW() - INTERVAL '1.5 hours',
  NOW() + INTERVAL '46.5 hours',
  false
),

-- Wildlife hazard
(
  '550e8400-e29b-41d4-a716-446655440107',
  '550e8400-e29b-41d4-a716-446655440002',
  'Snake spotted in Mylapore temple area',
  'Large snake spotted near Kapaleeshwarar Temple. Crowd gathered, causing traffic jam.',
  'wildlife_hazard',
  'medium',
  POINT(80.2606, 13.0339), -- Mylapore, Chennai
  'Kapaleeshwarar Temple, Mylapore, Chennai, Tamil Nadu 600004',
  'active',
  ARRAY['https://example.com/images/snake-mylapore.jpg'],
  NOW() - INTERVAL '45 minutes',
  NOW() + INTERVAL '47.25 hours',
  false
),

-- Vehicle stuck
(
  '550e8400-e29b-41d4-a716-446655440108',
  '550e8400-e29b-41d4-a716-446655440003',
  'Bus stuck in water near Central Station',
  'MTC bus is stuck in waterlogged area near Chennai Central Railway Station. Passengers need help.',
  'vehicle_stuck',
  'high',
  POINT(80.2779, 13.0827), -- Chennai Central area
  'Park Town, Chennai Central, Chennai, Tamil Nadu 600003',
  'active',
  ARRAY['https://example.com/images/stuck-bus.jpg'],
  NOW() - INTERVAL '2.5 hours',
  NOW() + INTERVAL '45.5 hours',
  true
),

-- Other incidents
(
  '550e8400-e29b-41d4-a716-446655440109',
  '550e8400-e29b-41d4-a716-446655440004',
  'Power outage in Velachery',
  'Power supply disrupted in Velachery area due to water logging affecting electrical equipment.',
  'other',
  'medium',
  POINT(80.2204, 12.9816), -- Velachery, Chennai
  'Velachery Main Road, Chennai, Tamil Nadu 600042',
  'active',
  ARRAY['https://example.com/images/power-outage.jpg'],
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '47 hours',
  false
),

-- Some resolved incidents for variety
(
  '550e8400-e29b-41d4-a716-446655440110',
  '550e8400-e29b-41d4-a716-446655440005',
  'Water logging near Egmore Station - RESOLVED',
  'Water logging near Egmore Railway Station has been cleared. Traffic is now normal.',
  'water_logging',
  'low',
  POINT(80.2590, 13.0827), -- Egmore, Chennai
  'Egmore Railway Station, Chennai, Tamil Nadu 600008',
  'resolved',
  ARRAY['https://example.com/images/egmore-resolved.jpg'],
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '2 hours', -- Already expired
  true
),

-- Some incidents that will expire soon for testing
(
  '550e8400-e29b-41d4-a716-446655440111',
  '550e8400-e29b-41d4-a716-446655440001',
  'Minor water logging in Chromepet',
  'Small water logging issue in Chromepet area. Not severe but needs attention.',
  'water_logging',
  'low',
  POINT(80.1428, 12.9516), -- Chromepet, Chennai
  'Chromepet Main Road, Chennai, Tamil Nadu 600044',
  'active',
  ARRAY['https://example.com/images/chromepet-minor.jpg'],
  NOW() - INTERVAL '47 hours',
  NOW() + INTERVAL '1 hour', -- Will expire soon
  false
);

-- Update the updated_at column for incidents (if the trigger exists)
UPDATE incidents SET updated_at = NOW() WHERE updated_at IS NULL;