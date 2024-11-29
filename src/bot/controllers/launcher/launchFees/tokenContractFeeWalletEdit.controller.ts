import { isAddress } from 'ethers'
import { launchFeesMenu } from '.'
import Launches from '@/models/Launch'
import { deleteMessage, deleteOldMessages, checkExit, saveOldMsgIds } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { message_id } = await ctx.reply(`<b>Enter your fee receiver address</b>\n` + `This is the address that will receive all fees.\n` + `<i>(default address will be the deployer)</i>`, {
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
    const _value = ctx.message.text
    const { id } = ctx.scene.state

    deleteOldMessages(ctx)

    if (isAddress(_value)) {
        id.length > 1 ? await Launches.findOneAndUpdate({ _id: id }, { feeWallet: _value }, { new: true }) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { feeWallet: _value }, { new: true, upsert: true })
        await ctx.scene.leave()
        launchFeesMenu(ctx, id)
    } else {
        const { message_id } = await ctx.reply(`Invalid EVM address. Please retry`)
        
    }
}
