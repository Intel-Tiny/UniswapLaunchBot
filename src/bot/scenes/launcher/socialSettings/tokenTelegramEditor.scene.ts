import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchSocials/tokenTelegramEdit.controller'

export const tokenTelegramEditScene = new Scenes.BaseScene<Context>('tokenTelegramEditScene')

tokenTelegramEditScene.enter(enterScene)
tokenTelegramEditScene.on('text', textHandler)
