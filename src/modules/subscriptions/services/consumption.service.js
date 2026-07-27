const SubscriptionConsumption = require('../models/SubscriptionConsumption');
const SubscriptionUsage = require('../models/SubscriptionUsage');
const Plan = require('../../plans/models/Plan');
const AppError = require('../../../shared/errors/AppError');

class ConsumptionService {

    /**
     * عرض استهلاك الاشتراك الحالي (للمستخدم صاحب الحساب).
     * يوضح: كم استهلك، كم الحد المسموح، كم المتبقي - لكل نوع (أفلام/مسلسلات).
     */
    async getSubscriptionConsumptionSummary(subscription) {
        const plan = await Plan.findById(subscription.planId);

        if (!plan) {
            throw new AppError('Plan not found', 404);
        }

        if (!plan.isLimited) {
            return {
                unlimited: true,
                movies: null,
                series: null
            };
        }

        const usage = await SubscriptionUsage.findOne({
            subscriptionId: subscription._id
        });

        const moviesUsed = usage.moviesUsedCount || 0;
        const seriesUsed = usage.seriesUsedCount || 0;

        return {
            unlimited: false,
            movies: {
                used: moviesUsed,
                max: plan.maxMovies,
                remaining: Math.max(plan.maxMovies - moviesUsed, 0)
            },
            series: {
                used: seriesUsed,
                max: plan.maxSeries,
                remaining: Math.max(plan.maxSeries - seriesUsed, 0)
            }
        };
    }

    /**
     * قائمة المحتوى المستهلك ضمن دورة الاشتراك الحالية (يفيد المستخدم ليعرف
     * "شو استهلكته هالشهر" بالتفصيل، مو بس رقم إجمالي).
     */
    async getConsumedContentList(subscriptionId, { page = 1, limit = 20 } = {}) {
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            SubscriptionConsumption.find({ subscriptionId })
            .sort({ consumedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('contentId', 'title poster type')
            .populate('consumedByProfileId', 'name avatar'),

            SubscriptionConsumption.countDocuments({ subscriptionId })
        ]);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * استهلاك بروفايل معيّن تحديداً ضمن الاشتراك الحالي - يفيد صاحب الحساب
     * ليعرف "مين بالعائلة يستهلك أكتر من الكوتا المشتركة".
     * (ملاحظة: هذا للعرض/الإحصاء فقط، ولا يُستخدم أبداً كأساس لفحص الكوتا،
     * لأن الكوتا نفسها على مستوى الاشتراك كامل وليس البروفايل).
     */
    async getProfileConsumptionBreakdown(subscriptionId, profileId) {
        const items = await SubscriptionConsumption.find({
                subscriptionId,
                consumedByProfileId: profileId
            })
            .sort({ consumedAt: -1 })
            .populate('contentId', 'title poster type');

        return {
            profileId,
            totalConsumedByThisProfile: items.length,
            items
        };
    }
}

module.exports = new ConsumptionService();