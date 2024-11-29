import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchVariables/tokenMaxWalletEdit.controller'

export const tokenMaxWalletEditScene = new Scenes.BaseScene<Context>('tokenMaxWalletEditScene')

tokenMaxWalletEditScene.enter(enterScene)
tokenMaxWalletEditScene.on('text', textHandler)
