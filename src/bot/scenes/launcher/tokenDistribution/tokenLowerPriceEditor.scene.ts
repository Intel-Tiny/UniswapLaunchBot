import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchTokenomics/v3LowerPriceEdit.controller'

export const tokenLowerPriceEditScene = new Scenes.BaseScene<Context>('tokenLowerPriceEditScene')

tokenLowerPriceEditScene.enter(enterScene)
tokenLowerPriceEditScene.on('text', textHandler)
