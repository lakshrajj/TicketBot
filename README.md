# Samatva RP Discord Ticket Bot

A comprehensive Discord ticket management system designed specifically for roleplay servers. This bot provides a fully-featured ticket system with multiple support categories, smart staff reminders, and beautiful HTML transcripts.

![Discord Ticket System](https://i.imgur.com/placeholder.png)

## Features

### 🎫 Multi-Category Ticket System
- Customizable ticket categories with distinct roles and channels
- Organized ticket creation within appropriate Discord category channels
- User-friendly button interface with emojis and descriptions

### 👮‍♂️ Smart Staff Management
- Role-based access control for different ticket types
- Staff-only commands for ticket management
- Add or remove users from tickets with simple commands

### ⏰ Intelligent Reminder System
- Configurable inactive time thresholds (15-60 mins per category)
- Automatic staff ping when tickets need attention
- Reminder system that resets when users add new messages

### 📝 Beautiful Ticket Transcripts
- Custom HTML transcripts with modern styling
- Complete message history with timestamps
- Color-coded messages for staff vs users
- Support for message formatting, embeds, and attachments
- Transcripts sent to dedicated channel and user DMs

### 🔒 Privacy & Security
- Private ticket channels visible only to relevant staff and the ticket creator
- Permissions handling for ticket access
- Secure ticket closing with proper cleanup

## Installation

### Prerequisites
- Node.js v16.9.0 or higher
- A Discord bot application with proper permissions
- Administrator access to your Discord server

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/lakshrajj/ticketbot.git
   cd samatva-ticket-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```
   TOKEN=your_discord_bot_token_here
   ```

4. **Configure the bot**
   Edit the `config` object in `index.js` to match your server's:
   - Staff role ID
   - Transcript channel ID
   - Category IDs
   - Support role IDs
   - Timeout durations

5. **Start the bot**
   ```bash
   node index.js
   ```

6. **Create the ticket panel**
   In your Discord server, use the command:
   ```
   !ticketpanel
   ```

## Configuration

The bot uses a configuration object that can be easily customized:

```js
const config = {
  prefix: '!',
  staffRoleId: 'YOUR_STAFF_ROLE_ID',
  transcriptChannelId: 'YOUR_TRANSCRIPT_CHANNEL_ID',
  
  // Ticket categories
  categories: {
    'basic-support': {
      emoji: '❓',
      name: 'Basic Support',
      description: 'General questions and support',
      categoryId: '1131568173070688296',
      roleId: 'YOUR_BASIC_SUPPORT_ROLE_ID',
      inactiveTimeout: 15 * 60 * 1000 // 15 minutes
    },
    // Add more categories here
  }
};
```

## Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `!ticketpanel` | Creates the ticket panel with category buttons | Administrator |
| `!close` | Closes a ticket and generates a transcript | Staff |
| `!add @user` | Adds a user to the current ticket | Staff |
| `!remove @user` | Removes a user from the current ticket | Staff |

## Transcript Example

The bot generates beautiful HTML transcripts when tickets are closed:

![Transcript Example](https://i.imgur.com/placeholder2.png)

Features of the transcript system:
- Modern dark theme with custom styling
- Clear distinction between staff and user messages
- Complete message history including embeds and attachments
- Responsive design that works on mobile and desktop

## Required Permissions

The bot requires the following permissions:
- Manage Channels
- View Channels
- Send Messages
- Manage Messages
- Embed Links
- Attach Files
- Read Message History
- Add Reactions
- Use External Emojis
- Manage Roles (for channel permissions)

## Support

If you encounter any issues or have questions about the bot, please open an issue on this repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Built with Discord.js
- Created for the Samatva Roleplay Server community
