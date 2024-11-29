import { isAddress } from 'ethers'
import { sendTokenDeployer, sendTokenWallet } from '.'
import { deleteMessage, deleteOldMessages, showNotification } from '@/share/utils'
import { checkExit } from '@/share/utils'
import Tokens from '@/models/Tokens'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)
    // wallet
    const { id } = ctx.scene.state
    const token = await Tokens.findById(id.substr(5))

    if (!token) {
        showNotification(ctx, 'No wallet for this id, Please check your current token')
        await ctx.scene.leave()
    } else {
        const { message_id } = await ctx.reply(`<b>Enter the address of one of your bundled wallets:</b>\n`, {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        ctx.session.message_id = message_id
    }
}

export const textHandler = async (ctx: any) => {
    const check = await checkExit(ctx)
    if (check) return
    const _value = ctx.message.text
    const { id } = ctx.scene.state

    deleteMessage(ctx, ctx.session.message_id)
    deleteMessage(ctx, ctx.message.message_id)

    try {
        // if its not valid ERC address
        if (!isAddress(_value)) throw `⚠ Address must be valid ETH address.`
        const token = await Tokens.findById(id.substr(5))
        // if there is no token
        if (!token) throw '⚠ Cannot find Token. Please check again'
        const bundledWallet = token.bundledWallets.find((w: { address: string; key: string }) => w.address === _value)
        // if there is no bundeld wallet
        if (!bundledWallet) throw `⚠ ${_value} is not one of your bundled wallets`
        // set sender address
        ctx.session.tokenSenderAddress = _value
        await ctx.scene.leave()
        sendTokenWallet(ctx, id)
    } catch (err: any) {
        // console.log(err)
        const { message_id } = await ctx.reply(String(err) + ' Please enter valid address', {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        ctx.session.message_id = message_id
        showNotification(ctx, String(err))
    }
}
