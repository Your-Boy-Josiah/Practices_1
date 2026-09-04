const express = require('express');
const router = express.Router();

const UserController = require('../Controllers/User_Controller');
const { upload } = require('../Middleware/Upload');
const { validateBody } = require('../Middleware/Validation');
const {
  userCreateSchema,
  userLoginSchema,
  refreshTokenSchema,
} = require('../Utililty/ValidationSchemas');

router.post('/CreateUser', upload.single('avatar'), validateBody(userCreateSchema), UserController.CreateUser);
router.post('/LoginUser', validateBody(userLoginSchema), UserController.LoginUser);
router.post('/RefreshToken', validateBody(refreshTokenSchema), UserController.RefreshToken);

module.exports = router;
