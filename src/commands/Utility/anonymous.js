import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
  data: new SlashCommandBuilder()
    .setName('anonymous')
    .setDescription('Send an anonymous message through the bot')
    .setDMPermission(false),

  category: 'Utility',

  async execute(interaction, config, client) {
    try {
      const targetChannelId = client.config?.bot?.anonymousDmChannelId;
      if (!targetChannelId) {
        await InteractionHelper.safeReply(interaction, {
          content: 'Anonymous message routing is not configured yet. Please contact the bot owner.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await InteractionHelper.safeReply(interaction, {
        content: 'Please type your anonymous message in this channel. Your next message will be forwarded anonymously to staff and then deleted from this channel if possible.',
        flags: MessageFlags.Ephemeral,
      });

      const filter = (message) => message.author.id === interaction.user.id && !message.author.bot;
      const collector = interaction.channel.createMessageCollector({
        filter,
        max: 1,
        time: 300_000,
      });

      collector.on('collect', async (message) => {
        try {
          const content = message.content?.trim();
          if (!content) {
            await InteractionHelper.safeReply(interaction, {
              content: 'Your message was empty. Please run the command again and send a non-empty message.',
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          const targetChannel = await client.channels.fetch(targetChannelId).catch(() => null);
          if (!targetChannel || typeof targetChannel.send !== 'function') {
            await InteractionHelper.safeReply(interaction, {
              content: 'Unable to forward the anonymous message. The target channel is missing or unavailable.',
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          await targetChannel.send({
            content,
            allowedMentions: { parse: [] },
          });

          await message.delete().catch(() => {});

          const successEmbed = createEmbed({
            title: '✅ Anonymous Message Sent',
            description: 'Your anonymous message has been forwarded to the staff channel.',
            color: 'success',
          });

          await InteractionHelper.safeReply(interaction, {
            embeds: [successEmbed],
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          logger.error('Error forwarding anonymous message:', error);
          await InteractionHelper.safeReply(interaction, {
            content: 'An error occurred while forwarding your anonymous message.',
            flags: MessageFlags.Ephemeral,
          });
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
          await InteractionHelper.safeReply(interaction, {
            content: '⏱ You did not send a message in time. Please run the command again when you are ready.',
            flags: MessageFlags.Ephemeral,
          });
        }
      });
    } catch (error) {
      logger.error('anonymous command execution failed:', error);
      await handleInteractionError(interaction, error, {
        commandName: 'anonymous',
        source: 'anonymous_command',
      });
    }
  },
};
