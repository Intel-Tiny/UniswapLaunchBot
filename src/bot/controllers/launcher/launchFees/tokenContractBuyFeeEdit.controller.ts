import Launches from '@/models/Launch'
import { launchFeesMenu } from '.'
import { deleteMessage, deleteOldMessages, checkExit, saveOldMsgIds } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter your buy fee</b>\n` + `The fee you take on all token buys. . \n` + `<i>(example: 2 or 3)</i>`, {
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
    const _value = Number(ctx.message.text)
    const { id } = ctx.scene.state
    const { liquidityFee } = id.length > 1 ? await Launches.findById(id) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })

    deleteOldMessages(ctx)
    deleteMessage(ctx, ctx.message.message_id)


    if (isNaN(_value)) {
        const { message_id } = await ctx.reply(`<b>Invalid Number</b> Buy Fee should be number (percent)` + `<i>(example: 2 or 3)</i>`, {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        saveOldMsgIds(ctx, message_id)
    } else if (_value > 100 || _value < 0) {
        const { message_id } = await ctx.reply(`Buy Fee must be greater than 0 and less than 100.`, {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        saveOldMsgIds(ctx, message_id)
    } else if (_value + liquidityFee >= 100) {
        const { message_id } = await ctx.reply(`LiquidityFee + BuyFee must be less than 100.`, {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        saveOldMsgIds(ctx, message_id)
    } else {
        id.length > 1 ? await Launches.findOneAndUpdate({ _id: id }, { buyFee: _value }, { new: true }) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { buyFee: _value }, { new: true, upsert: true })
        await ctx.scene.leave()
        launchFeesMenu(ctx, id)
    }
    
}
