import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/tokens/feesSettings/contractBuyFeeEdit.controller'

export const contractBuyFeeEditScene = new Scenes.BaseScene<Context>('contractBuyFeeEditScene')

contractBuyFeeEditScene.enter(enterScene)
contractBuyFeeEditScene.on('text', textHandler)
