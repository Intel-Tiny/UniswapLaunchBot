import Launches from '@/models/Launch'
import { launchVariablesMenu } from '@/bot/controllers/launcher/launchVariables/index'
import { deleteMessage, deleteOldMessages } from '@/share/utils'
import { checkExit } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)
    const { message_id } = await ctx.reply(`<b>Enter your maximum swap (in %) </b>\n` + `This is the maximum amount of supply that can be bought in one transaction. \n` + `<i>(example: 0.5 or 1)</i>`, {
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
    const _value = Number(ctx.message.text)
    const { id } = ctx.scene.state
    const { maxWallet, maxBuy } = id.length > 1 ? await Launches.findById(id) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })

    deleteMessage(ctx, ctx.session.message_id)
    deleteMessage(ctx, ctx.message.message_id)

    try {
        if (_value < 0 || _value > 100 || isNaN(_value)) throw `<b>Invalid Max Swap\n</b> It should be between 0 and 100 (percent)` + `<i>(example: 1 or 5)</i>`
        if (_value > maxWallet && maxWallet > 0) throw `<b>Invalid Max Swap\n</b> Your Max Wallet is ${maxWallet}%, and maxSwap must less than Max Wallet`
        if (_value < maxBuy && _value > 0) throw `<b>Invalid Max Swap\n</b> Your MaxBuy for bundled wallet is ${maxBuy}%. MaxSwap must greater than MaxBuy for bundled wallets`

        id.length > 1 ? await Launches.findOneAndUpdate({ _id: id }, { maxSwap: _value }, { new: true }) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { maxSwap: _value }, { new: true, upsert: true })
        await ctx.scene.leave()
        launchVariablesMenu(ctx, id)
    } catch (err) {
        const { message_id } = await ctx.reply(String(err), {
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
