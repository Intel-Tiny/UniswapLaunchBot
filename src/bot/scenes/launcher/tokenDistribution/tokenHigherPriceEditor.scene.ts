import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchTokenomics/v3HigherPriceEdit.controller'

export const tokenHigherPriceEditScene = new Scenes.BaseScene<Context>('tokenHigherPriceEditScene')

tokenHigherPriceEditScene.enter(enterScene)
tokenHigherPriceEditScene.on('text', textHandler)
