# Supabase setup for Note

This folder contains the base schema and seed data used by the suggestion engine.

## Files

- `supabase_schema.sql` : schema creation and default policies.
- `seed_data.sql` : demo themes, words and phrase templates.

## How to use

1. Open your Supabase project.
2. Go to SQL Editor.
3. Run `supabase_schema.sql`.
4. Run `seed_data.sql`.
5. Copy the project URL and keys from Project Settings > API.
6. Store them in the backend `.env` file.

## Required environment variables

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=development
```

## Tables created

- `themes`
- `words`
- `phrase_templates`
- `user_preferences`

These tables form the base for a suggestion engine based on themes, style and semantic relevance.
