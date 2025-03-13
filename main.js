const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const discordTranscripts = require('discord-html-transcripts');
require('dotenv').config();

// Initialize Discord Client with necessary intents and permissions
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildEmojisAndStickers,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

// Configuration
const config = {
  prefix: '!',
  staffRoleId: 'YOUR_STAFF_ROLE_ID', // Replace with your staff role ID
  transcriptChannelId: 'YOUR_TRANSCRIPT_CHANNEL_ID', // Replace with your transcript channel ID
  
  // Ticket categories with their respective category IDs and timeout settings
  categories: {
    'basic-support': {
      emoji: '❓',
      name: 'Basic Support',
      description: 'General questions and support',
      categoryId: '1131568173070688296',
      roleId: 'YOUR_BASIC_SUPPORT_ROLE_ID', // Role to ping
      inactiveTimeout: 15 * 60 * 1000 // 15 minutes in milliseconds
    },
    'gang-query': {
      emoji: '👥',
      name: 'Gang Query',
      description: 'Questions related to gangs',
      categoryId: '1260228837640507422',
      roleId: 'YOUR_GANG_QUERY_ROLE_ID',
      inactiveTimeout: 20 * 60 * 1000 // 20 minutes
    },
    'bugs-glitches': {
      emoji: '🐛',
      name: 'Bugs and Glitches',
      description: 'Report bugs or glitches',
      categoryId: '1250159726369443910',
      roleId: 'YOUR_BUGS_ROLE_ID',
      inactiveTimeout: 30 * 60 * 1000 // 30 minutes
    },
    'rp-issues': {
      emoji: '🎭',
      name: 'RP Issues',
      description: 'Issues related to roleplay',
      categoryId: '1250159913364226048',
      roleId: 'YOUR_RP_ISSUES_ROLE_ID',
      inactiveTimeout: 25 * 60 * 1000 // 25 minutes
    },
    'pd-query': {
      emoji: '👮',
      name: 'PD Query',
      description: 'Questions for police department',
      categoryId: '1338933444193030195',
      roleId: 'YOUR_PD_QUERY_ROLE_ID',
      inactiveTimeout: 20 * 60 * 1000 // 20 minutes
    },
    'items-lost': {
      emoji: '🔍',
      name: 'Items Lost',
      description: 'Report lost items',
      categoryId: '1254781142750466068',
      roleId: 'YOUR_ITEMS_LOST_ROLE_ID',
      inactiveTimeout: 30 * 60 * 1000 // 30 minutes
    },
    'report-player': {
      emoji: '⚠️',
      name: 'Report a Player',
      description: 'Report another player',
      categoryId: '1254780522450780274',
      roleId: 'YOUR_REPORT_ROLE_ID',
      inactiveTimeout: 15 * 60 * 1000 // 15 minutes (priority)
    },
    'connecting-issue': {
      emoji: '🔌',
      name: 'Connecting Issue',
      description: 'Problems connecting to the server',
      categoryId: '1289607335874134016',
      roleId: 'YOUR_CONNECTING_ROLE_ID',
      inactiveTimeout: 15 * 60 * 1000 // 15 minutes (priority)
    },
    'unban': {
      emoji: '🔒',
      name: 'Unban',
      description: 'Request to be unbanned',
      categoryId: '1349747620943499284',
      roleId: 'YOUR_UNBAN_ROLE_ID',
      inactiveTimeout: 60 * 60 * 1000 // 60 minutes
    },
    'passes': {
      emoji: '🎫',
      name: 'Passes',
      description: 'Questions about server passes',
      categoryId: '1248911539524603974',
      roleId: 'YOUR_PASSES_ROLE_ID',
      inactiveTimeout: 30 * 60 * 1000 // 30 minutes
    }
  }
};

// Store for active tickets and their timers
const activeTickets = new Map();

// Bot ready event
client.once('ready', () => {
  console.log(`Bot is online! Logged in as ${client.user.tag}`);
});

