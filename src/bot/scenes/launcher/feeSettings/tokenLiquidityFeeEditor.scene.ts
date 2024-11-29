import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchFees/tokenContractLiquidityFeeEdit.controller'

export const tokenLiquidityFeeEditScene = new Scenes.BaseScene<Context>('tokenLiquidityFeeEditScene')

tokenLiquidityFeeEditScene.enter(enterScene)
tokenLiquidityFeeEditScene.on('text', textHandler)
