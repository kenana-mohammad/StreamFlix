// const mongoose = require('mongoose');

// const WatchHistory = require('../models/WatchHistory');

// const SubscriptionConsumption = require(
//     '../../subscriptions/models/SubscriptionConsumption'
// );

// const SubscriptionUsage = require(
//     '../../subscriptions/models/SubscriptionUsage'
// );

// const Plan = require('../../plans/models/Plan');

// const Content = require('../../content/models/Content');

// const AppError = require(
//     '../../../shared/errors/AppError'
// );

// const {
//     CONTENT_TYPE
// } = require(
//     '../../../shared/constants/content-type.constant'
// );

// const CONSUMPTION_THRESHOLD = 0.05;

// const COMPLETION_THRESHOLD = 0.90;

// class WatchHistoryService {

//     async saveProgress({
//         userId,
//         subscription,
//         profileId,
//         contentId,
//         episodeId,
//         progressTime,
//         totalDuration
//     }) {

//         // 1
//         // جلب المحتوى
//         const content = await Content.findById(
//             contentId
//         );

//         if (!content) {
//             throw new AppError(
//                 'Content not found',
//                 404
//             );
//         }
//         console.log(content)
//             // 2
//             // تحديد نوع المحتوى
//         const contentType =
//             content.type === CONTENT_TYPE.MOVIE ?
//             'movie' :
//             'series';

//         // 3
//         // ابحث هل المحتوى استُهلك سابقاً
//         const consumed =
//             await SubscriptionConsumption.findOne({
//                 subscriptionId: subscription._id,

//                 contentId
//             });

//         // 4
//         // إذا لم يستهلك سابقاً
//         // نتحقق من 5%
//         if (!consumed) {

//             const reachedThreshold =
//                 progressTime >=
//                 totalDuration *
//                 CONSUMPTION_THRESHOLD;

//             if (reachedThreshold) {

//                 await this.consumeContent({
//                     userId,
//                     subscription,
//                     contentId,
//                     contentType
//                 });

//                 // زيادة المشاهدات الحقيقية
//                 await Content.findByIdAndUpdate(
//                     contentId, {
//                         $inc: {
//                             viewsCount: 1
//                         }
//                     }
//                 );
//             }
//         }

//         // 5
//         // تحديث WatchHistory
//         const completed =
//             progressTime >=
//             totalDuration *
//             COMPLETION_THRESHOLD;

//         const history =
//             await WatchHistory.findOneAndUpdate(

//                 {
//                     profileId,
//                     contentId,
//                     episodeId: episodeId || null
//                 },

//                 {
//                     progressTime,
//                     totalDuration,
//                     completed,
//                     watchedAt: new Date()
//                 },

//                 {
//                     upsert: true,
//                     new: true,
//                     setDefaultsOnInsert: true
//                 }
//             );

//         return history;
//     }


//     async consumeContent({
//         userId,
//         subscription,
//         contentId,
//         contentType
//     }) {

//         const session =
//             await mongoose.startSession();

//         try {

//             session.startTransaction();

//             // 1
//             // جلب الباقة
//             const plan =
//                 await Plan.findById(
//                     subscription.planId
//                 ).session(session);

//             if (!plan) {
//                 throw new AppError(
//                     'Plan not found',
//                     404
//                 );
//             }

//             // 2
//             // الباقة غير محدودة
//             if (!plan.isLimited) {

//                 await session.commitTransaction();

//                 return;
//             }

//             // 3
//             // هل استهلك المحتوى مسبقاً؟
//             const existing =
//                 await SubscriptionConsumption
//                 .findOne({
//                     subscriptionId: subscription._id,

//                     contentId
//                 })
//                 .session(session);

//             if (existing) {

//                 await session.commitTransaction();

//                 return;
//             }

//             // 4
//             // تحديد العداد والحد
//             const usedField =
//                 contentType === 'movie' ?
//                 'moviesUsedCount' :
//                 'seriesUsedCount';

