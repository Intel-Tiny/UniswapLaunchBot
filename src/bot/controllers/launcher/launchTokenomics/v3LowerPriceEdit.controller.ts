import Launches from '@/models/Launch'
import { launchTokenomicsMenu } from '.'
import { deleteMessage, deleteOldMessages, checkExit, saveOldMsgIds } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter the amount of InitialMarketCap</b>`+ `<i>(example: 10)</i>`, {
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
    const { upperMC } = id.length > 1 ? await Launches.findById(id) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })

    try {
        if (isNaN(_value)) throw `<b>Invalid Number</b> Lower Price should be number (percent)` + `<i>(example: 40)</i>`
        // if (_value < 1) throw `Initial MC must be greater than 1 ETH`
        if (_value > upperMC) throw `Initial MC must be lower than Upper MC`

        id.length > 1 ? await Launches.findOneAndUpdate({ _id: id }, { initMC: _value }, { new: true }) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { initMC: _value }, { new: true, upsert: true })
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
