import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchFees/tokenSwapThresholdEdit.controller'

export const tokenSwapThresholdEditScene = new Scenes.BaseScene<Context>('tokenSwapThresholdEditScene')

tokenSwapThresholdEditScene.enter(enterScene)
tokenSwapThresholdEditScene.on('text', textHandler)
