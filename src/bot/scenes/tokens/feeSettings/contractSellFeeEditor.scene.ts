import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/tokens/feesSettings/contractSellFeeEdit.controller'

export const contractSellFeeEditScene = new Scenes.BaseScene<Context>('contractSellFeeEditScene')

contractSellFeeEditScene.enter(enterScene)
contractSellFeeEditScene.on('text', textHandler)
