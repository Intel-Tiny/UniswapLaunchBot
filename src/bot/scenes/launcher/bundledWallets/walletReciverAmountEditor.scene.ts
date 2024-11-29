import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/manageWallets/receiverAmountEdit.controller'

export const walletSendAmountEditScene = new Scenes.BaseScene<Context>('walletSendAmountEditScene')

walletSendAmountEditScene.enter(enterScene)
walletSendAmountEditScene.on('text', textHandler)
