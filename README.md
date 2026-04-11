# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Database Schema Reset

If you need to completely reset your Supabase database schema to its default state for this application, you can use the schema script provided.

**WARNING: This is a destructive action and will delete all data in your public schema.**

1.  Navigate to the `migration_dist/schema.sql` file in the file explorer.
2.  Copy the entire content of the file.
3.  Go to your Supabase Project Dashboard.
4.  In the left sidebar, click on the **SQL Editor** icon.
5.  Click on **+ New query**.
6.  Paste the copied SQL content into the editor.
7.  Click the **RUN** button.

This will drop all existing tables and recreate them with the correct structure, policies, and functions required for the app to work correctly.
