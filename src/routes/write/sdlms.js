"use strict";

const router = require("express").Router();
const middleware = require("../../middleware");
const controllers = require("../../controllers");
const routeHelpers = require("../helpers");

const setupApiRoute = routeHelpers.setupApiRoute;

/**
 * @author imshawan
 * @description This file handles all the custom routes that are required for the SDLMS to function. 
 */

module.exports = function () {
	const middlewares = [middleware.authenticate];

	setupApiRoute(router, 'post', '/monitor', [...middlewares, middleware.authenticateOrGuest, middleware.checkRequired.bind(null, ['tid', 'category', 'schedule', 'members'])], controllers.monitor.create);
	setupApiRoute(router, 'put', '/monitor', [...middlewares, middleware.authenticateOrGuest, middleware.checkRequired.bind(null, ['tid'])], controllers.monitor.update);
	setupApiRoute(router, 'put', '/monitor/:tid', [...middlewares, middleware.authenticateOrGuest, middleware.checkRequired.bind(null, ['isLive'])], controllers.monitor.updateClassStatus);

	setupApiRoute(router, 'put', '/sessions/:tid/join', [...middlewares, middleware.authenticateOrGuest], controllers.write.sdlms.joinClass);
	setupApiRoute(router, 'get', '/attendance/:tid', [middleware.authenticateOrGuest], controllers.live.getAttendance);
	setupApiRoute(router, 'get', '/members/:tid', [middleware.authenticateOrGuest], controllers.live.getMembers);

	setupApiRoute(router, 'get', '/:tid/eaglebuilder', [middleware.authenticateOrGuest], controllers.write.sdlms.getEB);
	setupApiRoute(router, 'post', '/:tid/eaglebuilder', [...middlewares, middleware.authenticateOrGuest, middleware.checkRequired.bind(null, ['meta', 'tracks'])], controllers.write.sdlms.createEB);
	setupApiRoute(router, 'put', '/:tid/eaglebuilder/:id', [...middlewares, middleware.authenticateOrGuest, middleware.checkRequired.bind(null, ['meta', 'tracks'])], controllers.write.sdlms.updateEB);

	setupApiRoute(router, 'get', '/:tid/tracker', [middleware.authenticateOrGuest], controllers.write.sdlms.sessionTracker);

	setupApiRoute(router, 'get', '/:tid/threadbuilder/(:id)?', [middleware.authenticateOrGuest], controllers.write.sdlms.getTB);
	setupApiRoute(router, 'post', '/:tid/threadbuilder', [...middlewares, middleware.authenticateOrGuest, middleware.checkRequired.bind(null, ['data'])], controllers.write.sdlms.createTB);
	setupApiRoute(router, 'put', '/:tid/threadbuilder/:id', [...middlewares, middleware.authenticateOrGuest, middleware.checkRequired.bind(null, ['data'])], controllers.write.sdlms.updateTB);

	setupApiRoute(router, 'put', '/:tid/public/:id', [...middlewares, middleware.authenticateOrGuest], controllers.write.sdlms.markPublic);

	setupApiRoute(router, 'get', '/:tid/quiz/(:id)?', [middleware.authenticateOrGuest], controllers.write.sdlms.getQZ);
	setupApiRoute(router, 'post', '/:tid/quiz', [...middlewares, middleware.authenticateOrGuest, middleware.checkRequired.bind(null, ['data'])], controllers.write.sdlms.createQZ);
	setupApiRoute(router, 'put', '/:tid/quiz/:id', [...middlewares, middleware.authenticateOrGuest, middleware.checkRequired.bind(null, ['data'])], controllers.write.sdlms.updateQZ);

	setupApiRoute(router, 'get', '/:tid/assets/:uid', [middleware.authenticateOrGuest], controllers.write.sdlms.getAllAssets);

	setupApiRoute(router, 'put', '/groups/:slug/membership/:uid', [...middlewares, middleware.assert.group], controllers.write.groups.join);
	setupApiRoute(router, 'delete', '/groups/:slug/membership/:uid', [...middlewares, middleware.assert.group], controllers.write.groups.leave);

	setupApiRoute(router, 'get', '/reactions', [middleware.authenticateOrGuest], controllers.reaction.getAllReactions);
	setupApiRoute(router, 'get', '/reactions/:tid', [middleware.authenticateOrGuest], controllers.reaction.getReactions);
	setupApiRoute(router, 'put', '/reactions/:tid/:rid', [...middlewares, middleware.authenticateOrGuest], controllers.reaction.react);

	setupApiRoute(router, 'delete', '/categories/:cid', [...middlewares], controllers.write.sdlms.deleteCategoryWithTypeClass);

	setupApiRoute(router, 'get', '/feedbacks', [middleware.authenticateOrGuest], controllers.write.sdlms.getFeedbacks);
	setupApiRoute(router, 'post', '/feedbacks', [...middlewares, middleware.authenticateOrGuest], controllers.write.sdlms.createFeedback);
	setupApiRoute(router, 'put', '/feedbacks/:id', [...middlewares, middleware.authenticateOrGuest], controllers.write.sdlms.updateFeedback);
	setupApiRoute(router, 'delete', '/feedbacks/:id', [...middlewares, middleware.authenticateOrGuest], controllers.write.sdlms.deleteFeedback);

	setupApiRoute(router, 'put', '/feedbacks/:id/vote', [...middlewares, middleware.authenticateOrGuest], controllers.write.sdlms.vote);

	return router;
}