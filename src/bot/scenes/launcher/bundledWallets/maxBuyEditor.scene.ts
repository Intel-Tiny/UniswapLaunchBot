import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/bundledWallets/maxBuyEdit.controller'

export const maxBuyEditScene = new Scenes.BaseScene<Context>('maxBuyEditScene')

maxBuyEditScene.enter(enterScene)
maxBuyEditScene.on('text', textHandler)
