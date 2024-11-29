import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchVariables/tokenSymbolEdit.controller'

export const tokenSymbolEditScene = new Scenes.BaseScene<Context>('tokenSymbolEditScene')

tokenSymbolEditScene.enter(enterScene)
tokenSymbolEditScene.on('text', textHandler)
