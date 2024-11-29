import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchTokenomics/tokenLpSupplyEdit.controller'

export const tokenLpSupplyEditScene = new Scenes.BaseScene<Context>('tokenLpSupplyEditScene')

tokenLpSupplyEditScene.enter(enterScene)
tokenLpSupplyEditScene.on('text', textHandler)
