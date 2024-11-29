import { deleteMessage } from '@/share/utils'
import { updateFeeThresholdMenu } from '.'
import { checkExit, deleteOldMessages } from '@/share/utils'
import Tokens from '@/models/Tokens'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter your swap threshold (in %) </b>\n` + `This is the amount of supply that needs to be in the contract address before it will swap for ETH.\n` + `<i>(example: 5 or 10)</i>`, {
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

    deleteMessage(ctx, ctx.session.message_id)
    deleteMessage(ctx, ctx.message.message_id)

    if (isNaN(_value)) {
        const { message_id } = await ctx.reply(`<b>Invalid Number</b> Swap threshold should be number (percent)` + `<i>(example: 0.1 or 1)</i>`, {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        ctx.session.message_id = message_id
    } else if (_value > 2 || _value < 0.001) {
        const { message_id } = await ctx.reply(`Swap Threshold must be greater than 0.001% and less than 2%.`, {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        ctx.session.message_id = message_id
    } else {
        await Tokens.findOneAndUpdate({ _id: id }, { swapThreshold: _value }, { new: true })
        await ctx.scene.leave()
        updateFeeThresholdMenu(ctx, id)
    }
}
