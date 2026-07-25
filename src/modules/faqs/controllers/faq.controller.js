const faqService = require("../services/faq.service");
const asyncHandler = require("../../../utils/asyncHandler");
const { successResponse } = require("../../../shared/helpers/api-response.helper");

class FAQController {

    createFAQ = asyncHandler(async (req, res) => {

        const faq = await faqService.createFAQ({
            question: req.body.question,
            answer: req.body.answer,
            isActive: req.body.isActive,
        });

        return successResponse(
            res,
            201,
            "FAQ created successfully",
            faq
        );
    });

    getFAQs = asyncHandler(async (req, res) => {

        const faqs = await faqService.getFAQs();

        return successResponse(
            res,
            200,
            "FAQs retrieved successfully",
            faqs
        );
    });

    updateFAQ = asyncHandler(async (req, res) => {

        const faq = await faqService.updateFAQ(req.params.id, {
            question: req.body.question,
            answer: req.body.answer,
            isActive: req.body.isActive,
        });

        return successResponse(
            res,
            200,
            "FAQ updated successfully",
            faq
        );
    });

    deleteFAQ = asyncHandler(async (req, res) => {

        await faqService.deleteFAQ(req.params.id);

        return successResponse(
            res,
            200,
            "FAQ deleted successfully"
        );
    });

}

module.exports = new FAQController();