import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/manageWallets/walletFromEdit.controller'

export const walletFromEditScene = new Scenes.BaseScene<Context>('walletFromEditScene')

walletFromEditScene.enter(enterScene)
walletFromEditScene.on('text', textHandler)
