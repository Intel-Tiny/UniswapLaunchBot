import { checkExit, deleteMessage, deleteOldMessages } from '@/share/utils'
import { udpateFeesMenu } from '.'
import Tokens from '@/models/Tokens'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter your Liquidity fee</b>\n` + `The fee that is added to the liquidity pool. \n` + `<i>(example: 2 or 3)</i>`, {
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

    const { id } = ctx.scene.state
    const { buyFee, sellFee } = await Tokens.findOne({ _id: id })

    const _value = Number(ctx.message.text)

    deleteMessage(ctx, ctx.session.message_id)
    deleteMessage(ctx, ctx.message.message_id)

    if (buyFee === 0 && sellFee === 0) {
        const { message_id } = await ctx.reply(`You must either have a buy or sell fee before you can set your liquidity fee.`)
        ctx.session.message_id = message_id
        await ctx.scene.leave()
        udpateFeesMenu(ctx, id)
    } else if (isNaN(_value)) {
        const { message_id } = await ctx.reply(`<b>Invalid Number</b> Liquidity Fee should be number (percent)` + `<i>(example: 2 or 3)</i>`, {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        ctx.session.message_id = message_id
    } else if (_value > 100 || _value < 0) {
        const { message_id } = await ctx.reply(`Liquidity Fee must be greater than 0 and less than 100.`, {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        ctx.session.message_id = message_id
    } else if (_value + buyFee >= 100 || _value + sellFee >= 100) {
        const { message_id } = await ctx.reply(`LiquidityFee + BuyFee or FeeLiquidityFee + SellFee must be less than 100.`, {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        ctx.session.message_id = message_id
    } else {
        await Tokens.findOneAndUpdate({ _id: id }, { liquidityFee: _value }, { new: true })
        await ctx.scene.leave()
        udpateFeesMenu(ctx, id)
    }
}
