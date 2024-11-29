import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/manageWallets/deleteWalletEdit.controller'

export const deleteWalletScene = new Scenes.BaseScene<Context>('deleteWalletScene')

deleteWalletScene.enter(enterScene)
deleteWalletScene.on('text', textHandler)