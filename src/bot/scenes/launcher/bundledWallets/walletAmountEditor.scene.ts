import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/manageWallets/walletAmountEdit.controller'

export const walletAmountEditScene = new Scenes.BaseScene<Context>('walletAmountEditScene')

walletAmountEditScene.enter(enterScene)
walletAmountEditScene.on('text', textHandler)
