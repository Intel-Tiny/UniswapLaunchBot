import Launches from '@/models/Launch'
import { formatNumber, replyWithUpdatedMessage } from '@/share/utils'

export const launchTokenomicsMenu = async (ctx: any, id: string = '') => {
    const { lpSupply, lpEth, contractFunds, totalSupply } = id.length > 1 ? await Launches.findById(id) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })

    const text =
        `<b>Launch Creation in Progress…</b>\n` +
        `Set your Initial Liquidity below.\n` +
        `This will determine the Initial Price for your token.\n\n` +
        `<b>LP Tokens </b> –  The amount of your token that you would like to deposit into the Initial Liquidity Pool.\n` +
        `<b>LP ETH  </b> – The amount of ETH that will be added to the Initial Liquidity Pool.\n` +
        `<b>Contract Funds </b> – Tokens that will be minted directly into the contract's wallet. These will be used for tax.\n` +
        `<b>Anti-Drain </b> – A system that attempts to prevent the contract funds from being drained by malicious bots.\n`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: '===== TOKEN DISTRIBUTION =====', callback_data: '#' }],
                [
                    { text: `📦 LP Supply ${formatNumber(totalSupply * lpSupply * 0.01)} (${lpSupply}%)`, callback_data: `scene_tokenLpSupplyEditScene_${id}` },
                    {
                        text: `🥢 LP ETH ${new Intl.NumberFormat('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6
                        }).format(lpEth)}`,
                        callback_data: `scene_tokenLpEthEditScene_${id}`
                    }
                ],
                [{ text: `💳 Contract Funds ${formatNumber(totalSupply * contractFunds * 0.01)}`, callback_data: `scene_tokenFundsEditScene_${id}` }],
                [{ text: '======', callback_data: '#' }],
                [
                    { text: '← Back', callback_data: `launch_settings_${id}` },
                    { text: 'Next →', callback_data: `launch_variables_${id}` }
                ],
                id.length > 1
                    ? [
                          { text: '✖ Cancel', callback_data: `manage_launch_${id}` },
                          { text: '✔️ Save ', callback_data: `manage_launch_${id}` }
                      ]
                    : []
            ],
            resize_keyboard: true
        },
        link_preview_options: {
            is_disabled: true
        }
    }

    replyWithUpdatedMessage(ctx, text, settings)
}
