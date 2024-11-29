import Launches from '@/models/Launch'
import { launchTokenomicsMenu } from '.'
import { deleteMessage, deleteOldMessages, checkExit, saveOldMsgIds } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter the amount of LP Supply (in %) </b>\n` + `This is the amount of supply that you want to be in the liquidity pool. \n` + `<i>(example: 75 or 100)</i>`, {
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
    const { contractFunds, maxWallet } = id.length > 1 ? await Launches.findById(id) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })

    deleteOldMessages(ctx)

    const _value = Number(ctx.message.text)

    try {
        if (isNaN(_value)) throw `<b>Invalid Number</b> LP supply should be number (percent)` + `<i>(example: 75 or 100)</i>`
        if (_value <= 0) throw `LP supply must be greater than 0`
        if (_value + contractFunds > 100) throw `LP Supply + Contract Funds cannot be greater than 100.`
        if (_value < maxWallet) throw `Your current maxWallet is <code>${maxWallet}%</code>. LpSupply must be greater than maxWallet.`

        id.length > 1 ? await Launches.findOneAndUpdate({ _id: id }, { lpSupply: _value }, { new: true }) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { lpSupply: _value }, { new: true, upsert: true })
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
