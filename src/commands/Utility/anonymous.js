import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import { getGuildConfig, setGuildConfig } from '../../services/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('anonymous')
    .setDescription('Send an anonymous message through the bot')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Optional channel to receive anonymous messages (admins only)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  category: 'Utility',

  async execute(interaction, config, client) {
    try {
      const targetChannelId = interaction.options.getChannel('channel')?.id || (await getGuildConfig(client, interaction.guildId, { source: 'anonymous_command' })).anonymousChannelId || client?.config?.bot?.anonymousDmChannelId || process.env.ANONYMOUS_DM_CHANNEL_ID || null;

      if (interaction.options.getChannel('channel')) {
        const selectedChannel = interaction.options.getChannel('channel');
        await setGuildConfig(client, interaction.guildId, {
          anonymousChannelId: selectedChannel.id,
        }, { source: 'anonymous_command' });
      }

      if (!targetChannelId) {
        await InteractionHelper.safeReply(interaction, {
          content: 'Anonymous message routing is not configured yet. Please contact the bot owner.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const promptEmbed = createEmbed({
        title: '🕵️ Anonymous Message Composer',
        description: 'Type your anonymous message in this channel. You can use Discord markdown, code blocks, and attachments. Your next message will be previewed and then sent anonymously to staff.',
        color: 'info',
      });

      const components = [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`anonymous-confirm-${interaction.user.id}`)
            .setLabel('Confirm Send')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`anonymous-cancel-${interaction.user.id}`)
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger),
        ),
      ];

      await InteractionHelper.safeReply(interaction, {
        embeds: [promptEmbed],
        components,
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
          const hasAttachments = (message.attachments?.size || 0) > 0;
          if (!content && !hasAttachments) {
            await InteractionHelper.safeReply(interaction, {
              content: 'Your message was empty. Please run the command again and send a non-empty message or an attachment.',
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          const confirmationEmbed = createEmbed({
            title: '🕵️ Confirm Anonymous Send',
            description: content ? `**Preview:**\n${content}` : 'Attachment-only anonymous message',
            color: 'warning',
          });

          const confirmationComponents = [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`anonymous-confirm-${interaction.user.id}`)
                .setLabel('Send')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`anonymous-cancel-${interaction.user.id}`)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger),
            ),
          ];

          const confirmationMessage = await interaction.followUp({
            embeds: [confirmationEmbed],
            components: confirmationComponents,
            flags: MessageFlags.Ephemeral,
          });

          const confirmationCollector = confirmationMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (buttonInteraction) => buttonInteraction.user.id === interaction.user.id,
            max: 1,
            time: 120_000,
          });

          confirmationCollector.on('collect', async (buttonInteraction) => {
            try {
              await buttonInteraction.deferUpdate();

              if (buttonInteraction.customId.startsWith('anonymous-cancel')) {
                await confirmationMessage.edit({
                  embeds: [createEmbed({ title: '❌ Anonymous Send Cancelled', description: 'Your anonymous message was not sent.', color: 'error' })],
                  components: [],
                }).catch(() => {});
                return;
              }

              const targetChannel = await client.channels.fetch(targetChannelId).catch(() => null);
              if (!targetChannel || typeof targetChannel.send !== 'function') {
                await interaction.followUp({
                  content: 'Unable to forward the anonymous message. The target channel is missing or unavailable.',
                  flags: MessageFlags.Ephemeral,
                });
                return;
              }

              const forwardedAttachments = Array.from(message.attachments?.values?.() || []);
              const headerText = client.config?.bot?.anonymousStaffHeader || '📥 Anonymous Message';
              const previewText = content ? `${headerText}\n\n${content}` : headerText;

              await targetChannel.send({
                content: previewText,
                embeds: [createEmbed({ title: '📥 Anonymous Message', description: content || 'Attachment-only anonymous message', color: 'warning' })],
                files: forwardedAttachments,
                allowedMentions: { parse: [] },
              });

              await message.delete().catch(() => {});

              await confirmationMessage.edit({
                embeds: [createEmbed({ title: '✅ Anonymous Message Sent', description: 'Your anonymous message has been forwarded to the staff channel.', color: 'success' })],
                components: [],
              }).catch(() => {});
            } catch (error) {
              logger.error('Error handling anonymous confirmation:', error);
              await interaction.followUp({
                content: 'An error occurred while forwarding your anonymous message.',
                flags: MessageFlags.Ephemeral,
              });
            }
          });

          confirmationCollector.on('end', async (_collected, reason) => {
            if (reason === 'time') {
              await confirmationMessage.edit({
                embeds: [createEmbed({ title: '⏱ Confirmation Expired', description: 'The anonymous send confirmation expired.', color: 'warning' })],
                components: [],
              }).catch(() => {});
            }
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
