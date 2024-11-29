import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchSocials/tokenCustomEdit.controller'

export const tokenCustomEditScene = new Scenes.BaseScene<Context>('tokenCustomEditScene')

tokenCustomEditScene.enter(enterScene)
tokenCustomEditScene.on('text', textHandler)
