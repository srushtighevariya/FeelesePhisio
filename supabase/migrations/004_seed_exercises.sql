-- ============================================================
-- 004_seed_exercises.sql — Built-in exercise library
-- ============================================================

insert into public.exercises (name, category, body_part, sets, reps, duration_min, level, description) values
  ('Shoulder Pendulum',        'Mobility',    'Shoulder', 3, 10, 5,  'Beginner',     'Lean forward and let arm hang, swing in small circles to improve shoulder mobility.'),
  ('Wall Slides',              'Mobility',    'Shoulder', 3, 12, 5,  'Beginner',     'Stand with back to wall, slide arms up and down keeping contact.'),
  ('Theraband External Rotation','Strengthening','Shoulder',3,15,10,'Beginner',    'Attach band to doorframe, rotate arm outward against resistance.'),
  ('Prone Y-T-W',              'Strengthening','Shoulder', 3, 10, 8,  'Intermediate', 'Lie prone, raise arms in Y, T and W positions to strengthen scapular stabilizers.'),
  ('Seated Row with Band',     'Strengthening','Back',     3, 15, 10, 'Beginner',     'Sit tall, pull resistance band to sides keeping elbows close.'),
  ('Cat-Cow Stretch',          'Mobility',    'Back',     3, 10, 5,  'Beginner',     'On all fours, alternate arching and rounding the spine rhythmically.'),
  ('Bird Dog',                 'Stability',   'Back',     3, 12, 8,  'Beginner',     'On all fours, extend opposite arm and leg while keeping a neutral spine.'),
  ('Dead Bug',                 'Stability',   'Core',     3, 10, 8,  'Intermediate', 'Lie supine, lower opposite arm and leg while maintaining lumbar contact.'),
  ('Plank Hold',               'Stability',   'Core',     3, 1,  1,  'Intermediate', 'Hold push-up position on forearms, keeping body in a straight line. Hold 30-60 s.'),
  ('Clamshells',               'Strengthening','Hip',     3, 15, 8,  'Beginner',     'Lie on side, keep feet together and raise top knee like a clamshell.'),
  ('Hip Flexor Stretch',       'Stretching',  'Hip',      3, 1,  2,  'Beginner',     'Kneel on one knee, push hips forward gently to stretch front of hip. Hold 30 s.'),
  ('Straight Leg Raise',       'Strengthening','Knee',    3, 15, 8,  'Beginner',     'Lie flat, tighten quads and raise straight leg to 45°. Good post-surgery.'),
  ('Terminal Knee Extension',  'Strengthening','Knee',    3, 15, 8,  'Beginner',     'Band behind knee, straighten leg against resistance. Good for quad activation.'),
  ('Wall Squat',               'Strengthening','Knee',    3, 12, 10, 'Beginner',     'Slide back down a wall to 90° and hold for quad strengthening.'),
  ('Ankle Alphabet',           'Mobility',    'Ankle',    2, 1,  3,  'Beginner',     'Trace the alphabet with your big toe to restore ankle range of motion.'),
  ('Calf Raises',              'Strengthening','Ankle',   3, 20, 5,  'Beginner',     'Rise onto toes and lower slowly to strengthen calf muscles.'),
  ('BAPS Board Balance',       'Balance',     'Ankle',    3, 1,  5,  'Intermediate', 'Stand on balance board, shift weight to improve proprioception.'),
  ('Cervical Retraction',      'Mobility',    'Neck',     3, 10, 5,  'Beginner',     'Gently tuck chin back (chin tuck) to restore cervical alignment.'),
  ('Chin Tuck with Band',      'Strengthening','Neck',    3, 10, 5,  'Intermediate', 'Apply gentle resistance via band while performing chin tuck.'),
  ('Thoracic Extension over Roller','Mobility','Back',   3, 1,  3,  'Beginner',     'Place foam roller across mid-back, support head and gently extend over it.')
on conflict do nothing;