// Message event handler
client.on('messageCreate', async message => {
  // Ignore messages from bots
  if (message.author.bot) return;
  
  // Check if message starts with the prefix
  if (!message.content.startsWith(config.prefix)) {
    // Check if this is a message in a ticket channel and handle reminders
    handleTicketActivity(message);
    return;
  }
  
  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  // Handle commands
  switch (command) {
    case 'ticketpanel':
      // Check if user has admin permissions
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('You do not have permission to use this command.');
      }
      await createTicketPanel(message.channel);
      break;
      
    case 'close':
      await closeTicket(message);
      break;
      
    case 'add':
      await addUserToTicket(message, args);
      break;
      
    case 'remove':
      await removeUserFromTicket(message, args);
      break;
  }
});

// Function to create the ticket panel
async function createTicketPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle('🎫 Samatva RP Support Tickets')
    .setDescription('Click on a button below to create a support ticket')
    .setColor('#0099ff')
    .setFooter({ text: 'Samatva Roleplay Server' });
    
  // Create buttons for each category (maximum 5 buttons per row)
  const rows = [];
  const categoryKeys = Object.keys(config.categories);
  
  // Create multiple rows of buttons (5 per row max)
  for (let i = 0; i < categoryKeys.length; i += 5) {
    const row = new ActionRowBuilder();
    
    for (let j = i; j < Math.min(i + 5, categoryKeys.length); j++) {
      const category = config.categories[categoryKeys[j]];
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_${categoryKeys[j]}`)
          .setLabel(category.name)
          .setEmoji(category.emoji)
          .setStyle(ButtonStyle.Primary)
      );
    }
    
    rows.push(row);
  }
  
  // Add category descriptions to the embed
  for (const key of categoryKeys) {
    const category = config.categories[key];
    embed.addFields({ name: `${category.emoji} ${category.name}`, value: category.description });
  }
  
  await channel.send({ embeds: [embed], components: rows });
}

// Button interaction handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  
  // Handle ticket creation buttons
  if (interaction.customId.startsWith('ticket_')) {
    await interaction.deferReply({ ephemeral: true });
    
    const categoryKey = interaction.customId.replace('ticket_', '');
    const category = config.categories[categoryKey];
    
    if (!category) {
      return interaction.editReply({ content: 'Invalid ticket category. Please try again.', ephemeral: true });
    }
    
    await createTicket(interaction, categoryKey);
  }
  
  // Handle close ticket button
  if (interaction.customId === 'close_ticket') {
    await closeTicketButton(interaction);
  }
});

// Function to create a new ticket
async function createTicket(interaction, categoryKey) {
  const { guild, user } = interaction;
  const category = config.categories[categoryKey];
  
  // Check if the user already has an open ticket
  const existingTicket = Array.from(guild.channels.cache.values())
    .find(channel => 
      channel.name === `ticket-${user.username.toLowerCase().replace(/\s+/g, '-')}` && 
      channel.parentId === category.categoryId
    );
  
  if (existingTicket) {
    return interaction.editReply({ 
      content: `You already have an open ticket: <#${existingTicket.id}>`, 
      ephemeral: true 
    });
  }
  
  try {
    // Create the ticket channel
    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username.toLowerCase().replace(/\s+/g, '-')}`,
      type: 0, // Text channel
      parent: category.categoryId,
      permissionOverwrites: [
        {
          id: guild.id, // @everyone role
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: user.id, // Ticket creator
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        {
          id: config.staffRoleId, // Staff role
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });
    
    // Create close button
    const closeButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );
    
    // Send initial message in the ticket channel
    const embed = new EmbedBuilder()
      .setTitle(`${category.emoji} ${category.name} Support`)
      .setDescription(`Welcome ${user}! Please describe your issue and wait for a staff member to assist you.`)
      .setColor('#0099ff')
      .setTimestamp();
    
    const message = await ticketChannel.send({ 
      content: `<@${user.id}> | <@&${category.roleId}>`,
      embeds: [embed], 
      components: [closeButton] 
    });
    
    // Track this ticket for reminders
    activeTickets.set(ticketChannel.id, {
      categoryKey,
      userId: user.id,
      createdAt: Date.now(),
      staffReplied: false,
      reminderSent: false,
      reminderTimeout: setTimeout(() => {
        sendReminderForTicket(ticketChannel.id);
      }, category.inactiveTimeout)
    });
    
    await interaction.editReply({ 
      content: `Your ticket has been created: <#${ticketChannel.id}>`, 
      ephemeral: true 
    });
    
  } catch (error) {
    console.error('Error creating ticket:', error);
    await interaction.editReply({ 
      content: 'There was an error creating your ticket. Please try again later.', 
      ephemeral: true 
    });
  }
}

