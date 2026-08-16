const { successResponse, errorResponse } = require("../../../shared/helpers/api-response.helper");
const subscriptionService = require("./../services/subscription.service");

class SubscriptionController {

    createSubscription = async(req, res) => {

        const { autoRenew = false, notes = "", paymentMethod = "visa", currency = "USD" } = req.body || {};
        const subscriptionData = {
            userId: req._user.id,
            plan: req.plan,
            autoRenew,
            notes,
            paymentMethod,
            currency
        };

        const result = await subscriptionService.createSubscription(subscriptionData);


        return successResponse(res, 201, "تم الاشتراك  بنجاح", result)
    };
    ////=========================================================
    //
    renewManual = async(req, res) => {
        const { subscriptionId } = req.params;
        const { autoRenew, notes, paymentMethod, currency } = req.body;
        const renewManualsubscription = {
            userId: req._user.id,
            plan: req.plan,
            autoRenew,
            notes,
            paymentMethod,
            currency,
            subscriptionId
        };
        const result = await subscriptionService.renewManual(renewManualsubscription);
        return successResponse(res, 201, "تم تجديد الاشتراك  بنجاح", result)


    };
    ///cancleSubcsription
    cancelSubscription = async(req, res) => {
            const id = req.params.id;
            const userId = req._user.id;
            const data = { id, userId }
            const result = await subscriptionService.cancelSubscription(data);

            return successResponse(res, 201,
                result.msg, // الـ message القادمة من الـ Service
                result.subscription);
        }
        //////=============================================
    getMySubscriptions = async(req, res) => {
            const userId = req._user.id;
            const status = req.query.status;
            const data = { userId, status }


            const mySubscriptions = await subscriptionService.getMySubscriptions(data);

            return successResponse(res, 200,
                "عرض اشتراكاتي",
                mySubscriptions);
        }
        //=================
        //get deatils
    getMySubscriptionDetails = async(req, res) => {
            const id = req.params.id;
            const userId = req._user.id;
            const data = {
                id,
                userId
            };
            const result = await subscriptionService.getMySubscriptionDetails(data);

            return successResponse(res, 200,
                "عرض تفاصيل الاشتراك", result);
        }
        //==============================================
        //
    upgradeSubscription = async(req, res) => {
        const { autoRenew, notes, paymentMethod, currency } = req.body;

        const data = {
            userId: req._user.id,
            newPlan: req.plan,
            bodyData: {
                autoRenew,
                notes,
                paymentMethod,
                currency
            }
        };

        const result = await subscriptionService.upgradeSubscription(data);

        return successResponse(res, 201, "تمت ترقية الاشتراك بنجاح", result);
    }

}


module.exports = new SubscriptionController();