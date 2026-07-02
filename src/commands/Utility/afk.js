import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { getFromDb, setInDb, deleteFromDb, getAFKKey } from '../../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set or remove your AFK status')
    .setDMPermission(true)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Set your AFK status with a reason')
        .addStringOption((option) =>
          option
            .setName('reason')
            .setDescription('Why are you AFK?')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove your AFK status')
    ),

  async execute(interaction) {
    try {
      const deferSuccess = await InteractionHelper.safeDefer(interaction);
      if (!deferSuccess) {
        logger.warn(`AFK interaction defer failed`, {
          userId: interaction.user.id,
          guildId: interaction.guildId,
          commandName: 'afk'
        });
        return;
      }

      const subcommand = interaction.options.getSubcommand();
      const guildId = interaction.guildId;
      const userId = interaction.user.id;
      const afkKey = getAFKKey(guildId, userId);

      if (subcommand === 'set') {
        const reason = interaction.options.getString('reason');

        const afkData = {
          userId,
          guildId,
          reason,
          setAt: new Date().toISOString(),
        };

        await setInDb(afkKey, afkData);

        const embed = createEmbed({
          title: '✅ AFK Status Set',
          description: `You are now AFK with the reason: **${reason}**`
        });

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        
        logger.info(`AFK status set`, {
          userId,
          guildId,
          reason
        });

      } else if (subcommand === 'remove') {
        await deleteFromDb(afkKey);

        const embed = createEmbed({
          title: '✅ AFK Status Removed',
          description: 'Welcome back! Your AFK status has been cleared.'
        });

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        
        logger.info(`AFK status removed`, {
          userId,
          guildId
        });
      }
    } catch (error) {
      logger.error(`AFK command execution failed`, {
        error: error.message,
        stack: error.stack,
        userId: interaction.user.id,
        guildId: interaction.guildId,
        commandName: 'afk'
      });

      const errorEmbed = createEmbed({
        title: '❌ Error',
        description: 'Failed to update AFK status. Please try again.'
      });

      try {
        await InteractionHelper.safeEditReply(interaction, { embeds: [errorEmbed] });
      } catch (replyError) {
        logger.error('Failed to send error reply:', replyError);
      }
    }
  }
};
