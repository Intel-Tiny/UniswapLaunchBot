import Launches from '@/models/Launch'
import { bundledWalletsMenu } from '.'
import { checkExit, deleteMessage, deleteOldMessages } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { id } = ctx.scene.state
    const { maxBuy } = id.length > 1 ? await Launches.findById(id) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })
    if (maxBuy <= 0) {
        await ctx.answerCbQuery(`⚠ Invalid Max Buy\n Your current Max Buy is ${maxBuy}%, You must set Max Buy before setting Min Buy`, { show_alert: true })
        await ctx.scene.leave()
    } else {
        const { message_id } = await ctx.reply(`<b>Enter your minimum wallet buy (in %) </b>\n` + `This is the minimum amount of supply a wallet will buy in the bundle. \n` + `<i>(example: 0.5 or 1)</i>`, {
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

export const textHandler = async (ctx: any) => {
    const check = await checkExit(ctx)
    if (check) return

    const _value = Number(ctx.message.text)
    const { id } = ctx.scene.state
    const { maxBuy, lpSupply } = id.length > 1 ? await Launches.findById(id) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })

    deleteMessage(ctx, ctx.session.message_id)
    deleteMessage(ctx, ctx.message.message_id)

    try {
        if (isNaN(_value)) throw `<b>Invalid Number\n</b> Min Wallet Buy must be a number.`
        if (_value > 100 || _value < 0) throw `Min Wallet Buy must be greater than 0 and less than 100.`
        if (_value > maxBuy) throw `Min wallet Buy must be greater than 0 and less than Max Wallet Buy.`

        id.length > 1 ? await Launches.findOneAndUpdate({ _id: id }, { minBuy: _value }, { new: true }) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { minBuy: _value }, { new: true, upsert: true })
        await ctx.scene.leave()
        bundledWalletsMenu(ctx, id)
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
