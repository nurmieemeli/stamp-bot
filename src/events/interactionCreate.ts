import { Events, type Interaction, type GuildMember, type TextChannel } from "discord.js";
import type { BotEvent } from "./loader";
import type { BotClient } from "../client";
import { logger } from "../utils/logger";
import { parseCustomId } from "../utils/customId";
import { openTicket, claimTicket, closeTicket, TicketError } from "../services/ticketService";
import { ticketCloseModal } from "../ui/modals/ticketCloseModal";
import { popPendingAnnouncement, buildAnnouncementEmbed } from "../services/announcementService";

async function handleChatInputCommand(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;
  const client = interaction.client as BotClient;
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error(err, `Error executing command ${interaction.commandName}`);
    const payload = { content: "Something went wrong running that command.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
}

async function handleButton(interaction: Interaction) {
  if (!interaction.isButton()) return;
  const { action } = parseCustomId(interaction.customId);
  const member = interaction.member as GuildMember;

  try {
    switch (action) {
      case "ticket-open": {
        const thread = await openTicket(interaction.guild!, member);
        await interaction.reply({ content: `Your ticket has been created: <#${thread.id}>`, ephemeral: true });
        break;
      }
      case "ticket-claim": {
        if (!interaction.channel?.isThread()) throw new TicketError("This isn't a ticket thread.");
        await claimTicket(interaction.channel, member);
        await interaction.reply({ content: "Ticket claimed.", ephemeral: true });
        break;
      }
      case "ticket-close": {
        await interaction.showModal(ticketCloseModal());
        break;
      }
      default:
        break;
    }
  } catch (err) {
    if (err instanceof TicketError) {
      await interaction.reply({ content: err.message, ephemeral: true }).catch(() => {});
      return;
    }
    logger.error(err, `Error handling button ${interaction.customId}`);
    await interaction
      .reply({ content: "Something went wrong handling that action.", ephemeral: true })
      .catch(() => {});
  }
}

async function handleModal(interaction: Interaction) {
  if (!interaction.isModalSubmit()) return;
  const { action, args } = parseCustomId(interaction.customId);
  const member = interaction.member as GuildMember;

  try {
    switch (action) {
      case "ticket-close-modal": {
        if (!interaction.channel?.isThread()) throw new TicketError("This isn't a ticket thread.");
        const reason = interaction.fields.getTextInputValue("reason") || undefined;
        await interaction.deferReply({ ephemeral: true });
        await closeTicket(interaction.channel, member, reason);
        await interaction.editReply({ content: "Ticket closed." });
        break;
      }
      case "announce-modal": {
        const token = args[0];
        const pending = token ? popPendingAnnouncement(token) : undefined;
        if (!pending) {
          await interaction.reply({
            content: "This announcement request expired. Please run /announce again.",
            ephemeral: true,
          });
          return;
        }

        const title = interaction.fields.getTextInputValue("title");
        const body = interaction.fields.getTextInputValue("body");
        const embed = buildAnnouncementEmbed({ title, body, imageUrl: pending.imageUrl, color: pending.color });

        const channel = await interaction.guild!.channels.fetch(pending.channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) {
          await interaction.reply({ content: "The target channel is no longer available.", ephemeral: true });
          return;
        }

        await (channel as TextChannel).send({
          content: pending.pingRoleId ? `<@&${pending.pingRoleId}>` : undefined,
          embeds: [embed],
          allowedMentions: pending.pingRoleId ? { roles: [pending.pingRoleId] } : { parse: [] },
        });

        await interaction.reply({ content: `Announcement posted in <#${pending.channelId}>.`, ephemeral: true });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    if (err instanceof TicketError) {
      const payload = { content: err.message, ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
      return;
    }
    logger.error(err, `Error handling modal ${interaction.customId}`);
  }
}

const event: BotEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (interaction.isChatInputCommand()) return handleChatInputCommand(interaction);
    if (interaction.isButton()) return handleButton(interaction);
    if (interaction.isModalSubmit()) return handleModal(interaction);
  },
};

export default event;
