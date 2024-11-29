import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/share/deployers/tokenDeployerLink.controller'

export const tokenDeployerLinkScene = new Scenes.BaseScene<Context>('tokenDeployerLinkScene')

tokenDeployerLinkScene.enter(enterScene)
tokenDeployerLinkScene.on('text', textHandler)
