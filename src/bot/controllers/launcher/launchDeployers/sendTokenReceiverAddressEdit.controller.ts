import { isAddress } from 'ethers'
import { sendEth, sendToken } from '.'
import { deleteMessage, deleteOldMessages, checkExit, saveOldMsgIds } from '@/share/utils'

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
    saveOldMsgIds(ctx, ctx?.message?.message_id)
    const check = await checkExit(ctx)
    if (check) return
    const _value = ctx.message.text
    const { id } = ctx.scene.state

    deleteOldMessages(ctx)
    deleteMessage(ctx, ctx.message.message_id)


    if (isAddress(_value)) {
        ctx.session.tokenReceiverAddress = _value
        await ctx.scene.leave()
        sendToken(ctx, id)
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
