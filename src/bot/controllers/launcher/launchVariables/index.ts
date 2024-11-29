import Launches from '@/models/Launch'
import { formatNumber, replyWithUpdatedMessage } from '@/share/utils'

/**
 * Launch Varaible Settings
 * @param ctx
 */
export const launchVariablesMenu = async (ctx: any, id: string = '') => {
    try {
        const { name, symbol, totalSupply, maxSwap, maxWallet, blacklistCapability } = id.length > 1 ? await Launches.findById(id) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })

        const text =
            `<b>Launch Creation in Progress…</b>\n` +
            `Fill in the required launch parameters for your token.\n\n` +
            `<b>Name </b> –  The Full Name of your ERC-20 token.\n` +
            `<b>Symbol </b> – The Ticker of your ERC-20 token.\n` +
            `<b>Max Buy </b> – The largest amount of tokens that can be purchased in a single transaction.\n` +
            `<b>Max Wallet </b> – The largest number of tokens that can be held in a single wallet.\n`

        const inlineKeyboard =
            id.length > 1
                ? [
                      [{ text: '===== LAUNCH VARIABLES =====', callback_data: '#' }],
                      [
                          { text: `✏ ${name}`, callback_data: `scene_tokenNameEditScene_${id}` },
                          { text: `💲 ${symbol}`, callback_data: `scene_tokenSymbolEditScene_${id}` }
                      ],
                      [{ text: `🗳 ${formatNumber(totalSupply)}`, callback_data: `scene_tokenSupplyEditScene_${id}` }],
                      [
                          { text: `${maxWallet ? '🟢' : '🔴'} Max Wallet ${maxWallet}%`, callback_data: `scene_tokenMaxWalletEditScene_${id}` },
                          { text: `${maxSwap ? '🟢' : '🔴'} Max Swap ${maxSwap}%`, callback_data: `scene_tokenMaxSwapEditScene_${id}` }
                      ],
                      [{ text: `${blacklistCapability ? '🟢' : '🔴'} Blacklist Capability`, callback_data: `blacklistCapability_${id}` }],
                      [{ text: '======', callback_data: '#' }],
                      [
                          { text: '← Back', callback_data: `launch_tokenomics_${id}` },
                          { text: 'Next →', callback_data: `launch_fees_${id}` }
                          //   { text: 'Next →', callback_data: `launch_tokenomics_${id}` }
                      ],
                      [
                          { text: '✖ Cancel', callback_data: `manage_launch_${id}` },
                          { text: '✔️ Save ', callback_data: `manage_launch_${id}` }
                      ]
                  ]
                : [
                      [{ text: '===== LAUNCH VARIABLES =====', callback_data: '#' }],
                      [
                          { text: `✏ ${name}`, callback_data: 'scene_tokenNameEditScene_' },
                          { text: `💲 ${symbol}`, callback_data: 'scene_tokenSymbolEditScene_' }
                      ],
                      [{ text: `🗳 ${formatNumber(totalSupply)}`, callback_data: 'scene_tokenSupplyEditScene_' }],
                      [
                          { text: `${maxWallet ? '🟢' : '🔴'} Max Wallet ${maxWallet}%`, callback_data: 'scene_tokenMaxWalletEditScene_' },
                          { text: `${maxSwap ? '🟢' : '🔴'} Max Swap ${maxSwap}%`, callback_data: 'scene_tokenMaxSwapEditScene_' }
                      ],
                      [{ text: `${blacklistCapability ? '🟢' : '🔴'} Blacklist Capability`, callback_data: 'blacklistCapability_' }],
                      [{ text: '======', callback_data: '#' }],
                      [
                          { text: '← Back', callback_data: `launch_tokenomics_${id}` },
                          { text: 'Next →', callback_data: `launch_fees_${id}` }
                      ]
                  ]
        const settings = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: inlineKeyboard,
                resize_keyboard: true
            },
            link_preview_options: {
                is_disabled: true
            }
        }
        replyWithUpdatedMessage(ctx, text, settings)
    } catch (err) {
        console.log('error::launch variables')
    }
}
