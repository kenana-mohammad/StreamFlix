const Plan = require("../models/Plan");

const checkPlanActive = async(req, res, next) => {
    const plan = await Plan.findById(req.params.planId);
    if (!plan || !plan.isActive) {
        return res.status(400).json({ msg: "الباقة غير متاحة حالياً" });
    }
    req.plan = plan;
    next();
}
module.exports = checkPlanActive