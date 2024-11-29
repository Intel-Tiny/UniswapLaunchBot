import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/tokens/liquiditySettings/contractRemoveLpEdit.controller'

export const contractRemoveLpEditScene = new Scenes.BaseScene<Context>('contractRemoveLpEditScene')

contractRemoveLpEditScene.enter(enterScene)
contractRemoveLpEditScene.on('text', textHandler)
