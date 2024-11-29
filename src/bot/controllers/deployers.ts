import Tokens from '@/models/Tokens'
import { replyWithUpdatedMessage } from '@/share/utils'

/**
 * tokens menu
 * @param ctx
 */
export const menu = async (ctx: any) => {
    try {
        ctx.session.tagTitle = 'deployers'
        const text = `<b>Deployers</b>\n` + `Select a token to manage deployers for. You can mange several settings including ETH balance\n`

        const tokens = await Tokens.find({ userId: ctx.chat.id })

        const buttons = []

        for (let i = 0; i < tokens.length; i += 2) {
            const element =
                i + 1 >= tokens.length
                    ? [{ text: tokens[i].name, callback_data: `manage_deployer_token${tokens[i].id}` }]
                    : [
                          { text: tokens[i].name, callback_data: `manage_deployer_token${tokens[i].id}` },
                          { text: tokens[i + 1].name, callback_data: `manage_deployer_token${tokens[i + 1].id}` }
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
    } catch (err) {
        console.log(err)
    }
}
