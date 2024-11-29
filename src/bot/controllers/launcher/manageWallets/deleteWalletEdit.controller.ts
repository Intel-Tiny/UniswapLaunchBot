import Launches from '@/models/Launch'
import { manageWallets } from '.'
import { deleteMessage, deleteOldMessages, saveOldMsgIds } from '@/share/utils'
import { checkExit } from '@/share/utils'
import Tokens from '@/models/Tokens'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { id } = ctx.scene.state
    const launch = id ? (id.startsWith('token') ? await Tokens.findById(id.substr(5)) : await Launches.findById(id)) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })
    const bundledWallets = launch?.bundledWallets ?? []

    const { message_id } = await ctx.replyWithMarkdownV2(`*Enter the address of the wallet you would like to delete\\:* \n` + `_\\(example\\: \`${bundledWallets?.[0]?.address}\`\\)_`, {
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
    const launch = id ? (id.startsWith('token') ? await Tokens.findById(id.substr(5)) : await Launches.findById(id)) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })
    const bundledWallets = launch?.bundledWallets ?? []

    deleteMessage(ctx, ctx.session.message_id)
    deleteMessage(ctx, ctx.message.message_id)

    // Filter out the wallet with the matching address
    const removeIndex = bundledWallets.findIndex((b: any) => b.address === _value)
    if (removeIndex === -1) {
        const { message_id } = await ctx.reply(`⚠ No existing wallet for <code>${_value}</code>`, {
            parse_mode: 'HTML'
        })
        ctx.session.message_id = message_id
        saveOldMsgIds(ctx, message_id)
    } else {
        console.log('::removeIndex', removeIndex)
        bundledWallets.splice(removeIndex, 1)
        launch.bundledWallets = bundledWallets as any
        await launch.save()
    }
    // Update the launch document with the new wallets array
    launch.bundledWallets = bundledWallets as any
    await ctx.scene.leave()
    manageWallets(ctx, id)
}
