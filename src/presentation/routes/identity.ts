import { Router } from 'express';
import { makeInvoker } from 'awilix-express';
import { IdentityController } from '../controllers/indentity';

const identityController = makeInvoker(IdentityController);

const router = Router();

router.post('/register', identityController('register'));

router.post('/login', identityController('login'));

router.post('/logout', identityController('logout'));

export default router;
