const consumptionService = require('../services/consumption.service');

class ConsumptionController {

    /**
     * GET /api/v1/subscriptions/consumption
     * ملخص استهلاك الاشتراك الحالي (أفلام/مسلسلات: مستخدَم/حد/متبقي)
     */
    async getSummary(req, res) {
        const summary = await consumptionService.getSubscriptionConsumptionSummary(
            req.subscription
        );

        res.status(200).json({
            status: 'success',
            data: { consumption: summary }
        });
    }

    /**
     * GET /api/v1/subscriptions/consumption/content
     * قائمة المحتوى المستهلك ضمن الدورة الحالية (Pagination)
     */
    async getConsumedContent(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await consumptionService.getConsumedContentList(
            req.subscription._id, { page, limit }
        );

        res.status(200).json({
            status: 'success',
            data: result
        });
    }

}

module.exports = new ConsumptionController();