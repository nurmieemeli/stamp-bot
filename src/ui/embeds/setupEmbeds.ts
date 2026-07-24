import { EmbedBuilder } from "discord.js";
import type { HealthField } from "../../services/configHealthService";
import { BRAND_COLOR } from "../../utils/theme";

export function setupEmbed(fields: HealthField[]) {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle("Server setup")
    .setDescription(
      "Pick a channel or role from each menu below — selections save immediately, no submit button needed. Clear a menu's selection to unset that field."
    )
    .addFields(fields)
    .setFooter({ text: "Log channels can also be set individually via /config set-log-channel" });
}
