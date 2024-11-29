import { burnLiquidityMenu } from '.'
import { checkExit, deleteMessage, deleteOldMessages } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter the amount of LP Supply (in %) you want to burn. </b>\n` + `(example: 75 or 100). . \n`, {
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
    const value = Number(ctx.message.text)
    const { id } = ctx.scene.state

    deleteMessage(ctx, ctx.session.message_id)
    deleteMessage(ctx, ctx.message.message_id)

    if (isNaN(value)) {
        const { message_id } = await ctx.reply(`<b>Invalid Number</b> LP burn percentage should be number (percent)` + `<i>(example: 75 or 100)</i>`, {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        ctx.session.message_id = message_id
    } else if (value > 100 || value <= 0) {
        const { message_id } = await ctx.reply(`LP burn percentage must be greater than 0 and less than 100.`, {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        ctx.session.message_id = message_id
    } else {
        ctx.session.burnPercentage = value
        await ctx.scene.leave()
        burnLiquidityMenu(ctx, id)
    }
}