//             const maxField =
//                 contentType === 'movie' ?
//                 'maxMovies' :
//                 'maxSeries';

//             const limit =
//                 plan[maxField];

//             // 5
//             // جلب أو إنشاء Usage
//             let usage =
//                 await SubscriptionUsage
//                 .findOneAndUpdate(

//                     {
//                         subscriptionId: subscription._id
//                     },

//                     {
//                         $setOnInsert: {
//                             subscriptionId: subscription._id,

//                             userId,

//                             moviesUsedCount: 0,

//                             seriesUsedCount: 0
//                         }
//                     },

//                     {
//                         upsert: true,
//                         new: true,
//                         session
//                     }
//                 );

//             // 6
//             // هل الحصة ممتلئة؟
//             if (
//                 usage[usedField] >=
//                 limit
//             ) {

//                 throw new AppError(
//                     'You have reached your subscription limit',
//                     403
//                 );
//             }

//             // 7
//             // زيادة العداد
//             usage =
//                 await SubscriptionUsage
//                 .findOneAndUpdate(

//                     {
//                         subscriptionId: subscription._id,

//                         [usedField]: {
//                             $lt: limit
//                         }
//                     },

//                     {
//                         $inc: {
//                             [usedField]: 1
//                         }
//                     },

//                     {
//                         new: true,
//                         session
//                     }
//                 );

//             if (!usage) {

//                 throw new AppError(
//                     'You have reached your subscription limit',
//                     403
//                 );
//             }

//             // 8
//             // تسجيل المحتوى كمستهلك
//             await SubscriptionConsumption.create(
//                 [{
//                     subscriptionId: subscription._id,

//                     userId,

//                     contentId,

//                     contentType
//                 }], {
//                     session
//                 }
//             );

//             // 9
//             // إنهاء Transaction
//             await session.commitTransaction();

//         } catch (error) {

//             await session.abortTransaction();

//             throw error;

//         } finally {

//             await session.endSession();
//         }
//     }


//     async getHistory(profileId) {

//         return WatchHistory.find({
//                 profileId,
//                 completed: false
//             })
//             .sort({
//                 watchedAt: -1
//             })
//             .populate(
//                 'contentId',
//                 'title poster type'
//             )
//             .populate(
//                 'episodeId',
//                 'title episodeNumber duration'
//             );
//     }
// }

// module.exports =
//     new WatchHistoryService();
// const mongoose = require('mongoose');

// const WatchHistory = require('../models/WatchHistory');
// const useTransaction = process.env.USE_TRANSACTIONS === 'true';

// const SubscriptionConsumption = require(
//     '../../subscriptions/models/SubscriptionConsumption'
// );

// const SubscriptionUsage = require(
//     '../../subscriptions/models/SubscriptionUsage'
// );

// const Plan = require('../../plans/models/Plan');

// const Content = require('../../content/models/Content');

// const AppError = require(
//     '../../../shared/errors/AppError'
// );

// const {
//     CONTENT_TYPE
// } = require(
//     '../../../shared/constants/content-type.constant'
// );

// // نسبة الوصول التي تُحسب عندها "مشاهدة حقيقية" (لعدّ المشاهدات ولاستهلاك الكوتا)
// const CONSUMPTION_THRESHOLD = 0.05;

// // نسبة الوصول التي تُعتبر عندها المشاهدة "مكتملة"
// const COMPLETION_THRESHOLD = 0.90;

// class WatchHistoryService {

//     /**
//      * ملاحظة: profileId يأتي جاهزاً من req.activeProfile._id
//      * (بعد أن تحقق منه validateActiveProfile middleware) - لا نعيد التحقق هنا.
//      * نفس الشيء لـ userId و subscription: يأتيان من الـ middlewares (req._user, req.subscription).
//      */
//     async saveProgress({
//         userId,
//         subscription,
//         profileId,
//         contentId,
//         episodeId,
//         progressTime,
//         totalDuration
//     }) {

