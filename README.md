# Notion GPT Buddy [ WIP ! ] 🐱‍💻
![](https://img.shields.io/badge/WIP%20!-red?style=social&logo=github&logoSize=auto)
![](https://img.shields.io/badge/State-Development-red?style=flat&logo=github&logoSize=auto)
[![](https://img.shields.io/badge/Next.js-black?logo=nextdotjs&logoSize=auto)](https://nextjs.org/)
[![](https://img.shields.io/badge/TypeScript-blue?style=flat&logo=typescript&logoColor=fafafa&logoSize=auto)](https://www.typescriptlang.org/)
[![](https://img.shields.io/badge/Vercel-black?logo=vercel&logoSize=auto)](https://vercel.com/)
[![](https://img.shields.io/badge/license-GNU%20GPL--3.0-blue)](https://github.com/sharin-void/notion-gpt-buddy/blob/master/LICENSE)

> [!IMPORTANT]
> This project is being currently developed, but you can check in on the progress while it's happening here! :r:

&nbsp;

<p align="center"><img src="https://github.com/sharin-void/notion-gpt-buddy/blob/master/src/app/logo-390x200.png"></p>

&nbsp;

Build a ChatGPT-powered Notion assistant with the help of Next.js and Vercel. This tool helps you interact with your Notion workspace using natural language, making it easier to manage your notes, tasks, and databases.

# Features 🚀

* 🤖 ChatGPT-powered natural language interface
* 📝 Read and write to Notion pages and databases
* 🔄 Real-time chat interface
* 🎨 Modern, responsive UI
* 🔒 Secure API key management

# Requirements

* [OpenAI API](https://platform.openai.com/settings/organization/api-keys)
* [Notion API](https://notion.so/my-integrations)
* [Vercel](https://vercel.com/) account for hosting the app

# Project Status 📊

## Completed ✅
* Next.js framework configured with TypeScript
* OpenAI API integration
* Notion API integration
* Basic chat interface with message history
* Environment configuration
* Notion resource configuration system
* Client-side hydration fixes
* Basic error handling

## In Progress 🚧
* Notion read/write operations
* Block type support implementation
* UI/UX improvements

# Next Steps 🎯

1. **Notion Integration**
   - [ ] Implement page reading functionality
   - [ ] Add database query support
   - [ ] Enable block creation and modification
   - [ ] Add support for rich text formatting

2. **UI/UX Improvements**
   - [ ] Add loading states
   - [ ] Implement error messages
   - [ ] Add success notifications
   - [ ] Improve mobile responsiveness

3. **Features**
   - [ ] Add conversation history persistence
   - [ ] Implement user preferences
   - [ ] Add support for multiple Notion workspaces
   - [ ] Create documentation for block types

4. **Deployment**
   - [ ] Set up Vercel deployment
   - [ ] Add CI/CD pipeline
   - [ ] Implement monitoring
   - [ ] Add analytics

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
     ```
   - Create a file named `notion-config.json` with your Notion page and database IDs:
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

3. **Running Locally**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to see the application.

4. **Testing Features**
   - Try sending a message in the chat interface
   - Test basic Notion operations (coming soon)
   - Check error handling by using invalid API keys

## License 📄

This project is licensed under the GNU GPL-3.0 License - see the [LICENSE](LICENSE) file for details.