// Function to close a ticket from command
async function closeTicket(message) {
  // Check if this is a ticket channel
  if (!message.channel.name.startsWith('ticket-')) {
    return message.reply('This command can only be used in ticket channels.');
  }
  
  // Check if user has permission (staff role or admin)
  const hasPermission = message.member.roles.cache.has(config.staffRoleId) || 
                        message.member.permissions.has(PermissionsBitField.Flags.Administrator);
  
  if (!hasPermission) {
    return message.reply('You do not have permission to close this ticket.');
  }
  
  await message.channel.send('Ticket will be closed and a transcript will be generated...');
  await generateTranscript(message.channel, message.member);
}

// Function to close a ticket from button
async function closeTicketButton(interaction) {
  // Check if this is a ticket channel
  if (!interaction.channel.name.startsWith('ticket-')) {
    return interaction.reply({ 
      content: 'This command can only be used in ticket channels.', 
      ephemeral: true 
    });
  }
  
  // Check if user has permission (staff role or admin)
  const hasPermission = interaction.member.roles.cache.has(config.staffRoleId) || 
                        interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
  
  if (!hasPermission) {
    return interaction.reply({ 
      content: 'You do not have permission to close this ticket.', 
      ephemeral: true 
    });
  }
  
  await interaction.reply('Ticket will be closed and a transcript will be generated...');
  await generateTranscript(interaction.channel, interaction.member);
}

