// const watchHistoryService = require("../services/watchHistory.service");

const watchHistoryService = require("../services/watchHistory.service");

// class WatchHistoryController {

//     saveProgress = async(req, res) => {

//         const result =
//             await watchHistoryService.saveProgress({

//                 userId: req._user.id,

//                 subscription: req.subscription,

//                 profileId: req.activeProfile._id,

//                 contentId: req.body.contentId,

//                 episodeId: req.body.episodeId,

//                 progressTime: req.body.progressTime,

//                 totalDuration: req.body.totalDuration

//             });

//         res.status(200).json({

//             success: true,

//             message: 'Watch progress saved successfully',

//             data: result

//         });
//     };


//     getHistory = async(req, res) => {

//         const result =
//             await WatchHistoryService.getHistory(
//                 req.activeProfile._id
//             );

//         res.status(200).json({

//             success: true,

//             data: result

//         });
//     };
// }

// module.exports =
//     new WatchHistoryController();


class WatchHistoryController {

    /**
     * PATCH /api/v1/history/progress
     * Body: { contentId, episodeId?, progressTime, totalDuration }
     *
     * تفترض أن الميدل وير التالية اشتغلت قبلها بهذا الترتيب:
     * authMiddleware -> checkActiveSubscription -> validateActiveProfile
     *
     * لذلك لا نحتاج أي تحقق ملكية هنا - كله جاهز في req.
     */
    saveProgress = async(req, res) => {
        const { contentId, episodeId, progressTime, totalDuration } = req.body;

        if (!contentId || progressTime === undefined || !totalDuration) {
            throw new AppError(
                'contentId, progressTime and totalDuration are required',
                400
            );
        }

        const history = await watchHistoryService.saveProgress({
            userId: req._user.id,
            subscription: req.subscription,
            profileId: req.activeProfile._id,
            contentId,
            episodeId: episodeId || null,
            progressTime,
            totalDuration
        });

        res.status(201).json({
            status: 'success',
            data: { history }
        });
    };

    /**
     * GET /api/v1/history
     */
    getHistory = async(req, res) => {
        const history = await watchHistoryService.getHistory(
            req.activeProfile._id
        );

        res.status(200).json({
            status: 'success',
            results: history.length,
            data: { history }
        });
    };

    /**
     * DELETE /api/v1/history/:contentId
     */
    deleteOne = async(req, res) => {
        const { contentId } = req.params;

        await watchHistoryService.deleteOne(req.activeProfile._id, contentId);

        res.status(204).json({ status: 'success', data: null });
    };

    /**
     * DELETE /api/v1/history
     */
    deleteAll = async(req, res) => {
        await watchHistoryService.deleteAll(req.activeProfile._id);

        res.status(204).json({ status: 'success', data: null });
    };
}

module.exports = new WatchHistoryController();

module.exports = new WatchHistoryController();