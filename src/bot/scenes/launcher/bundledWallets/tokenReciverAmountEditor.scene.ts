import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/manageWallets/tokenSendAmountEdit.controller'

export const tokenSendAmountEditScene = new Scenes.BaseScene<Context>('tokenSendAmountEditScene')

tokenSendAmountEditScene.enter(enterScene)
tokenSendAmountEditScene.on('text', textHandler)
