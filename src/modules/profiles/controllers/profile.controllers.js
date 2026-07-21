const { successResponse, errorResponse } = require('../../../shared/helpers/api-response.helper');
const ProfileService = require('../services/profile.services');



class ProfileController {

     getAll = async (req, res) => {
      const userId = req._user.id;
      const { query } = req.query;
      
      const profiles = await ProfileService.getAll(userId , query);

         return successResponse(res, 200,
                "Profiles retrieved successfully",
                profiles
              )
     }
    

     createProfile = async (req, res) => {
        const userId = req._user.id;
        const { name , pin, avatar , isKids , minAge } = req.body;
        const profileData = {name , pin, avatar , isKids , minAge};
        
        const profile = await ProfileService.create(userId, profileData)

         return successResponse(res, 201,
             " Profile created successfully" ,
            profile)
     };

     updateProfile = async (req , res) => {
      const id = req.params.id
       const { name , avatar , isKids , minAge } = req.body;
       const profileData = { name , avatar , isKids , minAge }
       const profile = await ProfileService.update(id ,profileData)
        return successResponse(res, 200,
                "Profile updated successfully",q
                profile
              )
     }

     selectProfile = async (req, res) => {
        const id = req.params.id;
        const pin = req.body.pin;
        
        const profile = await ProfileService.select(id , pin);
        return successResponse(res, 200,
          "Profile selected successfully",
          profile
        )
      }

      verifyPIN = async (req, res) => {
        const  pin  = req.body.pin;
        const id = req.params.id;

        await ProfileService.verifyPIN(id, pin)
         
          return successResponse(res, 200,
          "PIN is verified successfullly"
        )

      }

      addPIN = async (req, res) => {
        const id = req.params.id;
        const { pin } = req.body;

         await ProfileService.addPIN(id, pin);

        return successResponse(res, 200,
          "PIN added successfullly"
        )
      }

      changePIN = async (req, res) => {
        const id = req.params.id;
        const { oldPin , newPin } = req.body;
        
         await ProfileService.changePIN(id, oldPin, newPin)
          return successResponse(res, 200,
          "PIN is changed successfullly"
        )

      }

     deleteProfile = async (req ,res) => {
      const id = req.params.id
      
      await ProfileService.delete(id)

        return successResponse(res, 200,
          "Profile deleted successfully"
        )

     }
}

module.exports = new ProfileController();