// Function to generate custom styled transcript
async function generateCustomTranscript(channel) {
  try {
    // Fetch all messages in the channel
    let allMessages = [];
    let lastId = null;
    
    // Fetch messages in batches
    while (true) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;
      
      const messages = await channel.messages.fetch(options);
      if (messages.size === 0) break;
      
      allMessages = [...allMessages, ...messages.values()];
      lastId = messages.last().id;
      
      if (messages.size < 100) break;
    }
    
    // Sort messages by timestamp (oldest first)
    allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    
    // Get ticket information
    const ticketInfo = {
      name: channel.name,
      category: channel.parent ? channel.parent.name : 'No Category',
      createdAt: channel.createdAt
    };
    
    // Build HTML content
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transcript - ${ticketInfo.name}</title>
        <style>
            :root {
                --bg-color: #1a1a1a;
                --text-color: #e0e0e0;
                --header-bg: #252525;
                --accent-color: #a14de0;
                --message-bg: #2d2d2d;
                --message-hover: #333333;
                --staff-color: #00c8af;
                --user-color: #ff7675;
                --timestamp-color: #999999;
                --embed-bg: #252525;
                --border-color: #3d3d3d;
            }
            
            body {
                font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: var(--bg-color);
                color: var(--text-color);
                margin: 0;
                padding: 0;
                line-height: 1.6;
            }
            
            .container {
                max-width: 900px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                background-color: var(--header-bg);
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                border-left: 4px solid var(--accent-color);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            }
            
            .header h1 {
                margin: 0;
                padding: 0;
                font-size: 24px;
                color: white;
            }
            
            .header p {
                margin: 5px 0 0;
                color: var(--timestamp-color);
                font-size: 14px;
            }
            
            .message-container {
                margin-bottom: 30px;
            }
            
            .message {
                padding: 15px;
                margin: 5px 0;
                border-radius: 4px;
                background-color: var(--message-bg);
                transition: background-color 0.2s;
                border-left: 3px solid transparent;
            }
            
            .message:hover {
                background-color: var(--message-hover);
            }
            
            .message.staff {
                border-left-color: var(--staff-color);
            }
            
            .message.user {
                border-left-color: var(--user-color);
            }
            
            .message-header {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .username-container {
                display: flex;
                align-items: center;
            }
            
            .username {
                font-weight: bold;
                margin-right: 8px;
            }
            
            .staff-badge {
                background-color: var(--staff-color);
                color: white;
                font-size: 10px;
                padding: 2px 5px;
                border-radius: 3px;
                text-transform: uppercase;
                margin-right: 8px;
            }
            
            .timestamp {
                color: var(--timestamp-color);
                font-size: 12px;
            }
            
            .content {
                word-wrap: break-word;
                white-space: pre-wrap;
            }
            
            .embed {
                margin-top: 10px;
                padding: 12px;
                background-color: var(--embed-bg);
                border-radius: 4px;
                border-left: 4px solid var(--accent-color);
            }
            
            .embed-title {
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 5px;
            }
            
            .embed-description {
                font-size: 14px;
            }
            
            .attachment {
                max-width: 300px;
                margin-top: 10px;
                border-radius: 4px;
            }
            
            .footer {
                text-align: center;
                padding: 20px;
                color: var(--timestamp-color);
                font-size: 12px;
                border-top: 1px solid var(--border-color);
                margin-top: 20px;
            }
            
            .footer img {
                max-width: 120px;
                margin-bottom: 10px;
            }
            
            @media (max-width: 768px) {
                .container {
                    padding: 10px;
                }
                
                .message {
                    padding: 10px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${ticketInfo.name}</h1>
                <p>Category: ${ticketInfo.category}</p>
                <p>Created: ${ticketInfo.createdAt.toLocaleString()}</p>
                <p>Total Messages: ${allMessages.length}</p>
            </div>
            
            <div class="message-container">
    `;
    
    // Add each message to the HTML
    for (const message of allMessages) {
      const user = message.author;
      const isStaff = message.member?.roles.cache.has(config.staffRoleId) || false;
      const userInitial = user.username.charAt(0).toUpperCase();
      
      // Format message timestamp
      const timestamp = message.createdAt.toLocaleString();
      
      // Format message content, handling embeds and attachments
      let content = message.content || '';
      content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      content = content.replace(/\n/g, '<br>');
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
      content = content.replace(/\_\_(.*?)\_\_/g, '<u>$1</u>');
      content = content.replace(/\~\~(.*?)\~\~/g, '<strike>$1</strike>');
      content = content.replace(/\`\`\`(.*?)\`\`\`/gs, '<pre><code>$1</code></pre>');
      content = content.replace(/\`(.*?)\`/g, '<code>$1</code>');
      
      // Add mentions highlight
      content = content.replace(/<@!?(\d+)>/g, '<span style="color:#5865f2;background:#393e48;padding:0 2px;border-radius:3px;">@User</span>');
      content = content.replace(/<@&(\d+)>/g, '<span style="color:#5865f2;background:#393e48;padding:0 2px;border-radius:3px;">@Role</span>');
      
      // Create message HTML
      htmlContent += `
        <div class="message ${isStaff ? 'staff' : 'user'}">
            <div class="message-header">
                <div class="username-container">
                    <span class="username" style="color: ${isStaff ? 'var(--staff-color)' : 'var(--user-color)'}">
                        ${user.username}
                    </span>
                    ${isStaff ? '<span class="staff-badge">STAFF</span>' : ''}
                </div>
                <span class="timestamp">${timestamp}</span>
            </div>
            <div class="content">${content || '[No Content]'}</div>
      `;
      
      // Add embeds if any
      if (message.embeds && message.embeds.length > 0) {
        for (const embed of message.embeds) {
          htmlContent += `
            <div class="embed" style="border-left-color: ${embed.color ? '#' + embed.color.toString(16).padStart(6, '0') : 'var(--accent-color)'}">
                ${embed.title ? `<div class="embed-title">${embed.title}</div>` : ''}
                ${embed.description ? `<div class="embed-description">${embed.description}</div>` : ''}
            </div>
          `;
        }
      }
      
      // Add attachments if any
      if (message.attachments && message.attachments.size > 0) {
        for (const [_, attachment] of message.attachments) {
          const isImage = attachment.contentType && attachment.contentType.startsWith('image/');
          
          if (isImage) {
            htmlContent += `
              <div>
                <img class="attachment" src="${attachment.url}" alt="Attachment" onerror="this.style.display='none'" />
              </div>
            `;
          } else {
            htmlContent += `
              <div>
                <a href="${attachment.url}" target="_blank" style="color:var(--accent-color);">${attachment.name || 'Attachment'}</a>
              </div>
            `;
          }
        }
      }
      
      htmlContent += `</div>`;
    }
    
    // Close HTML
    htmlContent += `
            </div>
            
            <div class="footer">
                <p>Samatva Roleplay Server - Ticket System</p>
                <p>Transcript generated at ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    // Write HTML to temp file
    const fileName = `transcript-${channel.name}-${Date.now()}.html`;
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, htmlContent);
    
    return filePath;
  } catch (error) {
    console.error('Error generating custom transcript:', error);
    throw error;
  }
}

// Function to generate transcript and close ticket
async function generateTranscript(channel, closer) {
  try {
    // Get the ticket creator's user ID from the channel permissions
    let ticketCreator = null;
    const permissionOverwrites = channel.permissionOverwrites.cache;
    
    for (const [id, overwrites] of permissionOverwrites) {
      if (id !== channel.guild.id && id !== config.staffRoleId) {
        try {
          const user = await client.users.fetch(id);
          if (!user.bot) {
            ticketCreator = user;
            break;
          }
        } catch (error) {
          // Ignore errors from fetching users
        }
      }
    }
    
    // Get the transcript channel
    const transcriptChannel = channel.guild.channels.cache.get(config.transcriptChannelId);
    if (!transcriptChannel) {
      await channel.send('Could not find transcript channel. Please check the configuration.');
      return;
    }
    
    // Generate our custom styled transcript
    const transcriptPath = await generateCustomTranscript(channel);
    const transcript = { 
      attachment: transcriptPath,
      name: path.basename(transcriptPath)
    };
    
    // Create embed for transcript
    const embed = new EmbedBuilder()
      .setTitle(`Transcript: ${channel.name}`)
      .setDescription(`Ticket closed by: ${closer}`)
      .setColor('#00ff00')
      .setTimestamp()
      .addFields(
        { name: 'Ticket', value: channel.name },
        { name: 'Closed by', value: closer.user.tag }
      );
    
    if (ticketCreator) {
      embed.addFields({ name: 'Created by', value: ticketCreator.tag });
    }
    
    // Send transcript to the transcript channel
    await transcriptChannel.send({ embeds: [embed], files: [transcript] });
    
    // Send transcript to ticket creator's DMs
    if (ticketCreator) {
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle(`Transcript: ${channel.name}`)
          .setDescription('Here is a transcript of your ticket that was just closed.')
          .setColor('#00ff00')
          .setTimestamp();
        
        await ticketCreator.send({ embeds: [dmEmbed], files: [transcript] });
      } catch (error) {
        console.log(`Could not send DM to ${ticketCreator.tag}`);
      }
    }
    
    // Clear any active timers for this ticket
    if (activeTickets.has(channel.id)) {
      clearTimeout(activeTickets.get(channel.id).reminderTimeout);
      activeTickets.delete(channel.id);
    }
    
    // Delete the temp file
    try {
      fs.unlinkSync(transcriptPath);
    } catch (err) {
      console.error('Error deleting temp transcript file:', err);
    }
    
    // Delete the ticket channel after a short delay
    await channel.send('Ticket will be deleted in 5 seconds...');
    setTimeout(async () => {
      try {
        await channel.delete();
      } catch (error) {
        console.error('Error deleting channel:', error);
      }
    }, 5000);
    
  } catch (error) {
    console.error('Error generating transcript:', error);
    await channel.send('There was an error generating the transcript.');
  }
}

