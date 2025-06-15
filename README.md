# Notion GPT Buddy [ WIP ! ] 🐱‍💻
![](https://img.shields.io/badge/WIP%20!-red?style=social&logo=github&logoSize=auto)
![](https://img.shields.io/badge/State-Development-red?style=flat&logo=github&logoSize=auto)
[![](https://img.shields.io/badge/Next.js-black?logo=nextdotjs&logoSize=auto)](https://nextjs.org/)
[![](https://img.shields.io/badge/TypeScript-blue?style=flat&logo=typescript&logoColor=fafafa&logoSize=auto)](https://www.typescriptlang.org/)
[![](https://img.shields.io/badge/Vercel-black?logo=vercel&logoSize=auto)](https://vercel.com/)
[![](https://img.shields.io/badge/license-GNU%20GPL--3.0-blue)](https://github.com/sharin-void/notion-gpt-buddy/blob/master/LICENSE)

> [!IMPORTANT]
> This project is being currently developed, but you can check in on the progress while it's happening here!

&nbsp;

<p align="center"><img src="https://github.com/sharin-void/notion-gpt-buddy/blob/master/src/app/logo-390x200.png"></p>

&nbsp;

Build a ChatGPT-powered Notion assistant with the help of Next.js and Vercel. This tool helps you interact with your Notion workspace using natural language, making it easier to manage your notes, tasks, and databases.

# Features 🚀

* 🤖 ChatGPT-powered natural language interface
* 📝 Read and (in the future) write to Notion pages and databases
* 🎨 Modern, responsive UI
* 🔒 Secure API key management

# Requirements

* [OpenAI API](https://platform.openai.com/settings/organization/api-keys)
* [Notion API](https://notion.so/my-integrations)
* [Supabase](https://supabase.com/) for conversation persistence
* [Vercel](https://vercel.com/) account for hosting the app

# Progress 📈

> [!PROGRESS]
> Currently working on: \
> * Database querying system \
> * Page read functionality \
> * Chat system \

## Core Infrastructure
- [x] Next.js framework with TypeScript setup
- [x] OpenAI and Notion API integration
- [x] Environment configuration and error handling

## Database Integration
- [x] Schema caching system with automated updates
- [x] Universal query templates for any database configuration
- [x] Natural language to database query mapping
- [x] Support for filters, sorting, and date-based queries
- [x] JSON query extraction from ChatGPT responses
- [ ] Complex multi-database queries
- [ ] Query result caching
- [ ] Advanced date range handling

## Chat System
- [x] Two-stage query processing (analysis + execution)
- [x] Natural language database querying
- [x] Conversational responses based on real data
- [x] Universal system prompts
- [ ] Loading states and progress indicators
- [ ] Better error messages with suggestions

## Memory & Persistence
- [x] Supabase integration for conversation storage
- [x] Conversation service with CRUD operations
- [x] Message persistence and history management
- [ ] Conversation management UI

## Notion Page Integration
- [x] Basic page search functionality
- [ ] Full-text page content extraction and analysis
- [ ] Block-level operations
- [ ] Block and database content creation and modification

## User Experience
- [x] Improved chat interface with message bubbles
- [x] Responsive design and readability
- [x] Concise responses (titles only unless details requested)
- [ ] Mobile optimization
- [ ] Dark/light theme support

## Production Ready
- [ ] Vercel deployment configuration
- [ ] Rate limiting and request optimization
- [ ] Performance monitoring and logging
- [ ] CI/CD pipeline setup

## Testing the Current Build 🧪

1. **Setup**
   ```bash
   # Clone the repository
   git clone https://github.com/your-username/notion-gpt-buddy.git
   cd notion-gpt-buddy

   # Install dependencies
   npm install
   ```

2. **Configuration**
   - Rename `.env.example` to `.env` and add your API keys:
     ```dotenv
     OPENAI_API_KEY=your_openai_api_key_here
     NOTION_API_KEY=your_notion_api_key_here
     SUPABASE_URL=your_project_url
     SUPABASE_ANON_KEY=your_anon_key
     ```
   - Create a file named `notion-config.json` with your Notion page and database IDs (you can use notion-config-example.json for reference):
     ```json
     {
       "pages": {
         "your-page-name": "your-page-id"
       },
       "databases": {
         "your-database-name": "your-database-id"
       }
     }
     ```
3. **Update Schema cache**
   The project includes a schema caching system that automatically fetches and stores your Notion database schemas. This helps with:
   - Building accurate queries
   - Validating property types
   - Providing better error messages
   - Keeping track of database changes

   After creating the `.env` and `notion-config.json` files and populating them, run:
   ```bash
   npm run update-notion-schemas
   ```
   The schema cache is stored in `.notion-cache/` directory. Individual databases each have their own individual schemas, and there is a combined schema `schemas.json`.

4. **Set up Supabase tables**
   Create a Supabase project, inside of which you should create a `conversations` and a `messages` table with the following columns:
   ```sql
   -- First create the conversations table
   create table public.conversations (
      id uuid not null default gen_random_uuid(),
       created_at timestamp with time zone not null default now(),
       title text not null,
       last_updated timestamp with time zone not null default now(),
       constraint conversations_pkey primary key (id)
   );

   -- Then create the messages table with conversations_id as a foreign key and role with a check constraint
   create table public.messages (
      id uuid not null default gen_random_uuid(),
      conversation_id uuid not null,
      role text not null,
      content text not null,
      created_at timestamp with time zone not null default timezone('utc'::text, now()),
      constraint messages_pkey primary key (id),
      constraint messages_conversation_id_fkey foreign key (conversation_id) references conversations (id) on delete cascade,
      constraint messages_role_check check (
         role = any (array['user'::text, 'assistant'::text, 'system'::text])
   )
   );
   ```

   Add indexes for faster lookups and sorting:
   ```sql
   -- Indexes for messages table
   create index messages_conversation_id_idx on messages(conversation_id);
   create index messages_created_at_idx on messages(created_at);
   
   -- Indexes for conversations table
   create index conversations_created_at_idx on conversations(created_at);
   ```

   Enable RLS:
   ```sql
   -- Enable RLS
   ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

   -- Create policies for conversations table
   CREATE POLICY "Enable read access for all users" ON conversations
      FOR SELECT USING (true);

   CREATE POLICY "Enable insert access for all users" ON conversations
      FOR INSERT WITH CHECK (true);

   CREATE POLICY "Enable update access for all users" ON conversations
      FOR UPDATE USING (true);

   CREATE POLICY "Enable delete access for all users" ON conversations
      FOR DELETE USING (true);

   -- Create policies for messages table
   CREATE POLICY "Enable read access for all users" ON messages
      FOR SELECT USING (true);

   CREATE POLICY "Enable insert access for all users" ON messages
      FOR INSERT WITH CHECK (true);

   CREATE POLICY "Enable update access for all users" ON messages
      FOR UPDATE USING (true);

   CREATE POLICY "Enable delete access for all users" ON messages
      FOR DELETE USING (true);
   ```

5. **Running Locally**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to see the application.

6. **Testing Features**
   - Try sending a message in the chat interface and chat with ChatGPT
   - Test Notion database queries _("What are my events for next week?", "How many in progress projects do I have?")_
   - Check error handling by using invalid API keys

## License 📄

This project is licensed under the GNU GPL-3.0 License - see the [LICENSE](LICENSE) file for details.



