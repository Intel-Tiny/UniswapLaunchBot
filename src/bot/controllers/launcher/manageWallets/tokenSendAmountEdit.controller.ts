import { sendEthWallet, sendTokenDeployer } from '.'
import { deleteMessage, deleteOldMessages } from '@/share/utils'
import { checkExit } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter the amount of token you want to send:</b>\n`, {
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
    const _value = ctx.message.text
    const { id } = ctx.scene.state

    deleteMessage(ctx, ctx.session.message_id)
    deleteMessage(ctx, ctx.message.message_id)

    try {
        if (isNaN(_value)) throw `⚠ Input must be a valid number.`
        if (_value <= 0) throw `⚠ Token amount must be greater than 0`

        ctx.session.tokenReceiverAmount = _value
        await ctx.scene.leave()
        sendTokenDeployer(ctx, id)
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
