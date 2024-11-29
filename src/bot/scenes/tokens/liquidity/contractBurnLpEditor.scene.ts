import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/tokens/liquiditySettings/contractBurnLpEdit.controller'

export const contractBurnLpEditScene = new Scenes.BaseScene<Context>('contractBurnLpEditScene')

contractBurnLpEditScene.enter(enterScene)
contractBurnLpEditScene.on('text', textHandler)
