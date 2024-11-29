import Tokens from '@/models/Tokens'
import Launches from '@/models/Launch'
import { Wallet } from 'ethers'
import { checkExit, deleteOldMessages } from '@/share/utils'
import { manageWallets } from '.'
import { deleteMessage, encrypt, replyWarningMessage } from '@/share/utils'

export const enterScene = async (ctx: any) => {
    deleteOldMessages(ctx)

    const { id } = ctx.scene.state
    const launch = id ? (id.startsWith('token') ? await Tokens.findById(id.substr(5)) : await Launches.findById(id)) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })
    const { maxBuy, lpSupply, bundledWallets } = launch
    const maxWallets = Math.floor(lpSupply / maxBuy)

    if (bundledWallets.length + 1 > maxWallets) {
        await ctx.answerCbQuery(
            `⚠ Your bundled wallet has been exceeded.\n Your current LP supply is ${lpSupply}% and Max Buy is ${maxBuy}%. Therefore, a maximum of ${maxWallets} wallets are available and ${maxWallets - bundledWallets.length} additional wallets can be created.`,
            { show_alert: true }
        )
        await ctx.scene.leave()
    } else {
        const { message_id } = await ctx.reply(`<b>Enter the private key(s) of the wallets you want to import as wallet(s) </b>\n` + `<i>example: pvtk1, pvtk2, pvtk3:</i>`, {
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

const _walletFromKey = (key: string) => {
    try {
        const wallet = new Wallet(key)
        return wallet
    } catch (err) {
        return null
    }
}

export const textHandler = async (ctx: any) => {
    const check = await checkExit(ctx)
    if (check) return
    const _value = ctx.message.text
    const { id } = ctx.scene.state
    const launch = id ? (id.startsWith('token') ? await Tokens.findById(id.substr(5)) : await Launches.findById(id)) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })
    const bundledWallets: any[] = launch?.bundledWallets ?? []

    deleteMessage(ctx, ctx.session.message_id)
    deleteMessage(ctx, ctx.message.message_id)

    const privateKeyArr = _value
        .split(',')
        .map((v: string) => v.trim())
        .filter((v: string) => v)
    let invalidPrivKeys = []
    let duplicatedPrivKeys = []
    for (let i = 0; i < privateKeyArr.length; i++) {
        const privateKey = privateKeyArr[i]
        const _wallet = _walletFromKey(privateKey)

        if (_wallet) {
            if (bundledWallets.map((b: any) => b.address).includes(_wallet.address)) {
                duplicatedPrivKeys.push(privateKey)
            } else {
                bundledWallets.push({
                    address: _wallet.address,
                    key: encrypt(_wallet.privateKey)
                } as any)
            }
        } else {
            invalidPrivKeys.push(privateKey)
        }
    }

    if (invalidPrivKeys.length > 0 || duplicatedPrivKeys.length > 0) {
        await replyWarningMessage(
            ctx,
            (invalidPrivKeys.length > 0 ? `⚠ Invalid private keys are provided\n${invalidPrivKeys.join(', ')} \n` : '') + (duplicatedPrivKeys.length > 0 ? `⚠ Duplicated private keys are provided\n${duplicatedPrivKeys.join(', ')} ` : '')
        )
    }
    ctx.session.bundledWallets = bundledWallets
    if (id) {
        if (id.startsWith('token')) {
            await Tokens.findByIdAndUpdate(id.substr(5), { bundledWallets }) //udpate existing launch
        } else {
            await Launches.findByIdAndUpdate(id, { bundledWallets }) //udpate existing launch
        }
    } else {
        await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { bundledWallets }, { new: true, upsert: true }) // update when crewating new launch
    }
    await ctx.scene.leave()
    manageWallets(ctx, id)
}
