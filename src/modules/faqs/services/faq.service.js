const FAQ = require("../models/faq.model");
const AppError = require("../../../shared/errors/AppError");

class FAQService {
    async createFAQ(data) {
        const faq = await FAQ.create({
            question: data.question,
            answer: data.answer,
            isActive: data.isActive ?? true,
        });

        return faq;
    }

    async getFAQs() {
        return await FAQ.find({ isActive: true })
            .sort({ createdAt: -1 });
    }

    async updateFAQ(id, data) {
        const faq = await FAQ.findById(id);

        if (!faq) {
            throw new AppError("FAQ not found", 404);
        }

        if (data.question !== undefined) {
            faq.question = data.question;
        }

        if (data.answer !== undefined) {
            faq.answer = data.answer;
        }

        if (data.isActive !== undefined) {
            faq.isActive = data.isActive;
        }

        await faq.save();

        return faq;
    }

    async deleteFAQ(id) {
        const faq = await FAQ.findById(id);

        if (!faq) {
            throw new AppError("FAQ not found", 404);
        }

        await faq.deleteOne();

        return true;
    }
}

module.exports = new FAQService();