//         // 1. جلب المحتوى والتأكد من وجوده
//         const content = await Content.findById(contentId);
//         console.log(content)
//         if (!content) {
//             throw new AppError('Content not found', 404);
//         }

//         const contentType =
//             content.type === CONTENT_TYPE.MOVIE ? 'movie' : 'series';

//         const reachedThreshold =
//             progressTime >= totalDuration * CONSUMPTION_THRESHOLD;

//         if (reachedThreshold) {

//             // نجيب السجل القديم *قبل* أي تحديث - عشان نعرف
//             // هل هذا الـ Profile بالذات وصل الحد من قبل أو لأ
//             const existingHistory = await WatchHistory.findOne({
//                 profileId,
//                 contentId,
//                 episodeId: episodeId || null
//             });

//             let isRewatchAfterCompletion = false;

//             if (existingHistory && existingHistory.completed === true) {
//                 isRewatchAfterCompletion = true;
//             }

//             const isFirstTimeForThisProfile = !existingHistory ||
//                 isRewatchAfterCompletion ||
//                 existingHistory.progressTime < totalDuration * CONSUMPTION_THRESHOLD;
//             if (isFirstTimeForThisProfile) {
//                 await Content.findByIdAndUpdate(contentId, {
//                     $inc: { viewsCount: 1 }
//                 });
//             }


//             const consumed = await SubscriptionConsumption.findOne({
//                 subscriptionId: subscription._id,
//                 contentId
//             });

//             if (!consumed) {
//                 await this.consumeContent({
//                     userId,
//                     subscription,
//                     contentId,
//                     contentType,
//                     consumedByProfileId: profileId
//                 });
//             }
//         }

//         // تحديث WatchHistory (Progress + Resume) - يصير دائماً
//         const completed =
//             progressTime >= totalDuration * COMPLETION_THRESHOLD;

//         const history = await WatchHistory.findOneAndUpdate({
//             profileId,
//             contentId,
//             episodeId: episodeId || null
//         }, {
//             progressTime,
//             totalDuration,
//             completed,
//             watchedAt: new Date()
//         }, {
//             upsert: true,
//             new: true,
//             setDefaultsOnInsert: true
//         });

//         return history;
//     }

//     /**
//      * استهلاك الكوتا (Household Quota) - يدعم باقات محدودة (isLimited: true)
//      * وباقات غير محدودة (isLimited: false).
//      */
//     async consumeContent({
//         userId,
//         subscription,
//         contentId,
//         contentType,
//         consumedByProfileId
//     }) {

//         const session = useTransaction ? await mongoose.startSession() : null;
//         if (session) session.startTransaction();

//         try {
//             if (session) session.startTransaction();

//             const plan = await Plan.findById(subscription.planId).session(session);

//             if (!plan) {
//                 throw new AppError('Plan not found', 404);
//             }

//             // باقة غير محدودة → لا يوجد أي فحص كوتا، ولا يُسجَّل استهلاك
//             if (!plan.isLimited) {
//                 if (session) await session.commitTransaction();
//                 return;
//             }

//             const existing = await SubscriptionConsumption.findOne({
//                 subscriptionId: subscription._id,
//                 contentId
//             }).session(session);

//             if (existing) {
//                 if (session) await session.commitTransaction();
//                 return;
//             }

//             const usedField =
//                 contentType === 'movie' ? 'moviesUsedCount' : 'seriesUsedCount';

//             const maxField =
//                 contentType === 'movie' ? 'maxMovies' : 'maxSeries';

//             const limit = plan[maxField];

//             let usage = await SubscriptionUsage.findOneAndUpdate({ subscriptionId: subscription._id }, {
//                 $setOnInsert: {
//                     subscriptionId: subscription._id,
//                     userId,
//                     moviesUsedCount: 0,
//                     seriesUsedCount: 0
//                 }
//             }, { upsert: true, new: true, session });

//             if (usage[usedField] >= limit) {
//                 throw new AppError(
//                     'You have reached your subscription limit',
//                     403
//                 );
//             }

