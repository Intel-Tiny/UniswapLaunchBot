import Launches from '@/models/Launch'
import { replyWithUpdatedMessage } from '@/share/utils'

export const menu = async (ctx: any) => {
    const _launches = await Launches.find({ userId: ctx.chat.id, enabled: true })
    const text = `<b>Pending Launches</b>\n` + `Manage pending token launches..\n` + `Click on the respective Token Ticker that you wish to edit.`
    ctx.session.currentTag = 'manage_launch'
    const tokens = []

    for (let i = 0; i < _launches.length; i += 2) {
        const element =
            i + 1 >= _launches.length
                ? [{ text: _launches[i].name, callback_data: `manage_launch_${_launches[i].id}` }]
                : [
                      { text: _launches[i].name, callback_data: `manage_launch_${_launches[i].id}` },
                      { text: _launches[i + 1].name, callback_data: `manage_launch_${_launches[i + 1].id}` }
                  ]
        tokens.push(element)
    }

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [_launches.length === 0 ? [{ text: '=== No Launches You Have Created ===', callback_data: '#' }] : [], ...tokens, [{ text: '← back', callback_data: 'launcher' }]],
            resize_keyboard: true
        }
    }

    replyWithUpdatedMessage(ctx, text, settings)
}

export const manageLaunchDetails = async (ctx: any, id: string) => {
    const launch = await Launches.findById(id)
    if (!launch) {
        ctx.reply(`⚠ There is no launch for this. Please check again`)
        return
    }
    const text =
        `<b>Launch Features </b>[$${launch.symbol}]\n` +
        `Edit any existing launches including their Parameters, Wallets, and Deployer, or Delete the launch altogether.\n\n` +
        `<b>Edit Launch </b> – Change any details in relation to the contract and your token launch. (Includes LP, Supply, Tax, etc.)\n` +
        `<b>Delete Launch </b> – Remove the launch from your Launch List. This will erase all previously added Wallets and Parameters.\n` +
        `<b>Manage Wallets </b> – Add, Remove, and Fund any Wallets that will be used in your Bundled Launch.\n` +
        `<b>Manage Deployer </b> – Add, Remove, or Edit your Deployer Address for the current Launch.\n`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✏️ Edit Launch', callback_data: `launch_settings_${launch.id}` },
                    { text: '❌ Delete Launch ', callback_data: `delete_launch_${launch.id}` }
                ],
                [
                    { text: '📦 Manage Wallets', callback_data: `manage_wallets_${launch.id}` },
                    { text: '👑 Manage Deployer', callback_data: `manage_deployer_${launch.id}` }
                ],
                [{ text: '←️ Back', callback_data: 'manage_launch' }]
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

export const deleteLaunch = async (ctx: any, id: string = '') => {
    console.log('::delete launch:: ', id)
    const text = `<b>Are you sure you want to delete your launch?</b>  Once deleted it can never be recovered again.`
    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✖ Cancel', callback_data: `manage_launch_${id}` },
                    { text: '✔️ Confirm ', callback_data: `deleteLaunch_confirm_${id}` }
                ]
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
