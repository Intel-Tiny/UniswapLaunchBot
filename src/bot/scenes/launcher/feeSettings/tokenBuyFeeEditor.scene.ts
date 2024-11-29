import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchFees/tokenContractBuyFeeEdit.controller'

export const tokenBuyFeeEditScene = new Scenes.BaseScene<Context>('tokenBuyFeeEditScene')

tokenBuyFeeEditScene.enter(enterScene)
tokenBuyFeeEditScene.on('text', textHandler)