//             usage = await SubscriptionUsage.findOneAndUpdate({
//                 subscriptionId: subscription._id,
//                 [usedField]: { $lt: limit }
//             }, {
//                 $inc: {
//                     [usedField]: 1
//                 }
//             }, { new: true, session });

//             if (!usage) {
//                 throw new AppError(
//                     'You have reached your subscription limit',
//                     403
//                 );
//             }

//             await SubscriptionConsumption.create(
//                 [{
//                     subscriptionId: subscription._id,
//                     userId,
//                     contentId,
//                     contentType,
//                     consumedByProfileId
//                 }], { session }
//             );

//             if (session) await session.commitTransaction();

//         } catch (error) {
//             if (session) await session.abortTransaction();

//             // E11000: محاولة تسجيل استهلاك مكرر لنفس subscriptionId+contentId
//             // (Race Condition من Requests متزامنة). هذا ليس خطأ حقيقي -
//             // معناه ببساطة إن محتوى ثاني (متزامن) سبقنا بتسجيل نفس الاستهلاك،
//             // فنتجاهله بأمان بدل ما نفشل الطلب بالكامل.
//             if (error.code === 11000) {
//                 return;
//             }

//             throw error;

//         } finally {
//             if (session) await session.endSession();
//         }
//     }

//     async getHistory(profileId) {
//         return WatchHistory.find({ profileId, completed: false })
//             .sort({ watchedAt: -1 })
//             .populate('contentId', 'title poster type viewsCount')
//             .populate('episodeId', 'title episodeNumber duration');
//     }

//     async deleteOne(profileId, contentId) {
//         const result = await WatchHistory.findOneAndDelete({
//             profileId,
//             contentId
//         });

//         if (!result) {
//             throw new AppError('History record not found', 404);
//         }

//         return result;
//     }

//     async deleteAll(profileId) {
//         return WatchHistory.deleteMany({ profileId });
//     }
// }

// module.exports = new WatchHistoryService();const mongoose = require('mongoose');

const WatchHistory = require('../models/WatchHistory');

const SubscriptionConsumption = require(
    '../../subscriptions/models/SubscriptionConsumption'
);

const SubscriptionUsage = require(
    '../../subscriptions/models/SubscriptionUsage'
);

const Plan = require(
    '../../plans/models/Plan'
);

const Content = require(
    '../../content/models/Content'
);

const AppError = require(
    '../../../shared/errors/AppError'
);

const {
    CONTENT_TYPE
} = require(
    '../../../shared/constants/content-type.constant'
);

const CONSUMPTION_THRESHOLD = 0.05;

const COMPLETION_THRESHOLD = 0.90;

const USE_TRANSACTIONS =
    process.env.USE_TRANSACTIONS === 'true';


class WatchHistoryService {

