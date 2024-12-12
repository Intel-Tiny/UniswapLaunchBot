import { isAddress } from 'ethers'
import { sendEthWallet } from '.'
import { deleteMessage, deleteOldMessages, saveOldMsgIds } from '@/share/utils'
import { checkExit } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter the address you want to send to:</b>\n`, {
        parse_mode: 'HTML',
        reply_markup: {
            force_reply: true,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    })
    saveOldMsgIds(ctx, message_id)
}

export const textHandler = async (ctx: any) => {
    const check = await checkExit(ctx)
    if (check) return
    const _value = ctx.message.text
    const { id } = ctx.scene.state

    deleteOldMessages(ctx)
    deleteMessage(ctx, ctx.message.message_id)

    if (isAddress(_value)) {
        ctx.session.ethReceiveAddress = _value
        await ctx.scene.leave()
        sendEthWallet(ctx, id)
    } else {
        const { message_id } = await ctx.reply(`⚠ Address must be valid ETH address.`, {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        saveOldMsgIds(ctx, message_id)
    }
}
