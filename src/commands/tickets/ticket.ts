import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { Command } from "../../types";
import { claimTicket, closeTicket, requireTicketThread, TicketError } from "../../services/ticketService";
import { isSupportStaff } from "../../services/permissionService";
import { getTicketByThread } from "../../db/repositories/ticketRepo";

const data = new SlashCommandBuilder()
  .setName("ticket")
  .setDescription("Manage the current support ticket")
  .addSubcommand((sub) => sub.setName("claim").setDescription("Claim this ticket"))
  .addSubcommand((sub) =>
    sub
      .setName("close")
      .setDescription("Close this ticket")
      .addStringOption((opt) => opt.setName("reason").setDescription("Reason for closing"))
  )
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("Add a user to this ticket")
      .addUserOption((opt) => opt.setName("user").setDescription("User to add").setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Remove a user from this ticket")
      .addUserOption((opt) => opt.setName("user").setDescription("User to remove").setRequired(true))
  );

async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember;
  const sub = interaction.options.getSubcommand();

  try {
    const thread = requireTicketThread(interaction);

    switch (sub) {
      case "claim": {
        await claimTicket(thread, member);
        await interaction.reply({ content: "Ticket claimed.", flags: MessageFlags.Ephemeral });
        break;
      }
      case "close": {
        const reason = interaction.options.getString("reason") ?? undefined;
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        await closeTicket(thread, member, reason);
        await interaction.editReply({ content: "Ticket closed." });
        break;
      }
      case "add": {
        if (!(await isSupportStaff(member))) {
          await interaction.reply({ content: "You don't have permission to do that.", flags: MessageFlags.Ephemeral });
          return;
        }
        const user = interaction.options.getUser("user", true);
        await thread.members.add(user.id);
        await interaction.reply({ content: `Added <@${user.id}> to the ticket.`, flags: MessageFlags.Ephemeral });
        break;
      }
      case "remove": {
        if (!(await isSupportStaff(member))) {
          await interaction.reply({ content: "You don't have permission to do that.", flags: MessageFlags.Ephemeral });
          return;
        }
        const user = interaction.options.getUser("user", true);
        const ticket = await getTicketByThread(thread.id);
        if (ticket?.openerId === user.id) {
          await interaction.reply({ content: "You can't remove the ticket opener.", flags: MessageFlags.Ephemeral });
          return;
        }
        await thread.members.remove(user.id);
        await interaction.reply({ content: `Removed <@${user.id}> from the ticket.`, flags: MessageFlags.Ephemeral });
        break;
      }
    }
  } catch (err) {
    if (err instanceof TicketError) {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: err.message });
      } else {
        await interaction.reply({ content: err.message, flags: MessageFlags.Ephemeral });
      }
      return;
    }
    throw err;
  }
}

const command: Command = { data, execute };
export default command;
