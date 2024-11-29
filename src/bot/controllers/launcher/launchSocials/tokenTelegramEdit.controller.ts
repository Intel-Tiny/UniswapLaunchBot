import Launches from '@/models/Launch'
import { deleteMessage, deleteOldMessages, checkExit, saveOldMsgIds } from '@/share/utils'
import { launchSocialsMenu } from '.'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter your Telegram chat/portal link</b>\n` + `<i>(example: https://t.me/OpenGRID)</i>`, {
        parse_mode: 'HTML',
        reply_markup: {
            force_reply: true,
            one_time_keyboard: true,
            resize_keyboard: true
        },
        link_preview_options: {
            is_disabled: true
        }
    })
    
}

export const textHandler = async (ctx: any) => {
    saveOldMsgIds(ctx, ctx?.message?.message_id)
    const check = await checkExit(ctx)
    if (check) return
    const { id } = ctx.scene.state

    deleteOldMessages(ctx)

    id.length > 1 ? await Launches.findOneAndUpdate({ _id: id }, { telegram: ctx.message.text }, { new: true }) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { telegram: ctx.message.text }, { new: true, upsert: true })
    await ctx.scene.leave()
    launchSocialsMenu(ctx, id)
}
