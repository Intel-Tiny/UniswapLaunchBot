import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchTokenomics/tokenLpEthEdit.controller'

export const tokenLpEthEditScene = new Scenes.BaseScene<Context>('tokenLpEthEditScene')

tokenLpEthEditScene.enter(enterScene)
tokenLpEthEditScene.on('text', textHandler)
