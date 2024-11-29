import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/tokens/feesSettings/contractLiquidityFeeEdit.controller'

export const contractLiquidityFeeEditScene = new Scenes.BaseScene<Context>('contractLiquidityFeeEditScene')

contractLiquidityFeeEditScene.enter(enterScene)
contractLiquidityFeeEditScene.on('text', textHandler)