// Function to add a user to a ticket
async function addUserToTicket(message, args) {
  // Check if this is a ticket channel
  if (!message.channel.name.startsWith('ticket-')) {
    return message.reply('This command can only be used in ticket channels.');
  }
  
  // Check if user has permission (staff role or admin)
  const hasPermission = message.member.roles.cache.has(config.staffRoleId) || 
                        message.member.permissions.has(PermissionsBitField.Flags.Administrator);
  
  if (!hasPermission) {
    return message.reply('You do not have permission to add users to this ticket.');
  }
  
  // Get mentioned user
  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('Please mention a user to add to this ticket.');
  }
  
  try {
    // Add user to the ticket channel
    await message.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });
    
    await message.channel.send(`${user} has been added to this ticket.`);
  } catch (error) {
    console.error('Error adding user to ticket:', error);
    await message.reply('There was an error adding the user to this ticket.');
  }
}

// Function to remove a user from a ticket
async function removeUserFromTicket(message, args) {
  // Check if this is a ticket channel
  if (!message.channel.name.startsWith('ticket-')) {
    return message.reply('This command can only be used in ticket channels.');
  }
  
  // Check if user has permission (staff role or admin)
  const hasPermission = message.member.roles.cache.has(config.staffRoleId) || 
                        message.member.permissions.has(PermissionsBitField.Flags.Administrator);
  
  if (!hasPermission) {
    return message.reply('You do not have permission to remove users from this ticket.');
  }
  
  // Get mentioned user
  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('Please mention a user to remove from this ticket.');
  }
  
  try {
    // Remove user from the ticket channel
    await message.channel.permissionOverwrites.delete(user.id);
    
    await message.channel.send(`${user} has been removed from this ticket.`);
  } catch (error) {
    console.error('Error removing user from ticket:', error);
    await message.reply('There was an error removing the user from this ticket.');
  }
}

