"use strict";

const winston = require("winston");
const db = require("../database");
const user = require("../user");
const helpers = require('../controllers/helpers');
const groups = require('../groups');
const privileges = require('../privileges');

const monitorBoardController = module.exports;

monitorBoardController.get = async function (req, res, next) {
	const fields = [
		"uid",
		"username",
		"fullname",
		"userslug",
		"picture",
		"status"
	]
	const monitorBoardData = {};

	var [userData, userGroupData, isTeacher, isStudent, Sessions] = await Promise.all([
		user.getUsersFields([req.uid], fields), 
		groups.getUserGroups([req.uid]),
		privileges.users.isTeacher(req.uid),
		privileges.users.isStudent(req.uid),
		db.findFields({type: "session"})

	])

	userGroupData = userGroupData[0];
	const userGroupNames = userGroupData.filter(Boolean).map(group => group.name);
	userData[0].userGroups = userGroupNames;

	monitorBoardData.title = "Monitor Board";
	monitorBoardData.user = userData;
	monitorBoardData.isTeacher = isTeacher;
	monitorBoardData.isStudent = isStudent;
	monitorBoardData.Sessions = Sessions.filter(elem => elem.members.includes(parseInt(req.uid)))

	res.render("monitor", monitorBoardData);
};

monitorBoardController.create = async function (req, res, next) {
	const tid = await db.incrObjectField('global', 'nextTid');
	const payload = {
		uid: parseInt(req.uid),
		tid: parseInt(tid),
		type: "session",
		category: req.body.category,
		topic: req.body.topic ? req.body.topic : "",
		relatedSessions: req.body.relatedSessions ? req.body.relatedSessions : 'No related sessions',
		schedule: parseInt(req.body.schedule),
		members: JSON.parse(req.body.members)
	}
	await db.setField(payload);
	helpers.formatApiResponse(200, res, {});
}

monitorBoardController.update = async function (req, res, next) { 
	const payload = {};
	const key = {
		tid: parseInt(req.body.tid),
		type: "session"
	}
	if (req.body.topic) {
		payload.topic = req.body.topic;
	}
	if (req.body.schedule) {
		payload.schedule = parseInt(req.body.schedule);
	}
	helpers.formatApiResponse(200, res, await update(key, payload));
}


monitorBoardController.updateClassStatus = async function (req, res, next) { 
	const payload = {
		isLive: JSON.parse(req.body.isLive.toLowerCase())
	};
	const key = {
		tid: parseInt(req.params.tid),
		type: "session"
	}
	helpers.formatApiResponse(200, res, await update(key, payload));
}

async function update(keys, payload) {
	let state = await db.updateFieldWithMultipleKeys(keys, payload);
	if (!state) { throw new Error("Unauthorized write access!"); }
	return state;
}
