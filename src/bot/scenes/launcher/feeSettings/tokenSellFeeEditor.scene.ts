import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchFees/tokenContractSellFeeEdit.controller'

export const tokenSellFeeEditScene = new Scenes.BaseScene<Context>('tokenSellFeeEditScene')

tokenSellFeeEditScene.enter(enterScene)
tokenSellFeeEditScene.on('text', textHandler)
