import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchVariables/tokenMaxSwapEdit.controller'

export const tokenMaxSwapEditScene = new Scenes.BaseScene<Context>('tokenMaxSwapEditScene')

tokenMaxSwapEditScene.enter(enterScene)
tokenMaxSwapEditScene.on('text', textHandler)
