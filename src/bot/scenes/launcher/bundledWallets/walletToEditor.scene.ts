import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/manageWallets/walletToEdit.controller'

export const walletToEditScene = new Scenes.BaseScene<Context>('walletToEditScene')

walletToEditScene.enter(enterScene)
walletToEditScene.on('text', textHandler)
