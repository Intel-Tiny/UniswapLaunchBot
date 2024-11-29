import { Markup } from 'telegraf'
import { CHAINS, CHAIN_ID } from '@/config/constant'
import { replyWithUpdatedMessage, verifyContract } from '@/share/utils'
import Tokens from '@/models/Tokens'

export const menu = async (ctx: any) => {
    const tokens = await Tokens.find({ userId: ctx.chat.id })
    const text = `<b>Manage Token</b>\n` + `Select a Token that you have launched. You can manage several token settings including liquidity, fee and trading...`
    const buttons = []
    for (let i = 0; i < tokens.length; i += 2) {
        const element =
            i + 1 >= tokens.length
                ? [{ text: `🪂 ${tokens[i].name}`, callback_data: `manage_token_${tokens[i].id}` }]
                : [
                      { text: `🪂 ${tokens[i].name}`, callback_data: `manage_token_${tokens[i].id}` },
                      { text: `🪂 ${tokens[i + 1].name}`, callback_data: `manage_token_${tokens[i + 1].id}` }
                  ]
        buttons.push(element)
    }
    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [tokens.length === 0 ? [{ text: '=== No Tokens You Have Launched ===', callback_data: '#' }] : [], ...buttons, [{ text: '← back', callback_data: 'start' }]],
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

/**
 * controller token detail page
 * @param ctx
 * @param id
 * @returns
 */
export const detail = async (ctx: any, id: string) => {
    const _token = await Tokens.findById(id)
    if (!_token) {
        return ctx.reply('⚠ There is no token for this id')
    }
    const text =
        `<b>Managing</b> <code>$${_token.symbol}</code>\n` +
        `Here you are able to interact with all aspects of your Launch.\n` +
        `Please check out the docs for more detailed explanations of the functions.\n\n` +
        `Contract Address:\n` +
        `<code>${_token.address}</code>\n` +
        `<b>General Settings</b> - Overall contract functionality, perform tasks such as Verifying your Contract.\n` +
        `<b>Limits Settings</b> - Change the Limits that are imposed on the Swaps for your contract, Disable All Limits, Holding Limits, and Swap Limits.\n` +
        `<b>Fees Settings</b> - Change the Fees that are taken on Swap transactions and the Threshold that your Tax will be sold.\n` +
        `<b>Ownership Settings</b> - All functions that are related to the Ownership of the contract, choose to either Renounce the Contract or Transfer Ownership.\n` +
        // `<b>Safety Functions</b> - If any funds are stuck in the contract, Transfer Stuck ETH and Transfer Stuck Tokens are available through this menu.\n` +
        `<b>Liquidity Management</b> - Add or Remove Liquidity from your contract.\n`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: '⚙ General Settings', callback_data: `general_settings_${id}` }],
                _token.bundledWallets.length > 0 ? [{ text: '🎯 Bundled Wallets', callback_data: `manage_wallets_token${id}` }] : [],
                [
                    { text: '⛔ Limits Settings', callback_data: `limits_settings_${id}` },
                    { text: '💱 Fees Settings', callback_data: `fees_settings_${id}` }
                ],
                [
                    { text: '👑 Ownership Settings', callback_data: `ownership_settings_${id}` }
                    // { text: '🧱 Safety Functions', callback_data: `safty_functions_${id}` }
                ],
                [{ text: '💧 Liquidity Management', callback_data: `lp_settings_${id}` }],
                [{ text: '← Back', callback_data: `tokens` }]
            ],
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}


