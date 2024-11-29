import { CHAINS, CHAIN_ID } from '@/config/constant'
import Tokens from '@/models/Tokens'
import { replyWithUpdatedMessage, verifyContract } from '@/share/utils'
import { Markup } from 'telegraf'

/**
 * controller for contract verification
 * @param ctx
 * @param id
 */
export const contractVerification = async (ctx: any, id: string) => {
    const chainId = CHAIN_ID
    const CHAIN = CHAINS[CHAIN_ID]
    const _token = await Tokens.findById(id)
    if (!_token) {
        ctx.reply('⚠ There is no token for this id')
    } else if (_token.verified) {
        replyWithUpdatedMessage(ctx, `💬 The contract has already been verified. You can find verified contract source code on <a href='${CHAIN.explorer}/address/${_token.address}'>EtherscanOrg</a>`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[{ text: '← Back', callback_data: `manage_token_${id}` }]],
                resize_keyboard: true
            }
        })
    } else {
        const symbol = _token.symbol.replace(/\s/g, '')

        const { status, message } = await verifyContract(_token.address, _token.sourceCode, symbol, chainId)

        if (status === 'success') {
            await Tokens.findByIdAndUpdate(id, { verified: true })
            replyWithUpdatedMessage(ctx, `🌺 <code>${_token.symbol}</code> has been verified successfully on Etherscan\nAddress: <code>${_token.address}</code>`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[Markup.button.url(`👁 View Here`, `${CHAIN.explorer}/address/${_token.address}`)], [{ text: '← Back', callback_data: `manage_token_${id}` }]],
                    resize_keyboard: true
                }
            })
        } else {
            if (message === 'Contract source code already verified' && !_token.verified) {
                await Tokens.findByIdAndUpdate(id, { verified: true })
            }
            replyWithUpdatedMessage(ctx, `💬 ${message}`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '← Back', callback_data: `manage_token_${id}` }]],
                    resize_keyboard: true
                }
            })
        }
    }
}
