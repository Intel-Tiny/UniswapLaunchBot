import { deleteMessage } from '@/share/utils'
import { createWallets } from '.'
import { checkExit, deleteOldMessages } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter the amount of wallets you want to create:</b>\n`, {
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
    const _value = ctx.message.text
    const { id } = ctx.scene.state

    deleteMessage(ctx, ctx.session.message_id)
    deleteMessage(ctx, ctx.message.message_id)

    if (isNaN(_value)) {
        const { message_id } = await ctx.reply(`Input must be a number.`)
        ctx.session.message_id = message_id
    } else if (Number(_value) > 40) {
        const { message_id } = await ctx.reply(`Maximum amount of wallets is 40.`)
        ctx.session.message_id = message_id
    } else {
        ctx.session.createWalletAmount = _value //or should store in db?
        await ctx.scene.leave()
        createWallets(ctx, id)
    }
}
