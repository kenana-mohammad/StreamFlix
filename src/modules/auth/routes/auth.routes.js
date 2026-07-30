  const express = require("express");
  const router = express.Router();
  const authController = require("./../controllers/auth.controller");
  const asyncHandler = require("./../../../utils/asyncHandler");
  const auth = require("../../../middlewares/Auth");
  const {
      registerValidate,
      loginValidate,
      changeMyPasswordValidation
  } = require("./../validations/auth.validation");
const validatePrimaryProfile = require("../../../middlewares/validatePrimaryProfile");

  router.post('/register', [...registerValidate], asyncHandler(authController.register))
  router.post('/login', [...loginValidate], asyncHandler(authController.login))
  router.post('/logout', [auth], asyncHandler(authController.logout));

  router.put('/refresh-token', asyncHandler(authController.refreshToken));
  router.put('/change-password', [auth,validatePrimaryProfile, ...changeMyPasswordValidation], asyncHandler(authController.changeMyPassword));

  module.exports = router;