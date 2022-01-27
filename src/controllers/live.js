"use strict";

const winston = require("winston");
const db = require("../database");
const user = require("../user");
const helpers = require('../controllers/helpers');
const groups = require('../groups');
const privileges = require('../privileges');

const livePageController = module.exports;

livePageController.get = async function (req, res, next) {
    const fields = [
		"uid",
		"username",
		"fullname",
		"userslug",
		"picture",
		"status"
	]
    const livePage = {}

    livePage.title = "Live Class";

    var [userData, isTeacher, isStudent, Sessions] = await Promise.all([
        user.getUsersFields([req.uid], fields), 
		privileges.users.isTeacher(req.uid),
		privileges.users.isStudent(req.uid),
		db.findFields({type: "session"})
	])

    livePage.userData = userData;
    livePage.isTeacher = isTeacher;
	livePage.isStudent = isStudent;
	livePage.Sessions = Sessions.filter(elem => elem.members.includes(parseInt(req.uid)) && elem.isLive && (elem.tid === parseInt(req.params.topicId)))

	res.render("live", livePage);

}

livePageController.getAttendance = async function (req, res, next) {
	const key = {
		tid: parseInt(req.params.tid),
		type: "session"
	}
	var Session = await db.findFields(key);
	Session = Session[0];

	helpers.formatApiResponse(200, res, {attendance: Session.attendance});
}

livePageController.getMembers = async function (req, res, next) {
	const key = {
		tid: parseInt(req.params.tid),
		type: "session"
	}
	var Session = await db.findFields(key);
	Session = Session[0];

	helpers.formatApiResponse(200, res, {members: Session.members});
}