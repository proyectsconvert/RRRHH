# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b0b27c4c-d844-4c2c-a76d-49627a0e7d7e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b0b27c4c-d844-4c2c-a76d-49627a0e7d7e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

## Environment Variables

Create a `.env` file in the root directory with the following variables (you can copy from `.env.example`):

```env
# Supabase Configuration - Get these from your Supabase project settings
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Evolution-API Configuration (for WhatsApp integration)
VITE_EVOLUTION_API_URL=https://evolution-api.testbot.click
VITE_EVOLUTION_API_TOKEN=26BEA03F1C6F-4FD3-B0B0-EADD25589851
VITE_EVOLUTION_INSTANCE=TestWPP  # Name of your Evolution-API instance
VITE_BOT_NUMBER=3192463493  # WhatsApp number of the bot (without +)
```

**To get your Supabase credentials:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "Project URL" for `VITE_SUPABASE_URL`
4. Copy the "anon public" key for `VITE_SUPABASE_ANON_KEY`

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b0b27c4c-d844-4c2c-a76d-49627a0e7d7e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## WhatsApp Chat Integration

### Setup
1. **Create `.env` file** with your Supabase and Evolution-API credentials
2. **Create the `historychat` table** by running the SQL migration in Supabase:
   - Go to Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `supabase/migrations/20250916164000-create_historychat_table.sql`
   - Click "Run"
3. **Restart your development server** to load the new environment variables
4. **Access the chat** at `/admin/whatsapp`

### Testing the Integration
1. Open the WhatsApp chat interface at `/admin/whatsapp`
2. Click the **"Debug"** button to open the debug panel
3. Click **"Test Connection"** to verify Evolution-API connectivity
4. If the test passes, try sending a message to one of the sample users
5. Check browser console (F12) for detailed logs if issues occur

### Evolution-API Endpoints Used
- **Send Message**: `POST /message/sendText/{instanceName}`
- **Test Connection**: Intenta múltiples endpoints:
  - `/instance/connectionState/{instanceName}`
  - `/instance/info/{instanceName}`
  - `/instance/fetchInstances`
  - `/instance/me`
- **Authentication Methods**: Intenta múltiples métodos:
  - `Authorization: Bearer {token}`
  - `apikey: {token}` header
  - `?apikey={token}` query parameter
- **Request Body**: `{"number": "573001234567", "text": "Hello World"}`
- **Instance Name**: `TestWPP` (configured in VITE_EVOLUTION_INSTANCE)

### Sample Data
The table includes sample conversations with:
- **Juan Pérez** (573001234567) - Development discussion
- **María García** (573001234568) - Job inquiry
- **Carlos Rodríguez** (573001234569) - Data analyst interest

### Debugging
If you get "Error sending message" when trying to send messages:

1. Click the **"Debug"** button in the WhatsApp interface
2. Check that environment variables are properly configured
3. Click **"Test Connection"** to verify Evolution-API connectivity
4. Check browser console (F12) for detailed error logs

### Troubleshooting
- **Environment variables not set**: Ensure `.env` file exists with correct values
- **401 Unauthorized**: El sistema intenta múltiples métodos de autenticación:
  - `Authorization: Bearer {token}`
  - `apikey: {token}` header
  - `?apikey={token}` query parameter
  - Si todos fallan, verifica el token en Evolution-API dashboard
- **Token expired**: Verify Evolution-API token is valid and not expired
- **Wrong URL**: Confirm Evolution-API instance URL is accessible
- **Phone number format**: Ensure numbers are without + prefix
- **CORS issues**: Check Evolution-API CORS configuration
- **Endpoint not found**: Evolution-API uses `/message/sendText/{instance}` (not `/message/send`)
- **Instance not connected**: Ensure WhatsApp is connected in Evolution-API dashboard
- **Instance name wrong**: Verify `VITE_EVOLUTION_INSTANCE` matches your Evolution-API instance name
- **API Response Error**: Check browser console for detailed Evolution-API error responses

# RRRHH
