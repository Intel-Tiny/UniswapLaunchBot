import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/bundledWallets/minBuyEdit.controller'

export const minBuyEditScene = new Scenes.BaseScene<Context>('minBuyEditScene')

minBuyEditScene.enter(enterScene)
minBuyEditScene.on('text', textHandler)
