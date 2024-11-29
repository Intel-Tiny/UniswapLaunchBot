import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchVariables/tokenNameEdit.controller'

export const tokenNameEditScene = new Scenes.BaseScene<Context>('tokenNameEditScene')

tokenNameEditScene.enter(enterScene)
tokenNameEditScene.on('text', textHandler)
