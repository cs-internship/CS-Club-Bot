# CS-Club-Bot

CS-Club-Bot is a fully automated Telegram bot designed to streamline communication and feedback workflows in a CS internship club. It offers seamless integration with Notion for data storage and Perplexity AI for content analysis, helping mentors and interns stay organized and efficient.

![photo_2025-08-05_00-17-11](https://github.com/user-attachments/assets/1657a796-1615-4e4d-a91d-69add615b56f)



## Project Overview

**CS-Club-Bot** is designed to automate and facilitate the workflow of a CS internship club on Telegram. It handles intern registration, feedback collection, admin communications, and group message processing, with seamless integration to Notion databases and Perplexity AI for content analysis.

## Features

-   **Intern Registration**: Collects and stores intern details via Telegram chat.
-   **Feedback Collection**: Generates secure, personalized feedback links for technical and mentorship sessions.
-   **Admin Messaging**: Allows admins to send direct messages to users.
-   **Group Message Processing**: Handles group messages, including AI-powered analysis for specific hashtags.
-   **Role and Ban Management**: Checks user roles and ban status via Notion.
-   **Notion Integration**: Stores and retrieves user data from Notion databases.
-   **Secure Link Generation**: Uses encryption for feedback links.
-   **Error Handling**: User-friendly error messages and robust exception handling.

## Technologies Used

-   **Node.js**
-   **Telegraf** (Telegram Bot Framework)
-   **Express**
-   **Notion API** (`@notionhq/client`)
-   **dotenv**
-   **CryptoJS**
-   **Perplexity AI API**
-   **moment-jalaali** (Jalali calendar support)

## Installation Instructions

1. **Clone the repository:**
    ```sh
    git clone https://github.com/cs-internship/CS-Club-Bot.git
    cd CS-Club-Bot
    ```
2. **Install dependencies:**
    ```sh
    npm install
    ```
3. **Configure environment variables:**
    - Copy `.env` example or create a new `.env` file (see below).
    - Fill in all required values (see table below).
4. **Start the bot:**
    ```sh
    node index.js
    ```

## Configuration and Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable            | Description                                    |
| ------------------- | ---------------------------------------------- |
| TELEGRAM_BOT_TOKEN  | Telegram bot token                             |
| PERPLEXITY_API_KEY  | Perplexity AI API key                          |
| PORT                | Port for Express server (default: 3000/3001)   |
| ALLOWED_GROUPS      | Comma-separated list of allowed group IDs      |
| ADMIN_USERNAME      | Telegram username of the admin                 |
| USERNAME_SPECIAL_FN | Function for username encryption (as string)   |
| ENCRYPTION_KEY      | Key for encrypting feedback links              |
| NOTION_API_KEY      | Notion API key                                 |
| NOTION_DATABASE_ID  | Notion database ID                             |
| ADMIN_CHAT_ID       | Telegram chat ID for admin group notifications |
| IS_TEST_BOT         | Set to true to append "- test" to the version reply |

## Bot Commands

| Command / Trigger | Description |
| -- | -- |
| `/start` | Start registration or show main menu (private chat only) |
| `/version` | Show bot version (group only) |
| `/group_id` | Show current group ID |
| `/direct <id> <msg>` | Admin: Send direct message to user by Telegram ID |

## Folder/File Structure

```
CS-Club-Bot/
├── .env                        # Environment variables (not committed)
├── .gitattributes
├── .gitignore
├── LICENSE                     # MIT License
├── README.md
├── bot.js                      # Telegraf bot setup and session
├── index.js                    # Express server entrypoint
├── package.json                # Project metadata and dependencies
├── package-lock.json           # Dependency lock file
├── bot/
│   ├── config/
│   │   └── index.js            # Loads and validates environment variables
│   ├── constants/
│   │   ├── errorResponses.js   # Standardized error messages
│   │   ├── system-message.md   # System prompt for Perplexity/AI
│   │   └── systemMessage.js    # Loads system message from markdown
│   ├── handlers/
│   │   ├── commands/
│   │   │   ├── directMessage.js        # Admin direct messaging command
│   │   │   ├── feedbackHandler.js      # Feedback link generation logic
│   │   │   ├── groupId.js              # Group ID command
│   │   │   ├── registrationHandler.js  # User registration logic
│   │   │   ├── start.js                # /start command and onboarding
│   │   │   └── version.js              # Bot version command
│   │   ├── hears/
│   │   │   ├── documentsList.js        # (Stub) List of documents
│   │   │   ├── feedbackSelection.js    # Feedback user selection flow
│   │   │   ├── mainMenu.js             # Main menu navigation
│   │   │   └── mentorshipFeedback.js   # (Stub) Mentorship feedback
│   │   ├── messages/
│   │   │   └── groupHandler.js         # Handles group chat messages
│   │   ├── scenes/
│   │   │   └── mainMenu.js             # Scene for main menu keyboard
│   ├── registerHandlers.js             # Registers all bot handlers
│   ├── services/
│   │   └── perplexity.js               # Perplexity AI API integration
│   └── utils/
│       ├── checkUserBanned.js          # Checks if user is banned (Notion)
│       ├── checkUserExists.js          # Checks if user exists (Notion)
│       ├── createOptions.js            # Options builder for Perplexity API
│       ├── getRoleByUsername.js        # Gets user role from Notion
│       ├── getUsernameByFullname.js    # Gets username by full name (Notion)
└── node_modules/                       # Project dependencies (not committed)
```

**folder Structure Details:**

-   `bot/handlers/commands/`: All Telegram bot commands (admin, registration, feedback, etc.)
-   `bot/handlers/hears/`: Handlers for custom keyboard/menu triggers
-   `bot/handlers/messages/`: Handlers for general message events (e.g., group chat)
-   `bot/handlers/scenes/`: Scene management and menu keyboards
-   `bot/services/`: Integrations with external APIs (Perplexity)
-   `bot/utils/`: Utility functions for Notion, encryption, and API options
-   `bot/constants/`: Static error messages and system prompts
-   `bot/config/`: Loads and validates all required environment variables

> **Note:**
>
> -   All Notion API interactions are handled in `utils/` and some command handlers.
> -   The `.env` file is required for all secrets and configuration.
> -   `node_modules/` and `.env` are not committed to version control.

## Contribution Guidelines

1. Fork the repository and create your branch from `main`.
2. Follow existing code style and structure.
3. Write clear commit messages.
4. Test your changes before submitting a pull request.
5. Open a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact / Author Info

-   **Author:** [Ali Sadeghi](https://github.com/AliSdg90)
- **Developed for:** [CS Internship Program](https://github.com/cs-internship)
