const { successResponse, errorResponse } = require('../../../shared/helpers/api-response.helper');
const ProfileService = require('../services/profile.services');

class ProfileController {

    /**
     * Retrieve all profiles belonging to the authenticated user.
     */
    getAll = async(req, res) => {
        const userId = req._user.id;
        const { query } = req.query;

        const profiles = await ProfileService.getAll(userId, query);

        return successResponse(res, 200, "Profiles retrieved successfully", profiles);
    }

    /**
     * Create a new sub-profile.
     */
    createProfile = async(req, res) => {
        const userId = req._user.id;
        const { name, pin, avatar, isKids, minAge } = req.body;
        const profileData = { name, pin, avatar, isKids, minAge };

        const profile = await ProfileService.create(userId, profileData);

        return successResponse(res, 201, "Profile created successfully", profile);
    }

    /**
     * Update an existing profile by ID (Administrative use).
     */
    updateProfile = async(req, res) => {
        const id = req.params.id;
        const { name, avatar, isKids, minAge } = req.body;
        const profileData = { name, avatar, isKids, minAge };

        const profile = await ProfileService.update(id, profileData);
        return successResponse(res, 200, "Profile updated successfully", profile);
    }

    /**
     * Update the currently authenticated profile's own details using the profile token.
     */
    updateMe = async(req, res) => {
        const profileId = req.currentProfileId; // Extracted from profile token via middleware
        const { name, avatar, isKids, minAge } = req.body;
        const profileData = { name, avatar, isKids, minAge };

        const profile = await ProfileService.updateMe(profileId, profileData);
        return successResponse(res, 200, "Profile updated successfully", profile);
    }

    /**
     * Select a specific profile and issue a Profile JWT token.
     */
    selectProfile = async(req, res) => {
        const id = req.params.id;
        const pin = req.body.pin;

        const profile = await ProfileService.select(id, pin);
        return successResponse(res, 200, "Profile selected successfully", profile);
    }

    /**
     * Verify a profile's PIN code.
     */
    verifyPIN = async(req, res) => {
        const pin = req.body.pin;
        const id = req.params.id;

        await ProfileService.verifyPIN(id, pin);

        return successResponse(res, 200, "PIN is verified successfully");
    }

    /**
     * Add a PIN to a profile that doesn't have one.
     */
    addPIN = async(req, res) => {
        const id = req.params.id;
        const { pin } = req.body;

        await ProfileService.addPIN(id, pin);

        return successResponse(res, 200, "PIN added successfully");
    }

    /**
     * Change an existing profile PIN.
     */
    changePIN = async(req, res) => {
        const id = req.params.id;
        const { oldPin, newPin } = req.body;

        await ProfileService.changePIN(id, oldPin, newPin);

        return successResponse(res, 200, "PIN is changed successfully");
    }

    /**
     * Toggle a profile's active/deactivated status.
     */
    toggleStatus = async(req, res) => {
            const id = req.params.id;

            const profile = await ProfileService.toggleStatus(id);
            return successResponse(res, 200, `Status has been changed successfully to ${profile.status}`);
        }
        /**
         * Change PIN for the currently logged-in profile using its profile token.
         */
    changeMyPIN = async(req, res) => {
        const profileId = req.currentProfileId; // مأخوذ من توكن البروفايل عبر الميدلوير
        const { oldPin, newPin } = req.body;

        await ProfileService.changeMyPIN(profileId, oldPin, newPin);

        return successResponse(res, 200, "Your PIN has been changed successfully");
    }

    /**
     * Delete a sub-profile and clean up its associated data.
     */
    deleteProfile = async(req, res) => {
        const id = req.params.id;

        await ProfileService.remove(id);

        return successResponse(res, 200, "Profile deleted successfully");
    }
}

module.exports = new ProfileController();