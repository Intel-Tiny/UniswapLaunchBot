import { Wallet } from 'ethers'
import { launch_deployers } from '.'
import Launches from '@/models/Launch'
import { deleteMessage, encrypt, deleteOldMessages } from '@/share/utils'
import { checkExit } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const wallet = Wallet.createRandom()
    const _wallet = {
        address: wallet.address,
        key: encrypt(wallet.privateKey)
    }
    ctx.session.wallet = _wallet
    const text =
        `*Create Deployer*\n` +
        `Please save the wallet Private Key in a secure location\\. We do not save the information on this page and it will not be accessible at a later time\\.\n\n` +
        `Address: \`${wallet.address}\`\n` +
        `*Private Key:*\n` +
        `||${wallet.privateKey}||`

    const { message_id } = await ctx.replyWithMarkdownV2(text, {
        reply_markup: {
            one_time_keyboard: true,
            resize_keyboard: true,
            inline_keyboard: [
                [
                    { text: 'Cancel', callback_data: 'deployer_create_cancel' },
                    { text: 'Confirm', callback_data: 'deployer_create_confirm' }
                ]
            ]
        }
    })
    ctx.session.message_id = message_id
}
/**
 * handle callback_query
 * @param ctx
 */
export const callbackQuery = async (ctx: any) => {
    const { id } = ctx.scene.state
    const selectedOption: string = ctx.callbackQuery.data
    if (selectedOption === 'deployer_create_confirm') {
        const { address, key } = ctx.session?.wallet
        id.length > 1
            ? await Launches.findOneAndUpdate({ _id: id }, { deployer: { key, address } }, { new: true })
            : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { deployer: { key, address } }, { new: true, upsert: true })
    }
    deleteMessage(ctx, ctx.session.message_id)
    await ctx.scene.leave()
    launch_deployers(ctx, id)
}
/**
 * msg handler
 * @param ctx
 */
export const textHandler = async (ctx: any) => {
    const check = await checkExit(ctx)
    if (check) return
    await ctx.scene.leave()
    launch_deployers(ctx)
}
