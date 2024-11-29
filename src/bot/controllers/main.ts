import Launches from '@/models/Launch'
import { handleSetupWizard, menu as launcher, menu } from '@/bot/controllers/launcher'
import { create_launch, launch_settings } from '@/bot/controllers/launcher/createLaunch.controller'
import { launch_deployers } from '@/bot/controllers/share/deployers'
import { launchFeesMenu } from '@/bot/controllers/launcher/launchFees'
import { launchSocialsMenu } from '@/bot/controllers/launcher/launchSocials'
import { launchTokenomicsMenu } from '@/bot/controllers/launcher/launchTokenomics'
import { payLaunchFilterFee, payLaunchFilterFeeMenu, previewLaunch, tokenLaunch } from '@/bot/controllers/launcher/launchToken.controller'
import { detail as tokenDetail } from '@/bot/controllers/tokens'
import { deleteLaunch, manageLaunchDetails, menu as manageLaunchMenu } from '@/bot/controllers/launcher/manageLaunch.controller'
import { launchVariablesMenu } from '@/bot/controllers/launcher/launchVariables'
import { estimateDeploymentCost, manageDeployer, predictContractAddress, sendEth, sendEthConfirm, sendToken, sendTokenConfirmDeployer } from '@/bot/controllers/launcher/launchDeployers'
import { createWallets, generateWallets, manageWallets, saveWallets, sendEthWallet, sendEthConfirmWallet, emptyAllWallets, sendTokenDeployer, sendTokenDeployerConfirm, sendTokenWallet, sendTokenWalletConfirm } from '@/bot/controllers/launcher/manageWallets'
import { bundledWalletsMenu } from '@/bot/controllers/launcher/bundledWallets'
import { replyWithUpdatedMessage, showNotification } from '@/share/utils'
import { ownershipSetting, transferOwnershipConfirm, transferOwnership, renounceOwnershipConfirm, renounceOwnership } from '@/bot/controllers/tokens/ownershipSettings'
import { disableAllLimits, disableAllLimitsConfirm, disableHoldingLimits, disableHoldingLimitsMenu, disableSwapLimits, disableSwapLimitsMenu, limitsSettings } from '@/bot/controllers/tokens/limitsSettings'
import { feesSettingsMenu, udpateFeesMenu, updateFeeThreshold, updateFeeThresholdMenu, updateFees } from '@/bot/controllers/tokens/feesSettings'
import { addLiquidity, addLiquidityMenu, burnLiquidity, burnLiquidityMenu, lpSettingsMenu, removeLiquidity, removeLiquidityMenu } from '@/bot/controllers/tokens/liquiditySettings'
import { generalSettingsMenu } from '@/bot/controllers/tokens/generalSettings'
import { enableTranding, enableTrandingMenu } from '@/bot/controllers/tokens/generalSettings/contractEnableTrading.controller'
import { contractVerification } from '@/bot/controllers/tokens/generalSettings/contractVerification.controller'

/**
 * start
 * @param ctx
 */
