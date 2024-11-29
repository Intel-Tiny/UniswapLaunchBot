import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchDeployers/receiverTokenAmountEdit.controller'

export const tokenDeployerAmountEditScene = new Scenes.BaseScene<Context>('tokenDeployerAmountEditScene')

tokenDeployerAmountEditScene.enter(enterScene)
tokenDeployerAmountEditScene.on('text', textHandler)
