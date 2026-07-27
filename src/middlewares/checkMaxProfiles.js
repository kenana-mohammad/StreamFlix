const Plan = require("../modules/plans/models/Plan")
const Profile = require("../modules/profiles/models/Profile")
const AppError = require("../shared/errors/AppError")

const checkMaxProfiles = async (req, res, next) => {
    try{
     const planId = req.subscription?.planId
     if (!planId) {
        throw new AppError("No subscription plan found" , 400)
     }
     const userId = req._user.id;
     const plan = await Plan.findById(planId)
     const countProfiles = await Profile.countDocuments({ userId });

     if(countProfiles >= plan.maxProfiles){
            throw new AppError(
                `You've reached the maximum number of profiles (${plan.maxProfiles}) for your plan. Delete or upgrade to add more.`, 
                400
            );
        }
         req.remainingProfiles = plan.maxProfiles - countProfiles;
         req.plan = plan;
         //console.log(`The number of remainig Profiles :${req.remainingProfiles}`);

     next();

     } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error during Max Profiles verification",
            error: error.message
        });
    }
}

module.exports = {
    checkMaxProfiles
}