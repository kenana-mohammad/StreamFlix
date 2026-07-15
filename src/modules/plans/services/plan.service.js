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
        const plan = await Plan.findById(id);
        if (!plan) {
            throw new AppError("Plan not found", 404);
        }
        return plan
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

        return await Plan.create({
            name: data.name,
            description: data.description,
            price: data.price,
            duration: data.duration,
            maxDevices: data.maxDevices,
            maxProfiles: data.maxProfiles,
            quality: data.quality,
            isLimited: data.isLimited ?? false,
            maxMovies: data.maxMovies,
            maxSeries: data.maxSeries
        });
    }

    async update(id, data) {
        const plan = await Plan.findById(id);
        if (!plan) {
            throw new AppError("Plan not found", 404);
        }

        plan.name = data.name ?? plan.name;
        plan.description = data.description ?? plan.description;
        plan.price = data.price ?? plan.price;
        plan.duration = data.duration ?? plan.duration;
        plan.maxDevices = data.maxDevices ?? plan.maxDevices;
        plan.maxProfiles = data.maxProfiles ?? plan.maxProfiles;
        plan.quality = data.quality ?? plan.quality;

        plan.isLimited = data.isLimited ?? plan.isLimited;

        if (plan.isLimited) {
            plan.maxMovies = data.maxMovies ?? plan.maxMovies;
            plan.maxSeries = data.maxSeries ?? plan.maxSeries;

            if (plan.maxMovies == null || plan.maxSeries == null) {
                throw new AppError("Limited plans require maxMovies and maxSeries", 400);
            }
        } else {
            plan.maxMovies = 0;
            plan.maxSeries = 0;
        }

        return await plan.save();
    }


    async remove(id) {
        const deletedPlan = await Plan.findByIdAndDelete(id);

        if (!deletedPlan) {
            throw new AppError("Plan not found, cannot delete", 404);
        }

        return deletedPlan;
    }


    async toggleStatus(id) {

        const plan = await Plan.findById(id);

        if (!plan) {
            throw new AppError("Plan not found", 404);
        }

        plan.isActive = !plan.isActive;

        await plan.save();

        return plan;
    }

}

module.exports = new PlanService();
