import Launches from '@/models/Launch'
import { launchTokenomicsMenu } from '.'
import { deleteMessage, deleteOldMessages, checkExit, saveOldMsgIds } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter the amount of LP ETH  </b>\n` + `This is the amount of ETH you want your liquidity pool to start with. \n` + `<i>(example: 5 or 10)</i>`, {
        parse_mode: 'HTML',
        reply_markup: {
            force_reply: true,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    })
    
}

export const textHandler = async (ctx: any) => {
    saveOldMsgIds(ctx, ctx?.message?.message_id)
    const check = await checkExit(ctx)
    if (check) return
    const { id } = ctx.scene.state
    const _value = Number(ctx.message.text)

    deleteOldMessages(ctx)

    try {
        if (isNaN(_value)) throw `<b>Invalid Number</b> LP ETH should be number (percent)` + `<i>(example: 0.5 or 2)</i>`
        if (_value < 0.00001) throw `LP supply must be greater than 0.00001 ETH`

        id.length > 1 ? await Launches.findOneAndUpdate({ _id: id }, { lpEth: _value }, { new: true }) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { lpEth: _value }, { new: true, upsert: true })
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
        
    }
}
