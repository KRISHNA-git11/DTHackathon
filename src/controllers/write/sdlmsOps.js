'use strict';

const api = require('../../api');
const categories = require("../../categories");
const helpers = require('../helpers');
const winston = require('winston');
const db = require('../../database')

const sdlms = module.exports;

/**
* @description Eaglebuilder operations (GET, CREATE, UPDATE)
* @key req, res
*/

sdlms.getEB = async (req, res) => {
	helpers.formatApiResponse(200, res, await api.sdlms.getEagleBuilder(req));
	//res.status(200).json(await api.topics.getEagleBuilderData(req.params));
}

sdlms.createEB = async (req, res) => {
	helpers.formatApiResponse(200, res, await api.sdlms.createEagleBuilder(req));
}

sdlms.updateEB = async (req, res) => {
	helpers.formatApiResponse(200, res, await api.sdlms.updateEagleBuilder(req));
}

/**
* @description Get the session trcker - Eaglebuilder
*/

sdlms.sessionTracker = async (req, res) => {
	helpers.formatApiResponse(200, res, await api.sdlms.getSessionTracker(req));
}

/**
* @description Threadbuilder operations (GET, CREATE, UPDATE)
* @key req, res
*/

sdlms.getTB = async (req, res) => {
	helpers.formatApiResponse(200, res, await api.sdlms.getThreadBuilder(req));
}

sdlms.createTB = async (req, res) => {
	helpers.formatApiResponse(200, res, await api.sdlms.createThreadBuilder(req));
}

sdlms.updateTB = async (req, res) => {
	helpers.formatApiResponse(200, res, await api.sdlms.updateThreadBuilder(req));
}

/**
* @description Quizzes operations (GET, CREATE, UPDATE)
* @key req, res
*/

sdlms.getQZ = async (req, res) => {
	helpers.formatApiResponse(200, res, await api.sdlms.getQuiz(req));
}

sdlms.createQZ = async (req, res) => {
	helpers.formatApiResponse(200, res, await api.sdlms.createQuiz(req));
}

sdlms.updateQZ = async (req, res) => {
	helpers.formatApiResponse(200, res, await api.sdlms.updateQuiz(req));
}

/**
* @description DELETE the category and also the group associated with that category if the category type is "class"
* @key req, res
*/

sdlms.deleteCategoryWithTypeClass = async (req, res) => {
    const categorydata = await categories.getCategoryData(req.params.cid);

	await api.categories.delete(req, { cid: req.params.cid });
	await api.sdlms.deleteGroupBySlug(req, categorydata.associatedGroup);

	helpers.formatApiResponse(200, res);
};

/**
* @description For joining the class
*/

sdlms.joinClass = async (req, res) => { 
	helpers.formatApiResponse(200, res, await api.sdlms.joinClass(req));
}

sdlms.getAllAssets = async (req, res) => {
	helpers.formatApiResponse(200, res, await api.sdlms.getAllAssetsBasedOnUser(req));
}
sdlms.markPublic = async (req, res) => {
	helpers.formatApiResponse(200, res, await api.sdlms.markPublicBasedOnUser(req));
}
/**
 * @author imshawan
 * @description Feedback API controllers for managing feedbacks based on profile, assets, sessions
 * @param {object} req 
 * @param {object} res 
 */
sdlms.getFeedbacks = async (req, res) => { 
	helpers.formatApiResponse(200, res, await api.sdlms.getFeedbackData(req));
}

sdlms.createFeedback = async (req, res) => { 
	helpers.formatApiResponse(200, res, await api.sdlms.createFeedback(req));
}

sdlms.updateFeedback = async (req, res) => { 
	helpers.formatApiResponse(200, res, await api.sdlms.updateFeedback(req));
}

sdlms.deleteFeedback = async (req, res) => { 
	helpers.formatApiResponse(200, res, await api.sdlms.deleteFeedback(req));
}
/**
 * @author imshawan
 * @description Voting API controllers for voting on feedbacks
 * @param {object} req 
 * @param {object} res 
 */
sdlms.vote = async (req, res) => { 
	helpers.formatApiResponse(200, res, await api.sdlms.vote(req));
}