// Function to handle ticket activity and track staff replies
function handleTicketActivity(message) {
  // Check if this is a ticket channel
  if (!message.channel.name.startsWith('ticket-')) {
    return;
  }
  
  // Check if this is a message from a staff member
  const isStaff = message.member.roles.cache.has(config.staffRoleId) || 
                 message.member.permissions.has(PermissionsBitField.Flags.Administrator);
  
  // Get the ticket data if this channel is being tracked
  if (activeTickets.has(message.channel.id)) {
    const ticketData = activeTickets.get(message.channel.id);
    
    if (isStaff) {
      // Mark that staff has replied
      if (!ticketData.staffReplied) {
        ticketData.staffReplied = true;
        activeTickets.set(message.channel.id, ticketData);
      }
    } else {
      // This is a user message - reset the staff replied flag and set up a new reminder
      // Clear existing reminder timeout
      if (ticketData.reminderTimeout) {
        clearTimeout(ticketData.reminderTimeout);
      }
      
      // Reset flags
      ticketData.staffReplied = false;
      ticketData.reminderSent = false;
      
      // Set a new reminder
      const category = config.categories[ticketData.categoryKey];
      ticketData.reminderTimeout = setTimeout(() => {
        sendReminderForTicket(message.channel.id);
      }, category.inactiveTimeout);
      
      // Update ticket data
      activeTickets.set(message.channel.id, ticketData);
    }
  }
}

// Function to send a reminder for inactive tickets
async function sendReminderForTicket(channelId) {
  // Get ticket data
  const ticketData = activeTickets.get(channelId);
  if (!ticketData || ticketData.staffReplied || ticketData.reminderSent) {
    return;
  }
  
  // Get the channel
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    // Channel no longer exists, clean up
    activeTickets.delete(channelId);
    return;
  }
  
  // Get the category information
  const category = config.categories[ticketData.categoryKey];
  
  // Send the reminder
  await channel.send(`<@&${category.roleId}> This ticket requires attention and has been inactive for ${category.inactiveTimeout / (60 * 1000)} minutes.`);
  
  // Mark reminder as sent
  ticketData.reminderSent = true;
  
  // Schedule another reminder if needed (for persistent tickets)
  ticketData.reminderTimeout = setTimeout(() => {
    // Reset the reminder sent flag to allow another reminder
    ticketData.reminderSent = false;
    sendReminderForTicket(channelId);
  }, category.inactiveTimeout); // Send another reminder after the same timeout period
  
  activeTickets.set(channelId, ticketData);
}

// Login the bot
client.login(process.env.TOKEN);
