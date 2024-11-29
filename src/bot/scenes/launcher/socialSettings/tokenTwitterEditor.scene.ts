import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchSocials/tokenTwitterEdit.controller'

export const tokenTwitterEditScene = new Scenes.BaseScene<Context>('tokenTwitterEditScene')

tokenTwitterEditScene.enter(enterScene)
tokenTwitterEditScene.on('text', textHandler)
