import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchVariables/tokenSupplyEdit.controller'

export const tokenSupplyEditScene = new Scenes.BaseScene<Context>('tokenSupplyEditScene')

tokenSupplyEditScene.enter(enterScene)
tokenSupplyEditScene.on('text', textHandler)