export const start = async (ctx: any) => {
    const text = `Launch and bundle tokens effortlessly with OpenGRID. Streamlined for low-cost, high-performance token management. \n\n <a href='https://opengrid.tech'>Website</a> | <a href='https://opengrid.gitbook.io/opengrid-docs'>Documentation</a> | <a href='https://x.com/OpenGRID_ERC'>Twitter</a> | <a href='https://t.me/OpenGRID'>Telegram</a>`
    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '⚡ Launcher', callback_data: 'launcher' },
                    { text: '🌍 Tokens', callback_data: 'tokens' }
                ],
                [
                    { text: '🎯 Bundled Wallets', callback_data: 'wallets' },
                    { text: '🚀 Deployers', callback_data: 'deployers' }
                ]
                // [{ text: '👥 Referrals', callback_data: 'referrals' }]
            ],
            resize_keyboard: true
        },
        link_preview_options: {
            is_disabled: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

export const callbackQuery = async (ctx: any) => {
    const selectedOption: string = ctx.callbackQuery.data

    if (selectedOption == 'setup_wizard') {
        await Launches.deleteMany({ userId: ctx.chat.id, enabled: false })
        launch_settings(ctx)
    } else if (selectedOption.startsWith('instantLaunch_') || selectedOption.startsWith('autoLP_') || selectedOption.startsWith('blacklistCapability_')) {
        handleSetupWizard(ctx, selectedOption.split('_')[0], selectedOption.split('_')[1])
    } else if (selectedOption.startsWith('scene_')) {
        const [_, sceneName, id] = selectedOption.split('_')
        ctx.scene.enter(sceneName, { id: id })
    } else if (selectedOption.startsWith('create_launch_confirm_')) {
        const id = selectedOption.split('_')[3]
        const { deployer, maxBuy } = id.length > 1 ? await Launches.findById(id) : await Launches.findOne({ userId: ctx.chat.id, enabled: false })
        if (!deployer?.address) {
            await ctx.answerCbQuery(`⚠ You didn't create or connect deployer. Please connect deployer`, { show_alert: true })
        } else if (maxBuy <= 0) {
            await ctx.answerCbQuery(`⚠ You didn't set Max Wallet Buy for bundled wallet. It must be greater than 0`, { show_alert: true })
        } else {
            if (id.length > 1) {
                manageLaunchDetails(ctx, id)
            } else {
                await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { enabled: true }, { new: true, upsert: true })
                menu(ctx)
            }
        }
    } else if (selectedOption.startsWith('pay_launchFilterFeeMenu_')) {
        payLaunchFilterFeeMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('pay_launchFilterFee_')) {
        payLaunchFilterFee(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('launch_preview_')) {
        previewLaunch(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('launch_token_')) {
        tokenLaunch(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('manage_token_')) {
        tokenDetail(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('general_settings_')) {
        generalSettingsMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('ownership_settings_')) {
        ownershipSetting(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('transfer_ownership_')) {
        transferOwnershipConfirm(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('renounce_ownership_')) {
        renounceOwnershipConfirm(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('confirm_transferOwnership_')) {
        transferOwnership(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('confirm_renounceOwnership_')) {
        renounceOwnership(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('set_newowner')) {
        transferOwnership(ctx, selectedOption.split('_')[2])
    }
    ////////////////////// trading settings /////////////////
    else if (selectedOption.startsWith('enable_tradingMenu_')) {
        enableTrandingMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('enable_trading_')) {
        enableTranding(ctx, selectedOption.split('_')[2])
    }
    ////////////////////// limits settings /////////////////
    else if (selectedOption.startsWith('limits_settings_')) {
        limitsSettings(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('disable_allLimitsConfirm_')) {
        disableAllLimitsConfirm(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('disable_holdingLimitsConfirm_')) {
        disableHoldingLimitsMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('disable_swapLimitsConfirm_')) {
        disableSwapLimitsMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('disable_allLimits_')) {
        disableAllLimits(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('disable_holdingLimits_')) {
        disableHoldingLimits(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('disable_swapLimits_')) {
        disableSwapLimits(ctx, selectedOption.split('_')[2])
    }
    ////////////////////// fees settings /////////////////
    else if (selectedOption.startsWith('fees_settings_')) {
        feesSettingsMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('udpate_fees_')) {
        udpateFeesMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('update_feeThreshold_')) {
        updateFeeThresholdMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('confirm_udpateFees_')) {
        updateFees(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('confirm_updateFeeThreshold_')) {
        updateFeeThreshold(ctx, selectedOption.split('_')[2])
    }
    ///////////////////  lp settings //////////////////////////
    else if (selectedOption.startsWith('lp_settings_')) {
        lpSettingsMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('add_liquidity_')) {
        addLiquidityMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('confirm_addLiquidity_')) {
        addLiquidity(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('burn_liquidity_')) {
        burnLiquidityMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('confirm_burnLiquidity_')) {
        burnLiquidity(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('remove_liquidity_')) {
        removeLiquidityMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('confirm_removeLiquidity_')) {
        removeLiquidity(ctx, selectedOption.split('_')[2])
    }
    ///////////////////////////////////////////////////////////
    else if (selectedOption.startsWith('verify_contract_')) {
        contractVerification(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('manage_launch_')) {
        manageLaunchDetails(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('launch_settings_')) {
        launch_settings(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('launch_variables_')) {
        launchVariablesMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('launch_tokenomics_')) {
        launchTokenomicsMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('launch_fees_')) {
        launchFeesMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('launch_socials_')) {
        launchSocialsMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('launch_deployers_')) {
        launch_deployers(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('bundled_wallets_')) {
        bundledWalletsMenu(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('delete_launch_')) {
        deleteLaunch(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('deleteLaunch_confirm_')) {
        const id = selectedOption.split('_')[2]
        await Launches.deleteOne({ _id: id })
        showNotification(ctx, `💬 Successfully deleted`)
        manageLaunchMenu(ctx)
    } else if (selectedOption.startsWith('manage_deployer_')) {
        manageDeployer(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('send_eth_')) {
        sendEth(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('sendEth_confirm_')) {
        sendEthConfirm(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('send_token_')) {
        sendToken(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('sendToken_confirm_')) {
        sendTokenConfirmDeployer(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('send_tokenDeployer_')) {
        sendTokenDeployer(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('sendTokenDeployer_confirm_')) {
        sendTokenDeployerConfirm(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('send_tokenWallet_')) {
        sendTokenWallet(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('sendTokenWallet_confirm_')) {
        sendTokenWalletConfirm(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('send_ethWallet_')) {
        sendEthWallet(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('manage_emptyWallets_')) {
        emptyAllWallets(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('sendEth_confirmWallet_')) {
        sendEthConfirmWallet(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('estimate_DeploymentCost_')) {
        estimateDeploymentCost(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('predict_tokenAddress_')) {
        predictContractAddress(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('manage_wallets_')) {
        manageWallets(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('manage_createWallets_')) {
        createWallets(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('generate_createWallet_')) {
        generateWallets(ctx, selectedOption.split('_')[2])
    } else if (selectedOption.startsWith('save_createWallet_')) {
        saveWallets(ctx, selectedOption.split('_')[2])
    }
}
