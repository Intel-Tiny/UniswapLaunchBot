import Launches from '@/models/Launch'
import { launch_settings } from './createLaunch.controller'
import { launchVariablesMenu } from '@/bot/controllers/launcher/launchVariables/index'
import { replyWithUpdatedMessage } from '@/share/utils'

/**
 * launch menu
 * @param ctx
 */
export const menu = async (ctx: any) => {
    ctx.session.tagTitle = 'launcher'
    const text =
        `Launcher\n` +
        `Would you like to Create or Manage a token launch?\n` +
        `<b>Create Launch</b> – Start a new undefined token launch.\n` +
        `<b>Manage Launch</b> – Set your launch parameters before deployment..\n` +
        `<b>Launch Token</b> – Deploy a new token on the undefined Network.\n`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '➕ Create Launch', callback_data: 'create_launch' },
                    { text: '⚖ Manage Launch', callback_data: 'manage_launch' }
                ],
                [{ text: '🚀 Launch Token', callback_data: 'launch_token' }],
                [{ text: '← back', callback_data: 'start' }]
            ],
            // eslint-disable-next-line prettier/prettier
            resize_keyboard: true
        },
        link_preview_options: {
            is_disabled: true
        }
    }

    replyWithUpdatedMessage(ctx, text, settings)
}

/**
 * when click setup wizard button
 * @param ctx
 */
export const handleSetupWizard = async (ctx: any, type: string, id: string = '') => {
    console.log(type, id)
    const launch = id.length > 1 ? await Launches.findById(id) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })
    if (type === 'instantLaunch') {
        if (!launch.instantLaunch) {
            launch.autoLP = true
        }
        launch.instantLaunch = !launch.instantLaunch
        await launch.save()
        launch_settings(ctx, id)
    } else if (type === 'autoLP') {
        if (launch.autoLP) {
            launch.instantLaunch = false
        }
        launch.autoLP = !launch.autoLP
        await launch.save()
        launch_settings(ctx, id)
    } else if (type === 'blacklistCapability') {
        launch.blacklistCapability = !launch.blacklistCapability
        await launch.save()
        launchVariablesMenu(ctx, id)
    }
}
