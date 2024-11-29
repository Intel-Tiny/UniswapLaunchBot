import { Wallet } from 'ethers'
import { launch_deployers } from '.'
import Launches from '@/models/Launch'
import { deleteMessage, encrypt, deleteOldMessages } from '@/share/utils'
import { checkExit } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const text = `<b>Enter the private key of the address you want to link as your deployer.</b>\n`
    const { message_id } = await ctx.reply(text, {
        parse_mode: 'HTML',
        reply_markup: {
            force_reply: true,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    })
    ctx.session.message_id = message_id
}
// text handler
export const textHandler = async (ctx: any) => {
    const check = await checkExit(ctx)
    if (check) return
    const { id } = ctx.scene.state
    const _value = ctx.message.text
    deleteMessage(ctx, ctx.message.message_id)
    deleteMessage(ctx, ctx.session.message_id)
    try {
        const { privateKey, address } = new Wallet(_value)
        id.length > 1
            ? await Launches.findOneAndUpdate(
                  { _id: id },
                  {
                      deployer: {
                          key: encrypt(privateKey),
                          address
                      }
                  },
                  { new: true }
              )
            : await Launches.findOneAndUpdate(
                  { userId: ctx.chat.id, enabled: false },
                  {
                      deployer: {
                          key: encrypt(privateKey),
                          address
                      }
                  },
                  { new: true, upsert: true }
              )
        ctx.scene.leave()
        launch_deployers(ctx, id)
    } catch (err) {
        const { message_id } = await ctx.reply(`Invalid Private key, Please try with valid private key`, {
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
