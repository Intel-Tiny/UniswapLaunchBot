import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchDeployers/receiverAmountEdit.controller'

export const ethSendAmountEditScene = new Scenes.BaseScene<Context>('ethSendAmountEditScene')

ethSendAmountEditScene.enter(enterScene)
ethSendAmountEditScene.on('text', textHandler)
