
UPDATE public.honor_boards SET image_url = '/__l5e/assets-v1/268f84aa-c065-46f7-b220-50702a8d3d93/grade-4-honor-2025-2026.png'
  WHERE grade_id = (SELECT id FROM public.grades WHERE level = 4);
UPDATE public.honor_boards SET image_url = '/__l5e/assets-v1/bf883e69-c24d-44b3-a7b4-ad7b19cfb2dd/grade-5-honor-2025-2026.png'
  WHERE grade_id = (SELECT id FROM public.grades WHERE level = 5);
UPDATE public.honor_boards SET image_url = '/__l5e/assets-v1/73c5bbd0-c04c-4b5a-a003-be9a671d0e64/grade-6-honor-2025-2026.png'
  WHERE grade_id = (SELECT id FROM public.grades WHERE level = 6);
