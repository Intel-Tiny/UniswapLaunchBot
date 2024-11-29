import Tokens from '@/models/Tokens'
import { replyWithUpdatedMessage } from '@/share/utils'

/**
 * controller for general settings
 * @param ctx
 * @param id
 * @returns
 */
export const generalSettingsMenu = async (ctx: any, id: string) => {
    const token = await Tokens.findById(id)
    if (!token) {
        return ctx.reply('⚠ There is no token for this id')
    }
    const text =
        `<b>General Settings</b>\n` +
        `Use this menu to call basic contract function included with ${token.symbol}.\n\n` +
        `<b>Verify Contract</b> - This will verify the source code of your contract on the Blockchain.\n` +
        `<b>Enable Trading</b> - This will allow users to Swap your Token.\n\n` +
        (!token.lpAdded ? `<i>⚠ Liquidity was not been provided yet. Before you can make your token tradable, you need to add liquidity to it.</i>` : '')

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                // [token.swapEnabled ? { text: '==== Trading Already Enabled ====', callback_data: `#` } : { text: '⚡ Enable Trading', callback_data: `enable_tradingMenu_${id}` }],
                [{ text: '⚡ Enable Trading', callback_data: `enable_tradingMenu_${id}`}],
                [{ text: `🌺 Verify Contract ${token.verified ? '🟢' : '🔴'}`, callback_data: `verify_contract_${id}` }],
                [{ text: '← Back', callback_data: `manage_token_${id}` }]
            ],
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}
