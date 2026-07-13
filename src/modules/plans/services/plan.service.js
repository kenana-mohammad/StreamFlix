const Plan = require("../models/plan");
const AppError = require("../../../shared/errors/AppError");

class PlanService {

    async getAll() {
        return await Plan.find();
    }

    // Front APIs
    async getActive() {
        return await Plan.find({ isActive: true });
    }

    async getById(id) {
        return await Plan.findById(id);
    }

    async create(data) {

        if (data.isLimited === true) {

            if (data.maxMovies == null || data.maxSeries == null) {
                throw new AppError(
                    "Limited plans require maxMovies and maxSeries",
                    400
                );
            }

        } else {

            data.maxMovies = 0;
            data.maxSeries = 0;

        }

        return await Plan.create(data);
    }


    async update(id, data) {

        if (data.isLimited === true) {

            if (data.maxMovies == null || data.maxSeries == null) {
                throw new AppError(
                    "Limited plans require maxMovies and maxSeries",
                    400
                );
            }

        } else {

            data.maxMovies = 0;
            data.maxSeries = 0;

        }

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