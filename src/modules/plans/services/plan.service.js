const Plan = require("../models/plan");

class PlanService {

    async getAll() {
        return await Plan.find();
    }

    async getById(id) {
        return await Plan.findById(id);
    }

    async create(data) {
        return await Plan.create(data);
    }

    async update(id, data) {
        return await Plan.findByIdAndUpdate(
            id,
            data,
            { new: true }
        );
    }

    async remove(id) {
        return await Plan.findByIdAndDelete(id);
    }

    async toggleStatus(id) {
        const plan = await Plan.findById(id);

        if (!plan) {
            return null;
        }

        plan.isActive = !plan.isActive;

        await plan.save();

        return plan;
    }
}

module.exports = new PlanService();