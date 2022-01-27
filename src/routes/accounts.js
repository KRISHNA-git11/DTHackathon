"use strict";

const winston = require("winston");
const nconf = require("nconf");

var helpers = require("./helpers");
var setupPageRoute = helpers.setupPageRoute;

module.exports = function (app, middleware, controllers) {
	var middlewares = [middleware.exposeUid, middleware.canViewUsers];
	var accountMiddlewares = [
		middleware.exposeUid,
		middleware.canViewUsers,
		middleware.checkAccountPermissions,
	];

	setupPageRoute(app, "/me", middleware, [], middleware.redirectMeToUserslug);
	setupPageRoute(app, "/me/*", middleware, [], middleware.redirectMeToUserslug);
	setupPageRoute(
		app,
		"/uid/:uid*",
		middleware,
		[],
		middleware.redirectUidToUserslug
	);

	setupPageRoute(
		app,
		"/user/:userslug",
		middleware,
		middlewares,
		controllers.accounts.profile.get
	);
	setupPageRoute(
		app,
		"/monitor",
		middleware,
		middlewares,
		controllers.monitor.get
	);
	setupPageRoute(
		app,
		"/live/:topicId",
		middleware,
		middlewares,
		controllers.live.get
	);
	setupPageRoute(
		app,
		"/user/:userslug/following",
		middleware,
		middlewares,
		controllers.accounts.follow.getFollowing
	);
	setupPageRoute(
		app,
		"/user/:userslug/followers",
		middleware,
		middlewares,
		controllers.accounts.follow.getFollowers
	);

	setupPageRoute(
		app,
		"/user/:userslug/posts",
		middleware,
		middlewares,
		controllers.accounts.posts.getPosts
	);
	setupPageRoute(
		app,
		"/user/:userslug/topics",
		middleware,
		middlewares,
		controllers.accounts.posts.getTopics
	);
	setupPageRoute(
		app,
		"/user/:userslug/best",
		middleware,
		middlewares,
		controllers.accounts.posts.getBestPosts
	);
	setupPageRoute(
		app,
		"/user/:userslug/groups",
		middleware,
		middlewares,
		controllers.accounts.groups.get
	);

	setupPageRoute(
		app,
		"/user/:userslug/categories",
		middleware,
		accountMiddlewares,
		controllers.accounts.categories.get
	);
	setupPageRoute(
		app,
		"/user/:userslug/bookmarks",
		middleware,
		accountMiddlewares,
		controllers.accounts.posts.getBookmarks
	);
	setupPageRoute(
		app,
		"/user/:userslug/watched",
		middleware,
		accountMiddlewares,
		controllers.accounts.posts.getWatchedTopics
	);
	setupPageRoute(
		app,
		"/user/:userslug/ignored",
		middleware,
		accountMiddlewares,
		controllers.accounts.posts.getIgnoredTopics
	);
	setupPageRoute(
		app,
		"/user/:userslug/upvoted",
		middleware,
		accountMiddlewares,
		controllers.accounts.posts.getUpVotedPosts
	);
	setupPageRoute(
		app,
		"/user/:userslug/downvoted",
		middleware,
		accountMiddlewares,
		controllers.accounts.posts.getDownVotedPosts
	);
	setupPageRoute(
		app,
		"/user/:userslug/edit",
		middleware,
		accountMiddlewares,
		controllers.accounts.edit.get
	);
	setupPageRoute(
		app,
		"/user/:userslug/edit/username",
		middleware,
		accountMiddlewares,
		controllers.accounts.edit.username
	);
	setupPageRoute(
		app,
		"/user/:userslug/edit/email",
		middleware,
		accountMiddlewares,
		controllers.accounts.edit.email
	);
	setupPageRoute(
		app,
		"/user/:userslug/edit/password",
		middleware,
		accountMiddlewares,
		controllers.accounts.edit.password
	);
	app.use("/.well-known/change-password", function (req, res) {
		res.redirect("/me/edit/password");
	});
	setupPageRoute(
		app,
		"/user/:userslug/info",
		middleware,
		accountMiddlewares,
		controllers.accounts.info.get
	);
	setupPageRoute(
		app,
		"/user/:userslug/settings",
		middleware,
		accountMiddlewares,
		controllers.accounts.settings.get
	);
	setupPageRoute(
		app,
		"/user/:userslug/uploads",
		middleware,
		accountMiddlewares,
		controllers.accounts.uploads.get
	);
	setupPageRoute(
		app,
		"/user/:userslug/consent",
		middleware,
		accountMiddlewares,
		controllers.accounts.consent.get
	);
	setupPageRoute(
		app,
		"/user/:userslug/blocks",
		middleware,
		accountMiddlewares,
		controllers.accounts.blocks.getBlocks
	);
	setupPageRoute(
		app,
		"/user/:userslug/sessions",
		middleware,
		accountMiddlewares,
		controllers.accounts.sessions.get
	);
	app.delete(
		"/api/user/:userslug/session/:uuid",
		[middleware.exposeUid],
		function (req, res, next) {
			// TODO: Remove this entire route in v1.16.0
			winston.warn(
				"[router] `/api/user/:userslug/session/:uuid` has been deprecated, use `DELETE /api/v3/users/:uid/sessions/:uuid` or `DELETE /api/v3/users/bySlug/:userslug/sessions/:uuid` instead"
			);
			if (!res.locals.uid) {
				return next();
			}
			res.redirect(
				`${nconf.get("relative_path")}/api/v3/users/${
					res.locals.uid
				}/sessions/${req.params.uuid}`
			);
		}
	);

	setupPageRoute(
		app,
		"/notifications",
		middleware,
		[middleware.authenticate],
		controllers.accounts.notifications.get
	);
	setupPageRoute(
		app,
		"/user/:userslug/chats/:roomid?",
		middleware,
		middlewares,
		controllers.accounts.chats.get
	);
	setupPageRoute(
		app,
		"/chats/:roomid?",
		middleware,
		[middleware.authenticate],
		controllers.accounts.chats.redirectToChat
	);
};
