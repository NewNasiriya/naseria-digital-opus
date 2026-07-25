UPDATE public.honor_boards
SET media_id = '8f66c769-a858-4211-907a-9cc02cd9f850', image_url = NULL, updated_at = now()
WHERE id = '6c3d44e1-ab0b-4478-9e0a-1150e88c0bcc';

UPDATE public.honor_boards
SET media_id = 'b7ec974f-7d65-4592-ba41-8214707cf74b', image_url = NULL, updated_at = now()
WHERE id = 'df38ca26-75ab-42e8-a737-b5823cd2b1f8';

UPDATE public.media
SET is_archived = true
WHERE id = '3de80c7d-beb0-47ad-9458-18cf4577e11f';