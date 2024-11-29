import Launches from '@/models/Launch'
import { replyWithUpdatedMessage } from '@/share/utils'

/**
 * Launch Varaible Settings
 * @param ctx
 */
export const launchSocialsMenu = async (ctx: any, id: string = '') => {
    const { website, twitter, telegram, custom } = id.length > 1 ? await Launches.findById(id) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })

    const text =
        `<b>Launch Creation in Progress…</b>\n` +
        `If you wish for your socials to be present at the top of your contract fill them in here.\n\n` +
        `<b>Website </b> – Your website URL.\n` +
        `<b>X/Twitter </b> – Your X/Twitter profile URL.\n` +
        `<b>Telegram </b> – The Telegram chat/portal of your project.\n` +
        `<b>Custom </b> – This is any additional text you want in the comment box.\n` +
        `It will be added after that last social link. You can also use this instead of the socials.`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: '===== SOCIAL SETTINGS =====', callback_data: '#' }],
                [
                    { text: `🌐 Website: ${website}`, callback_data: `scene_tokenWebsiteEditScene_${id}` },
                    { text: `✖ X/Twitter: ${twitter}`, callback_data: `scene_tokenTwitterEditScene_${id}` }
                ],
                [
                    { text: `🗨 Telegram: ${telegram}`, callback_data: `scene_tokenTelegramEditScene_${id}` },
                    { text: `✏ Custom: ${custom}`, callback_data: `scene_tokenCustomEditScene_${id}` }
                ],
                [{ text: '======', callback_data: '#' }],
                [
                    { text: '← Back', callback_data: `launch_fees_${id}` },
                    { text: 'Next →', callback_data: `launch_deployers_${id}` }
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