    /**
     * حفظ تقدم المشاهدة
     *
     * مسؤول عن:
     *
     * 1. جلب المحتوى
     * 2. معرفة هل هذه مشاهدة حقيقية
     * 3. زيادة viewsCount عند الحاجة
     * 4. استهلاك الحصة عند الحاجة
     * 5. تحديث WatchHistory
     */
    async saveProgress({
        userId,
        subscription,
        profileId,
        contentId,
        episodeId,
        progressTime,
        totalDuration
    }) {

        // --------------------------------
        // 1. جلب المحتوى
        // --------------------------------

        const content =
            await Content.findById(contentId);

        if (!content) {
            throw new AppError(
                'Content not found',
                404
            );
        }

        // --------------------------------
        // 2. تحديد نوع المحتوى
        // --------------------------------

        const contentType =
            content.type === CONTENT_TYPE.MOVIE ?
            'movie' :
            'series';


        // --------------------------------
        // 3. جلب سجل المشاهدة القديم
        // --------------------------------

        const existingHistory =
            await WatchHistory.findOne({
                profileId,
                contentId,
                episodeId: episodeId || null
            });


        // --------------------------------
        // 4. هل وصل 5%؟
        // --------------------------------

        const reachedThreshold =
            progressTime >=
            totalDuration * CONSUMPTION_THRESHOLD;


        // --------------------------------
        // 5. هل اكتمل المحتوى؟
        // --------------------------------

        const completed =
            progressTime >=
            totalDuration * COMPLETION_THRESHOLD;


        // --------------------------------
        // 6. تحديد هل هذه مشاهدة حقيقية جديدة
        // --------------------------------

        let shouldIncrementView = false;


        /**
         * الحالة الأولى:
         *
         * لا يوجد WatchHistory
         * ووصل المستخدم إلى 5%
         *
         * = أول مشاهدة حقيقية
         */

        if (!existingHistory &&
            reachedThreshold
        ) {
            shouldIncrementView = true;
        }


        /**
         * الحالة الثانية:
         *
         * يوجد سجل
         * لكنه لم يصل سابقاً إلى 5%
         *
         * والآن وصل إلى 5%
         *
         * = أول مشاهدة حقيقية
         */

        if (
            existingHistory &&
            existingHistory.progressTime <
            totalDuration *
            CONSUMPTION_THRESHOLD &&
            reachedThreshold
        ) {
            shouldIncrementView = true;
        }


        /**
         * الحالة الثالثة:
         *
         * كان المحتوى مكتمل
         * ورجع المستخدم وبدأ من البداية
         *
         * = إعادة مشاهدة
         */

        if (
            existingHistory &&
            existingHistory.completed === true &&
            progressTime <=
            totalDuration *
            CONSUMPTION_THRESHOLD
        ) {
            shouldIncrementView = true;
        }


        // --------------------------------
        // 7. زيادة عدد المشاهدات
        // --------------------------------

        if (shouldIncrementView) {

            await Content.findByIdAndUpdate(
                contentId, {
                    $inc: {
                        viewsCount: 1
                    }
                }
            );
        }


        // --------------------------------
        // 8. فحص استهلاك الاشتراك
        // --------------------------------

        const consumed =
            await SubscriptionConsumption.findOne({
                subscriptionId: subscription._id,

                contentId
            });


        /**
         * إذا وصل 5%
         * والمحتوى لم يُستهلك سابقاً
         *
         * نحاول استهلاكه
         */

        if (
            reachedThreshold &&
            !consumed
        ) {

            await this.consumeContent({
                userId,
                subscription,
                contentId,
                contentType,
                consumedByProfileId: profileId
            });
        }


        // --------------------------------
        // 9. تحديث WatchHistory
        // --------------------------------

        const history =
            await WatchHistory.findOneAndUpdate({
                profileId,
                contentId,
                episodeId: episodeId || null
            }, {
                progressTime,
                totalDuration,
                completed,
                watchedAt: new Date()
            }, {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            });


        return {
            history,

            viewIncremented: shouldIncrementView
        };
    }


