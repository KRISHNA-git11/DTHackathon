'use strict';

var _ = require('lodash');

var meta = require('../meta');
var db = require('../database');
var plugins = require('../plugins');
var privileges = require('../privileges');
var user = require('../user');
var topics = require('../topics');
var categories = require('../categories');
var groups = require('../groups');
var utils = require('../utils');
const winston = require('winston');

const format_TimeTaken = (val) => {
	var sec_num = parseInt(val / 1000); var secsUsed = 0; var years = Math.floor(sec_num / 31536000); if (years > 0) { secsUsed += (years * 31536000); }
	var months = Math.floor((sec_num - secsUsed) / 2628288); if (months > 0) { secsUsed += (months * 2628288); }
	var weeks = Math.floor((sec_num - secsUsed) / 604800); if (weeks > 0) { secsUsed += (weeks * 604800); }
	var days = Math.floor((sec_num - secsUsed) / 86400); if (days > 0) { secsUsed += (days * 86400); }
	var hours = Math.floor((sec_num - secsUsed) / 3600); if (hours > 0) { secsUsed += (hours * 3600); }
	var minutes = Math.floor((sec_num - secsUsed) / 60); if (minutes > 0) { secsUsed += (minutes * 60); }
	var seconds = sec_num - secsUsed; 
	if (years > 0) { return years + ' Years ' + months + ' Months ' + weeks + ' Weeks ' + days + ' Days ' + hours + ' H ' + minutes + ' M ' + seconds + ' S'; } 
	else if (months > 0) { return months + ' Months ' + weeks + ' Weeks ' + days + ' Days ' + hours + ' H ' + minutes + ' M ' + seconds + ' S'; } 
	else if (weeks > 0) { return weeks + ' Weeks ' + days + ' Days ' + hours + ' H ' + minutes + ' M ' + seconds + ' S'; } 
	else if (days > 0) { return days + ' Days ' + hours + ' H ' + minutes + ' M ' + seconds + ' S'; } 
	else if (hours > 0) { return hours + ' H ' + minutes + ' M ' + seconds + ' S'; } 
	else if (minutes > 0) { return minutes + ' M ' + seconds + ' S'; } 
	else if (seconds > 0) { return seconds + ' S'; } 
	else if (seconds == 0) { return 'less than a second'; } 
	else { return days + ' Days ' + hours + ' H ' + minutes + ' M ' + seconds + ' S'; }
}

module.exports = function (Posts) {
	Posts.create = async function (data) {
		// This is an internal method, consider using Topics.reply instead
		const uid = data.uid;
		const tid = data.tid;
		const content = data.content.toString();
		const typeOfAsset = data.typeOfAsset ? data.typeOfAsset : '';
		const timestamp = data.timestamp || Date.now();
		const isMain = data.isMain || false;
		const startedAt = parseInt(data.startedAt);
		const mode = data.mode || '';

		var timeTaken = format_TimeTaken(timestamp - startedAt);

		if (!uid && parseInt(uid, 10) !== 0) {
			throw new Error('[[error:invalid-uid]]');
		}

		if (data.toPid && !utils.isNumber(data.toPid)) {
			throw new Error('[[error:invalid-pid]]');
		}
		
		const pid = await db.incrObjectField('global', 'nextPid');
		let postData = {
			pid: pid,
			uid: uid,
			tid: tid,
			content: content,
			typeOfAsset: typeOfAsset,
			startedAt: startedAt,
			timeTaken: timeTaken,
			timestamp: timestamp,
			raw: data.raw || {},
			mode: mode
		};
		let evaluate = {
			score: 0,
			evaluatedBy: '',
			evaluationTime: '',
			emotion: ''
		}

		// The topic/session schedule will have the following structure
		var topic_schedule = {
			session: { 
				SessionDate: "24/11/2021", 
				time: "7:30 pm",
				Duration: "50 min"
			},
			subject: "Networking protocols",
			description: "A short note on networking protocols like TCP/IP, Http, etc."
		}

		if (typeOfAsset){
			if (!typeOfAsset.includes('topic') && !typeOfAsset.includes('post')){
				await db.incrAssetCount(`user:${uid}`, typeOfAsset);
				await db.incrAssetTime(`user:${uid}`, typeOfAsset, timestamp - startedAt);
				postData.evaluate = evaluate;
				postData.isTeacherAsset = await privileges.users.isTeacher(uid);
				postData.isStudentAsset = await privileges.users.isStudent(uid);
			}

			if (typeOfAsset == "topic") {
				postData.schedule = data.topic_schedule;
			}
		}

		if (data.toPid) {
			postData.toPid = data.toPid;
		}
		if (data.ip && meta.config.trackIpPerPost) {
			postData.ip = data.ip;
		}
		if (data.handle && !parseInt(uid, 10)) {
			postData.handle = data.handle;
		}

		let result = await plugins.hooks.fire('filter:post.create', { post: postData, data: data });
		postData = result.post;

		await db.setObject('post:' + postData.pid, postData);

		const topicData = await topics.getTopicFields(tid, ['cid', 'pinned']);
		postData.cid = topicData.cid;

		await Promise.all([
			db.sortedSetAdd('posts:pid', timestamp, postData.pid),
			db.incrObjectField('global', 'postCount'),
			user.onNewPostMade(postData),
			topics.onNewPostMade(postData),
			categories.onNewPostMade(topicData.cid, topicData.pinned, postData),
			groups.onNewPostMade(postData),
			addReplyTo(postData, timestamp),
			Posts.uploads.sync(postData.pid),
		]);

		result = await plugins.hooks.fire('filter:post.get', { post: postData, uid: data.uid });
		result.post.isMain = isMain;
		plugins.hooks.fire('action:post.save', { post: _.clone(result.post) });
		return result.post;
	};

	async function addReplyTo(postData, timestamp) {
		if (!postData.toPid) {
			return;
		}
		await Promise.all([
			db.sortedSetAdd('pid:' + postData.toPid + ':replies', timestamp, postData.pid),
			db.incrObjectField('post:' + postData.toPid, 'replies'),
		]);
	}
};
