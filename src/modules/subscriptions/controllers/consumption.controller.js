const { successResponse } = require('../../../shared/helpers/api-response.helper');
const consumptionService = require('../services/consumption.service');

class ConsumptionController {

    /**
     * GET /api/v1/subscriptions/consumption
     * ملخص استهلاك الاشتراك الحالي
     * (أفلام / مسلسلات: مستخدم / حد / متبقي)
     */
    async getSummary(req, res) {

        const summary =
            await consumptionService.getSubscriptionConsumptionSummary(
                req.subscription
            );

        return successResponse(
            res,
            200,
            'Subscription consumption retrieved successfully',
            summary
        );
    }


    /**
     * GET /api/v1/subscriptions/consumption/content
     * قائمة المحتوى المستهلك ضمن الاشتراك الحالي
     * مع Pagination
     */
    async getConsumedContent(req, res) {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result =
            await consumptionService.getConsumedContentList(
                req.subscription._id, {
                    page,
                    limit
                }
            );

        return successResponse(
            res,
            200,
            'Consumed content retrieved successfully',
            result
        );
    }

}

module.exports = new ConsumptionController();