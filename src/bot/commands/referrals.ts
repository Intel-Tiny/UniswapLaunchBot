import { menu } from '@/bot/controllers/referrals'

export default (_bot: any) => {
    /**
     * @command /referrals
     * referrals menu function
     */
    _bot.command('referrals', (ctx: any) => {
        ctx.session.mainMsgId = undefined
        menu(ctx)
    })
    /**
     * @action referrals
     * referrals menu function
     */
    _bot.action('referrals', menu)
}
