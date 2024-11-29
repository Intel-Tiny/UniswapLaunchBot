import Launches from '@/models/Launch'
import { launchVariablesMenu } from '@/bot/controllers/launcher/launchVariables/index'
import { deleteMessage, deleteOldMessages, checkExit } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter your token name </b>\n` + `The name your token it will be known by.\n` + `<i>(example: Bitcoin or Ethereum)</i>`, {
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

    deleteMessage(ctx, ctx.session.message_id)
    deleteMessage(ctx, ctx.message.message_id)

    id.length > 1
        ? await Launches.findOneAndUpdate({ _id: id }, { name: ctx.message.text || '' }, { new: true })
        : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { name: ctx.message.text || '' }, { new: true, upsert: true })

    await ctx.scene.leave()
    launchVariablesMenu(ctx, id)
}
