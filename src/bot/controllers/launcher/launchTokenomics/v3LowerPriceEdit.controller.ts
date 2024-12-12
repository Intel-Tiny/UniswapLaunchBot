import Launches from '@/models/Launch'
import { launchTokenomicsMenu } from '.'
import { deleteMessage, deleteOldMessages, checkExit, saveOldMsgIds } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter the amount of Lower Price  </b>\n` + `This is the the percent of current price. \n` + `<i>(example: 40)</i>`, {
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
    const { id } = ctx.scene.state
    const _value = Number(ctx.message.text)

    deleteOldMessages(ctx)
    deleteMessage(ctx, ctx.message.message_id)

    try {
        if (isNaN(_value)) throw `<b>Invalid Number</b> Lower Price should be number (percent)` + `<i>(example: 40)</i>`
        if (_value < 1) throw `Lower Price must be greater than 1 %`

        id.length > 1 ? await Launches.findOneAndUpdate({ _id: id }, { lowerPrice: _value }, { new: true }) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { lowerPrice: _value }, { new: true, upsert: true })
        await ctx.scene.leave()
        launchTokenomicsMenu(ctx, id)
    } catch (err) {
        const { message_id } = await ctx.reply(String(err), {
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
