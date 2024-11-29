import Launches from '@/models/Launch'
import Tokens from '@/models/Tokens'
import { replyWithUpdatedMessage } from '@/share/utils'

/**
 * tokens menu
 * @param ctx
 */
export const menu = async (ctx: any) => {
    ctx.session.tagTitle = 'wallets'
    const text = `<b>Bundled Wallets</b>\n` + `Select a token to manage Bundled Wallets for. This allow you to manage bundled wallets for your token\n`

    const tokens = await Tokens.find({ userId: ctx.chat.id })
    let buttons = []

    for (let i = 0; i < tokens.length; i += 2) {
        const element =
            i + 1 >= tokens.length
                ? [{ text: `🪂 ${tokens[i].name}`, callback_data: `manage_wallets_token${tokens[i].id}` }]
                : [
                      { text: `🪂 ${tokens[i].name}`, callback_data: `manage_wallets_token${tokens[i].id}` },
                      { text: `🪂 ${tokens[i + 1].name}`, callback_data: `manage_wallets_token${tokens[i + 1].id}` }
                  ]
        buttons.push(element)
    }

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [tokens.length === 0 ? [{ text: '=== No Tokens You Have Deployed ===', callback_data: '#' }] : [], ...buttons, [{ text: '← back', callback_data: 'start' }]],
            resize_keyboard: true
        }
    }

    replyWithUpdatedMessage(ctx, text, settings)
}
