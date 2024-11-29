import { Telegraf, Scenes, session } from 'telegraf'
import dotenv from 'dotenv'

dotenv.config()
// commands
import mainCommands from '@/bot/commands/main'
import launcherCommands from '@/bot/commands/launcher'
import tokensCommands from '@/bot/commands/tokens'
import snipersCommands from '@/bot/commands/snipers'
import deployersCommands from '@/bot/commands/deployers'
import referralsCommands from '@/bot/commands/referrals'
import {
    tokenNameEditScene,
    tokenSymbolEditScene,
    tokenSupplyEditScene,
    tokenMaxSwapEditScene,
    tokenMaxWalletEditScene,
    tokenLpEthEditScene,
    tokenLpSupplyEditScene,
    tokenFundsEditScene,
    tokenBuyFeeEditScene,
    tokenSellFeeEditScene,
    tokenLiquidityFeeEditScene,
    tokenSwapThresholdEditScene,
    tokenWebsiteEditScene,
    tokenTwitterEditScene,
    tokenTelegramEditScene,
    tokenCustomEditScene,
    tokenDeployerCreatorScene,
    tokenDeployerLinkScene,
    tokenFeeWalletEditScene,
    ethToAddressEditScene,
    ethSendAmountEditScene,
    createWalletAmountScene,
    importWalletScene,
    deleteWalletScene,
    minBuyEditScene,
    maxBuyEditScene,
    contractNewOwnerEditScene,
    //token contract fee settings
    contractBuyFeeEditScene,
    contractSellFeeEditScene,
    contractLiquidityFeeEditScene,
    contractThresholdEditScene,
    contractBurnLpEditScene,
    contractRemoveLpEditScene,
    walletToAddressEditScene,
    walletSendAmountEditScene,
    tokenSendAmountEditScene,
    tokenToAddressEditScene,
    walletFromEditScene,
    walletToEditScene,
    walletAmountEditScene,
    tokenDeployerAddrEditScene,
    tokenDeployerAmountEditScene
} from '@/bot/scenes'
import { saveOldMsgIds } from '@/share/utils'

export default () => {
    const _bot = new Telegraf(process.env.TG_BOT_TOKEN, {
        handlerTimeout: 9_000_000 // 2.5 hours in milliseconds
    })
    const stages = new Scenes.Stage([
        tokenNameEditScene as any,
        tokenSymbolEditScene,
        tokenSupplyEditScene,
        tokenMaxSwapEditScene,
        tokenMaxWalletEditScene,
        tokenLpEthEditScene,
        tokenLpSupplyEditScene,
        tokenFundsEditScene,
        tokenBuyFeeEditScene,
        tokenSellFeeEditScene,
        tokenLiquidityFeeEditScene,
        tokenFeeWalletEditScene,
        tokenSwapThresholdEditScene,
        tokenWebsiteEditScene,
        tokenTwitterEditScene,
        tokenTelegramEditScene,
        tokenCustomEditScene,
        tokenDeployerCreatorScene,
        tokenDeployerLinkScene,
        ethToAddressEditScene,
        ethSendAmountEditScene,
        createWalletAmountScene,
        importWalletScene,
        deleteWalletScene,
        minBuyEditScene,
        maxBuyEditScene,
        contractNewOwnerEditScene,
        contractBuyFeeEditScene,
        contractSellFeeEditScene,
        contractLiquidityFeeEditScene,
        contractThresholdEditScene,
        contractBurnLpEditScene,
        contractRemoveLpEditScene,
        walletToAddressEditScene,
        walletSendAmountEditScene,
        tokenSendAmountEditScene,
        tokenToAddressEditScene,
        walletFromEditScene,
        walletToEditScene,
        walletAmountEditScene,
        tokenDeployerAddrEditScene,
        tokenDeployerAmountEditScene
    ])
    _bot.use(session({ defaultSession: () => ({ currentSelectType: '' }) }))
    // use tg scene's middlewares
    _bot.use(stages.middleware())
    // save msg
    _bot.use(async (ctx: any, next: any) => {
        if (ctx.message) {
            const { message_id } = ctx.message // Get the incoming message ID
            ctx.session.lastMsgId = message_id
            saveOldMsgIds(ctx, message_id)
        }
        // make reply
        const originalReply = ctx.reply.bind(ctx)
        ctx.reply = async (text: string, extra: any) => {
            const sentMessage = await originalReply(text, extra) // Send the message
            if (sentMessage) {
                saveOldMsgIds(ctx, sentMessage.message_id) // Store the outgoing message ID
            }
            return sentMessage // Return the sent message object
        }
        return next() // Proceed to the next handler
    })
    // set commands
    const commands = [
        { command: '/start', description: 'start' },
        { command: '/launcher', description: 'Start creating launches and managing your tokens' },
        { command: '/tokens', description: 'Manage your launched tokens with tons of unique functions' },
        { command: '/wallets', description: 'Send and sell your tokens as well as send eth' },
        { command: '/deployers', description: 'Send eth and tokens with your token deployer(s)' }
        // { command: '/referrals', description: 'Create and manage your referrals' }
    ]
    _bot.telegram.setMyCommands(commands)
    // setup commands
    launcherCommands(_bot)
    tokensCommands(_bot)
    snipersCommands(_bot)
    deployersCommands(_bot)
    referralsCommands(_bot)
    mainCommands(_bot)
    // launch TG bot instance
    _bot.launch()

    console.log('::Bundle Bot has been started:')
}
