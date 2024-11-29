import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/tokens/feesSettings/contractSwapThresholdEdit.controller'

export const contractThresholdEditScene = new Scenes.BaseScene<Context>('contractThresholdEditScene')

contractThresholdEditScene.enter(enterScene)
contractThresholdEditScene.on('text', textHandler)
