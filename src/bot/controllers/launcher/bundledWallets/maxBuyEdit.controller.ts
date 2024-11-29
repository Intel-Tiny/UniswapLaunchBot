import Launches from '@/models/Launch'
import { bundledWalletsMenu } from '.'
import { checkExit, deleteMessage, deleteOldMessages, saveOldMsgIds } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)
    const { message_id } = await ctx.reply(`<b>Enter your maximum wallet buy (in %) </b>\n` + `This is the maximum amount of supply a wallet will buy in the bundle. \n` + `<i>(example: 1 or 2)</i>`, {
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

    const _value = Number(ctx.message.text)
    const { id } = ctx.scene.state
    const { maxSwap, minBuy, maxWallet, lpSupply, bundledWallets } = id.length > 1 ? await Launches.findById(id) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })

    deleteOldMessages(ctx)

    try {
        if (isNaN(_value)) throw `<b>Invalid Number\n</b> Max Wallet Buy must be a number.`
        if (_value > 100 || _value <= 0) throw `Max Wallet Buy must be greater than 0 and less than 100.`
        if (_value > maxSwap && maxSwap > 0) throw `Current MaxSwap is ${maxSwap}%. and Max Wallet Buy must be less than Max Swap.`
        if (_value > maxWallet && maxWallet > 0) throw `Current MaxWallet is ${maxSwap}%. and Max Wallet Buy must be less than MaxWallet.`
        if (_value < minBuy) throw `Current minBuy is ${minBuy}%. and Max Wallet Buy must be less than minBuy.`
        //check exceeding
        const maxValue = Math.ceil(lpSupply / bundledWallets.length)
        if (_value > maxValue) throw `<b>Your bundled wallet has been exceeded.</b>\n Your current LP supply is ${lpSupply}% and have ${bundledWallets.length} bundled wallets. So each wallet can purchase up to ${maxValue}% of tokens`

        id.length > 1 ? await Launches.findOneAndUpdate({ _id: id }, { maxBuy: _value }, { new: true }) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { maxBuy: _value }, { new: true, upsert: true })
        await ctx.scene.leave()
        bundledWalletsMenu(ctx, id)
    } catch (err) {
        await ctx.scene.leave()
        await ctx.reply(String(err), {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        
    }
}
