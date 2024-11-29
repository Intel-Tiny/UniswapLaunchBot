import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchFees/tokenContractFeeWalletEdit.controller'

export const tokenFeeWalletEditScene = new Scenes.BaseScene<Context>('tokenFeeWalletEditScene')

tokenFeeWalletEditScene.enter(enterScene)
tokenFeeWalletEditScene.on('text', textHandler)
