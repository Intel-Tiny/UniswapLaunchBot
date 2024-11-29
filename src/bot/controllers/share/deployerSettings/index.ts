import Launches from '@/models/Launch'
import { replyWithUpdatedMessage } from '@/share/utils'

export const launch_deployers = async (ctx: any, id: string = '') => {
    const { deployer } = id.length > 1 ? await Launches.findById(id) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })

    const text =
        `<b>Deployer Settings</b>\n` +
        `Create or Link a Deployer Address to be used with GRID. \n\n` +
        `Deployer Address: <code>${deployer?.address ?? 'Unset'}</code> \n\n` +
        `<b>Create Deployer </b> – Make a new Deployer Address that will be automatically linked with your GRID. All relevant/private information will be provided to you upon Creation.\n` +
        `<b>Link Deployer  </b> – Connect an existing Wallet Address to be used as the Deployer in your BOT.\n`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: '===== DEPLOYER SETTINGS =====', callback_data: '#' }],
                [
                    { text: `✍ Create Deployer`, callback_data: `scene_tokenDeployerCreatorScene_${id}` },
                    { text: `🔗 Link Deployer`, callback_data: `scene_tokenDeployerLinkScene_${id}` }
                ],
                [{ text: '======', callback_data: '#' }],
                [
                    { text: '← Back', callback_data: `launch_socials_${id}` },
                    { text: '→ Next', callback_data: `bundled_wallets_${id}` }
                ],
                id.length > 1
                    ? [
                          { text: '✖ Cancel', callback_data: `manage_launch_${id}` },
                          { text: '✔️ Save ', callback_data: `manage_launch_${id}` }
                      ]
                    : []
            ],
            // eslint-disable-next-line prettier/prettier
            resize_keyboard: true
        },
        link_preview_options: {
            is_disabled: true
        }
    }

    replyWithUpdatedMessage(ctx, text, settings)
}
