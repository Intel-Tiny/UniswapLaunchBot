import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/tokens/ownershipSettings/tokenNewOwnerEdit.controller'

export const contractNewOwnerEditScene = new Scenes.BaseScene<Context>('contractNewOwnerEditScene')

contractNewOwnerEditScene.enter(enterScene)
contractNewOwnerEditScene.on('text', textHandler)
