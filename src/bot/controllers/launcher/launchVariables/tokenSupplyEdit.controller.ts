import Launches from '@/models/Launch'
import { launchVariablesMenu } from '@/bot/controllers/launcher/launchVariables/index'
import { deleteMessage, deleteOldMessages } from '@/share/utils'
import { checkExit } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter the total supply  </b>\n` + `This will be the permanent total supply, there is no burning yet nor do we allow minting. \n` + `<i>(example: 100,000,000)</i>`, {
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

    if (_value <= 0 || !Number.isInteger(_value)) {
        const { message_id } = await ctx.reply(`<b>Invalid total Supply\n</b> Pleaes retry with valid amount` + `<i>(example: 100,000,000)</i>`, {
            parse_mode: 'HTML',
            reply_markup: {
                force_reply: true,
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        ctx.session.message_id = message_id
    } else {
        id.length > 1 ? await Launches.findOneAndUpdate({ _id: id }, { totalSupply: _value }, { new: true }) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { totalSupply: _value }, { new: true, upsert: true })
        await ctx.scene.leave()
        launchVariablesMenu(ctx, id)
    }
}