    /**
     * استهلاك المحتوى من حصة الاشتراك
     *
     * هذه العملية فقط للباقات المحدودة.
     *
     * إذا الباقة Unlimited:
     *
     * لا نزيد Usage
     * لا ننشئ Consumption
     */
    async consumeContent({
        userId,
        subscription,
        contentId,
        contentType,
        consumedByProfileId
    }) {

        const session =
            USE_TRANSACTIONS ?
            await mongoose.startSession() :
            null;


        try {

            if (session) {
                session.startTransaction();
            }


            // --------------------------------
            // 1. جلب الباقة
            // --------------------------------

            let planQuery =
                Plan.findById(
                    subscription.planId
                );

            if (session) {
                planQuery =
                    planQuery.session(session);
            }

            const plan =
                await planQuery;


            if (!plan) {
                throw new AppError(
                    'Plan not found',
                    404
                );
            }


            // --------------------------------
            // 2. الباقة غير محدودة
            // --------------------------------

            if (!plan.isLimited) {

                if (session) {
                    await session.commitTransaction();
                }

                return {
                    consumed: false,
                    reason: 'unlimited_plan'
                };
            }


            // --------------------------------
            // 3. هل المحتوى مستهلك سابقاً؟
            // --------------------------------

            let existingQuery =
                SubscriptionConsumption.findOne({
                    subscriptionId: subscription._id,

                    contentId
                });

            if (session) {
                existingQuery =
                    existingQuery.session(session);
            }

            const existing =
                await existingQuery;


            if (existing) {

                if (session) {
                    await session.commitTransaction();
                }

                return {
                    consumed: false,
                    alreadyConsumed: true
                };
            }


            // --------------------------------
            // 4. تحديد العداد
            // --------------------------------

            const usedField =
                contentType === 'movie' ?
                'moviesUsedCount' :
                'seriesUsedCount';


            const maxField =
                contentType === 'movie' ?
                'maxMovies' :
                'maxSeries';


            const limit =
                plan[maxField];


            // --------------------------------
            // 5. إنشاء Usage إذا غير موجود
            // --------------------------------

            let usage =
                await SubscriptionUsage
                .findOneAndUpdate({
                    subscriptionId: subscription._id
                }, {
                    $setOnInsert: {
                        subscriptionId: subscription._id,

                        userId,

                        moviesUsedCount: 0,

                        seriesUsedCount: 0
                    }
                }, {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                    session
                });


            // --------------------------------
            // 6. التأكد من وجود حصة
            // --------------------------------

            if (
                usage[usedField] >=
                limit
            ) {

                throw new AppError(
                    'You have reached your subscription limit',
                    403
                );
            }


            // --------------------------------
            // 7. زيادة العداد بشكل ذري
            // --------------------------------

            usage =
                await SubscriptionUsage
                .findOneAndUpdate({
                    subscriptionId: subscription._id,

                    [usedField]: {
                        $lt: limit
                    }
                }, {
                    $inc: {
                        [usedField]: 1
                    }
                }, {
                    new: true,
                    session
                });


            if (!usage) {

                throw new AppError(
                    'You have reached your subscription limit',
                    403
                );
            }


            // --------------------------------
            // 8. تسجيل المحتوى المستهلك
            // --------------------------------

            await SubscriptionConsumption.create(
                [{
                    subscriptionId: subscription._id,

                    userId,

                    contentId,

                    contentType,

                    consumedByProfileId
                }], {
                    session
                }
            );


            // --------------------------------
            // 9. Commit
            // --------------------------------

            if (session) {
                await session.commitTransaction();
            }


            return {
                consumed: true
            };


        } catch (error) {

            if (session) {
                await session.abortTransaction();
            }


            /**
             * Race Condition:
             *
             * طلبان وصلا بنفس الوقت
             * واحد منهما سجل المحتوى
             * والثاني حاول يسجله مرة ثانية
             */

            if (error.code === 11000) {

                return {
                    consumed: false,
                    alreadyConsumed: true
                };
            }


            throw error;


        } finally {

            if (session) {
                await session.endSession();
            }
        }
    }


    /**
     * GET History
     *
     * يعرض فقط سجل البروفايل الحالي
     */

    async getHistory(profileId) {

        return WatchHistory
            .find({
                profileId
            })
            .sort({
                watchedAt: -1
            })
            .populate(
                'contentId',
                'title poster type viewsCount'
            )
            .populate(
                'episodeId',
                'title episodeNumber duration'
            );
    }


    /**
     * حذف عنصر من History
     *
     * ملاحظة:
     * حذف History لا يعيد quota.
     */

    async deleteOne(
        profileId,
        contentId,
        episodeId = null
    ) {

        const result =
            await WatchHistory.findOneAndDelete({
                profileId,
                contentId,
                episodeId
            });


        if (!result) {

            throw new AppError(
                'History record not found',
                404
            );
        }


        return result;
    }


    /**
     * حذف كل History للبروفايل
     */

    async deleteAll(profileId) {

        return WatchHistory.deleteMany({
            profileId
        });
    }
}


module.exports =
    new WatchHistoryService();