import { deleteMessage, deleteOldMessages } from '@/share/utils'
import { checkExit } from '@/share/utils'
import { isAddress } from 'ethers'
import { transferOwnershipConfirm } from '.'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter the address you want to give ownership to:</b>`, {
        parse_mode: 'HTML',
        reply_markup: {
            force_reply: true,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    })
    ctx.session.message_id = message_id
}

export const textHandler = async (ctx: any) => {
    const check = await checkExit(ctx)
    if (check) return
    const { id } = ctx.scene.state

    deleteMessage(ctx, ctx.session.message_id)
    deleteMessage(ctx, ctx.message.message_id)

    if (isAddress(ctx.message.text)) {
        ctx.session.newOwner = ctx.message.text
        await ctx.scene.leave()
        transferOwnershipConfirm(ctx, id)
    } else {
        const { message_id } = await ctx.reply(`<b>Invalid Address is provided:</b>`, {
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
