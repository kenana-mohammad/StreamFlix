const planController = require("./plan.controller");

const createMockRes = () => {
    return {
        statusCode: 200,
        body: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this.body = data;
            return this;
        }
    };
};


const test = async () => {

    const req = {
        body: {
            name: "Premium",
            price: 20,
            duration: 30,
            maxDevices: 4,
            maxProfiles: 5,
            quality: "HD"
        },
        params: {
            id: "123"
        }
    };


    const res = createMockRes();


    await planController.create(req, res);


    console.log("Status:", res.statusCode);
    console.log("Response:", res.body);

};


test();