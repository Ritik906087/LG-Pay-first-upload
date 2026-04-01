# Firebase to Supabase Data Migration

This directory contains the scripts and instructions needed to migrate your data from Firebase Firestore to your Supabase PostgreSQL database.

**IMPORTANT:** This process will migrate your user data (profiles, orders, etc.) but **it will NOT migrate user passwords**. For security reasons, passwords cannot be exported from Firebase. After the migration, your users will need to use the "Forgot Password" feature to set a new password for their accounts.

## Migration Process Overview

1.  **Prerequisites**: Install necessary tools.
2.  **Configure Firebase**: Provide your Firebase project's service account key.
3.  **Configure Supabase**: Provide your Supabase database connection string.
4.  **Export Data**: Run the export script to pull data from Firestore and generate SQL files.
5.  **Import Data**: Run the import script to load the data into Supabase.

---

### Step 1: Prerequisites

Before you begin, ensure you have [Node.js](https://nodejs.org/) installed on your machine.

Then, open your terminal in the root directory of this project and install the necessary npm packages by running:

```bash
npm install
```

### Step 2: Configure Firebase Access

The script needs administrative access to your Firebase project to read the data.

1.  Go to your **Firebase Console**.
2.  Select your project.
3.  Click the gear icon next to "Project Overview" and select **Project settings**.
4.  Go to the **Service accounts** tab.
5.  Click the **Generate new private key** button. A JSON file will be downloaded.
6.  **Rename** the downloaded file to `serviceAccountKey.json`.
7.  **Replace** the existing placeholder file at `migration_dist/serviceAccountKey.json` with the file you just downloaded and renamed.

### Step 3: Configure Supabase Access

The script needs your Supabase database connection string to write the data.

1.  Go to your **Supabase Project Dashboard**.
2.  In the left sidebar, click the **Settings** icon (gear).
3.  In the settings menu, click **Database**.
4.  Under the **Connection string** section, copy the URI. It will look something like `postgres://postgres.[your-project-ref]:[your-password]@[aws-region].pooler.supabase.com:5432/postgres`.
5.  In the root directory of this project, open the `.env.local` file (create it if it doesn't exist).
6.  Add the following line, replacing the placeholder with the URI you copied:

    ```
    SUPABASE_DB_URL="YOUR_SUPABASE_DATABASE_CONNECTION_STRING_URL"
    ```

### Step 4: Run the Export Script

This script will connect to your Firestore database, read all the data from the configured collections, and create a set of SQL batch files in the `migration_dist/batches` directory.

In your terminal (at the project root), run the following command:

```bash
npm run migrate:export
```

You will see log messages indicating the progress. If successful, you will see a "Firestore Data Export Complete" message.

### Step 5: Run the Import Script

This final script will take the SQL files generated in the previous step and execute them against your Supabase database, effectively inserting all your data.

In your terminal, run:

```bash
npm run migrate:import
```

The script will process each batch file. You will see progress logs for each file.

### Step 6: Post-Migration - User Passwords

Your data is now in Supabase!

Remember, you must now inform your users that they need to reset their password using the "Forgot Password" feature on the login page before they can log in to the new system.
