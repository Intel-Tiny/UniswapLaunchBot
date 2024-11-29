import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchSocials/tokenWebsiteEdit.controller'

export const tokenWebsiteEditScene = new Scenes.BaseScene<Context>('tokenWebsiteEditScene')

tokenWebsiteEditScene.enter(enterScene)
tokenWebsiteEditScene.on('text', textHandler)
