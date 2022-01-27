/** 
 * @author imshawan
 * @description This file contains all the customised API tools for the SDLMS
 * @note caller(req), data
 */
'use strict';

const groups = require('../groups');
const events = require('../events');
const db = require('../database');
const User = require('../user');
const winston = require('winston');
const ObjectId = require('mongodb').ObjectId;

const sdlmsAPI = module.exports;

sdlmsAPI.deleteGroupBySlug = async function (caller, data) {
	const groupName = await groups.getGroupNameByGroupSlug(data.slug);
	//await isOwner(caller, groupName);
	if (
		groups.systemGroups.includes(groupName) ||
		groups.ephemeralGroups.includes(groupName)
	) {
		throw new Error('[[error:not-allowed]]');
	}

	await groups.destroy(groupName);
	logGroupEvent(caller, 'group-delete', {
		groupName: groupName,
	});
};

sdlmsAPI.getEagleBuilder = async function (data) {
	const luid = parseInt(data.uid);
	if (!data.uid || luid < 1) { throw new Error("Unauthorized"); }

	const keys = {
		"topicId": parseInt(data.params.tid),
		"type": "eaglebuilder"
	};
	const userId = {...keys, userId: data.query.uid ? parseInt(data.query.uid) : data.uid };
	const query = data.query.id ? ({...keys, _id: ObjectId(data.query.id) }) : userId;
	
	const [eagleBuilder] = await Promise.all([
		db.findField(query),
	]);

	if (!eagleBuilder) {
		return null;
	}

	return {
		id: eagleBuilder._id,
		//userId: eagleBuilder.userId,
		meta: eagleBuilder.meta,
		tracks: eagleBuilder[luid == eagleBuilder.userId ? 'tracks' : 'public'],
		topicId: eagleBuilder.topicId,
		classCategoryId: eagleBuilder.classCategoryId
	}
};

sdlmsAPI.updateEagleBuilder = async function (data) {
	const luid = parseInt(data.uid);
	if (!data.uid || luid < 1) { throw new Error("Unauthorized"); }

	const keys = {
		"topicId": parseInt(data.params.tid),
		"userId": luid,
		"type": "eaglebuilder",
		"_id": ObjectId(data.params.id)
	}
	const parsedData = {
		meta: data.body.meta,
		tracks: data.body.tracks,
	};
	let state = await db.updateFieldWithMultipleKeys(keys, parsedData);
	if (!state) { throw new Error("Unauthorized write access!"); }
	return state;
};

sdlmsAPI.createEagleBuilder = async function (data) {
	const uid = parseInt(data.uid)
	if (!data.uid || uid < 1) { throw new Error("Unauthorized"); }

	const username = await User.getUserField(uid, 'username')
	const topicId =  parseInt(data.params.tid)

	const parsedData = {
		userId: uid,
		meta: data.body.meta,
		tracks: data.body.tracks,
		classCategoryId: parseInt(data.body.cid) || 1,
		topicId: topicId,
		"type": "eaglebuilder"
	};
	if (data.body.sessionTracker) { 
		parsedData.sessionTracker = JSON.parse(data.body.sessionTracker.toLowerCase()); 
	}
	const resp = await db.setField(parsedData);
	await db.updateAssetCount({tid: topicId, type: "session"}, "eaglebuilder", 1, {
		userId: uid,
		username: username
	})

	return {
		_id: resp._id
	}
};

/**
 * 
 * @function getsessionTracker
 * @param {*} data => request parameter
 * @returns main eaglebuilder of the session (Session tracker)
 */

sdlmsAPI.getSessionTracker = async function (data) {
	const luid = data.uid;
	if (!data.uid || luid < 1) { throw new Error("Unauthorized"); }

	const keys = {
		"topicId": parseInt(data.params.tid),
		"type": "eaglebuilder",
		"sessionTracker": true
	};
	
	const [eagleBuilder] = await Promise.all([
		db.findField(keys),
	]);

	if (!eagleBuilder) {
		return null;
	}

	return {
		id: eagleBuilder._id,
		//userId: eagleBuilder.userId,
		meta: eagleBuilder.meta,
		tracks: eagleBuilder.tracks,
		topicId: eagleBuilder.topicId,
		classCategoryId: eagleBuilder.classCategoryId,
		sessionTracker: eagleBuilder.sessionTracker
	}
};

/**
* @description Threadbuilder operations (GET, CREATE, UPDATE)
*/
sdlmsAPI.getThreadBuilder = async function (data) {
	const luid = data.uid;
	if (!data.uid || luid < 1) { throw new Error("Unauthorized"); }

	var keys = {
		"topicId": parseInt(data.params.tid),
		"type": "threadbuilder"
	}

	const [threadbuilders] = await Promise.all([
		db.findFields(data.params.id ? ({ _id: ObjectId(data.params.id) }) : keys),
	]);

	if (!threadbuilders) {
		return null;
	}

	var threadbuilder = threadbuilders.map((elem) => {
		return {
			id: elem._id,
			userId: elem.userId,
			data:  elem[luid == elem.userId ? 'data' : 'public'],
			topicId: elem.topicId,
			classCategoryId: elem.classCategoryId
		}
	})
	
	return threadbuilder;
	
};

sdlmsAPI.createThreadBuilder = async function (data) {
	const uid = parseInt(data.uid)
	if (!data.uid || uid < 1) { throw new Error("Unauthorized"); }

	const username = await User.getUserField(uid, 'username')
	const topicId =  parseInt(data.params.tid)

	const parsedData = {
		userId: uid,
		data: data.body.data,
		classCategoryId: parseInt(data.body.cid) || 1,
		topicId: topicId,
		"type": "threadbuilder"
	};
	const resp = await db.setField(parsedData);

	await db.updateAssetCount({tid: topicId, type: "session"}, "threadbuilder", 1, {
		userId: uid,
		username: username
	})
	
	return {
		_id: resp._id
	}
};

sdlmsAPI.updateThreadBuilder = async function (data) {
	const uid =  parseInt(data.uid);
	if (!data.uid || uid < 1) { throw new Error("Unauthorized"); }

	const keys = {
		"topicId": parseInt(data.params.tid),
		"userId": uid,
		"type": "threadbuilder",
		"_id": ObjectId(data.params.id)
	}
	const parsedData = {
		data: data.body.data,
	};
	let state = await db.updateFieldWithMultipleKeys(keys, parsedData);
	if (!state) { throw new Error("Unauthorized write access!"); }
	return state;
};


/**
* @description Threadbuilder operations (GET, CREATE, UPDATE)
*/
sdlmsAPI.getQuiz = async function (data) {
	var keys = {
		"topicId": parseInt(data.params.tid),
		"type": "quiz"
	}
	const luid = data.uid;
	if (!data.uid || luid < 1) { throw new Error("Unauthorized"); }

	const [quizzes] = await Promise.all([
		db.findFields(data.params.id ? ({ _id: ObjectId(data.params.id) }) : keys),
	]);

	if (!quizzes) {
		return null;
	}

	var quiz = quizzes.map((elem) => {
		return {
			id: elem._id,
			userId: elem.userId,
			data:  elem[luid == elem.userId ? 'data' : 'public'],
			topicId: elem.topicId,
			classCategoryId: elem.classCategoryId
		}
	})
	
	return quiz;
	
};

sdlmsAPI.createQuiz = async function (data) {
	const uid = parseInt(data.uid)
	if (!data.uid || uid < 1) { throw new Error("Unauthorized"); }

	const username = await User.getUserField(uid, 'username')
	const topicId =  parseInt(data.params.tid)

	const parsedData = {
		userId: uid,
		data: data.body.data,
		classCategoryId: parseInt(data.body.cid) || 1,
		topicId: topicId,
		"type": "quiz"
	};
	const resp = await db.setField(parsedData);
	await db.updateAssetCount({tid: topicId, type: "session"}, "quiz", 1, {
		userId: uid,
		username: username
	})

	return {
		_id: resp._id
	}
};

sdlmsAPI.updateQuiz = async function (data) {
	const uid = parseInt(data.uid)
	if (!data.uid || uid < 1) { throw new Error("Unauthorized"); }

	const keys = {
		"topicId": parseInt(data.params.tid),
		"userId": uid,
		"type": "quiz",
		"_id": ObjectId(data.params.id)
	}
	const parsedData = {
		data: data.body.data,
	};
	let state = await db.updateFieldWithMultipleKeys(keys, parsedData);
	if (!state) { throw new Error("Unauthorized write access!"); }
	return state;
};

sdlmsAPI.getAllAssetsBasedOnUser = async function (data) { 
	const uid = parseInt(data.params.uid);
	const tid =  parseInt(data.params.tid);
	const luid = parseInt(data.uid);
	if (!data.uid || luid < 1) { throw new Error("Unauthorized"); }

	const keys = {
		userId: uid,
		topicId: tid,
	}
	const [eb, tb, quiz] = await Promise.all([
		db.findFields({
			...keys,
			"type": "eaglebuilder"
		}),
		db.findFields({
			...keys,
			"type": "threadbuilder"
		}),
		db.findFields({
			...keys,
			"type": "quiz"
		})
	])

	const eaglebuilders = eb.filter(e => ((e.userId == luid) || (e.userId != luid && e.public))).map((elem) => {
		return {
			id: elem._id,
			title: elem.meta.title
		}
	})
	const threadbuilders = tb.filter(e => ((e.userId == luid) || (e.userId != luid && e.public))).map((elem) => {
		return {
			id: elem._id,
			title: elem.data.threads ? elem.data.threads[0].title : undefined
		}
	})
	const quizzes = quiz.filter(e => ((e.userId == luid) || (e.userId != luid && e.public))).map((elem) => {
		return {
			id: elem._id
		}
	})

	return {
		uid: uid,
		widgets: {
			eaglebuilders: eaglebuilders,
			threadbuilders: threadbuilders,
			quizzes: quizzes
		}
	}
}
sdlmsAPI.markPublicBasedOnUser = async function (data) { 
	let luid = parseInt(data.uid)
	if (!data.uid || luid < 1) { throw new Error("Unauthorized"); }

	const [asset] = await Promise.all([
		db.findField(data.params.id ? ({ _id: ObjectId(data.params.id) }) : keys),
	]);
	let types = {
		threadbuilder:"data",
		quiz:"data",
		eaglebuilder:"tracks"
	}
	if (asset.userId != luid) { throw new Error("Unauthorized"); }
	const keys = {
		"_id": ObjectId(data.params.id)
	}
	const parsedData = {
		public:  asset[types[asset.type]] || []
	};
	let state = await db.updateFieldWithMultipleKeys(keys, parsedData);
	if (!state) { throw new Error("Unauthorized write access!"); }
	return state;
}

sdlmsAPI.joinClass = async function (caller) {
	const uid = parseInt(caller.uid)
	if (!caller.uid || uid < 1) { throw new Error("Unauthorized"); }

	var UserField = await User.getUserFields([uid], ['username', 'lastonline', 'picture', 'fullname', 'status', 'uid'])
	if (!UserField.picture){
		UserField.picture = "http://vpr.deepthought.education:5055/assets/uploads/files/profile/1-profileavatar-1635572456194.png";
	}

	UserField.joinedAt = Date.now();
	const key = {
		tid: parseInt(caller.params.tid),
		type: "session"
	}
	var Session = await db.findFields(key);
	Session = Session[0];
	if (!Session.members.includes(uid)) {
		throw new Error("Not a part of this session");
	}

	await db.addToClass(key, UserField)
	return UserField;
}

sdlmsAPI.getFeedbackData = async function (data) {
	if (!data.query.id) throw new Error("Missing query parameter");

	const uid = parseInt(data.uid);
	if (!data.uid || uid < 1) { throw new Error("Unauthorized"); }

	// const attachment_id = parseInt(data.query.id);
	
	/**
	 * @author Deepansu 
	 * removing parseInt bcz it was converting 61c083c7f4d46f184c2463f7 to 61
	 * parseInt('61c083c7f4d46f184c2463f7') = 61
	 * */ 
	const attachment_id = (data.query.id);
	const keys = {
		attachment_id: attachment_id,
		type: "feedback"
	}
	return await db.findFields(keys);
}

sdlmsAPI.createFeedback = async function (data) {
	const uid = parseInt(data.uid);
	if (!data.uid || uid < 1) { throw new Error("Unauthorized"); }

	const UserFields = await User.getUserFields([uid], ['picture', 'fullname']);
	const currentTime = Date.now();

	const feedback = {
        created: currentTime,
        modified: currentTime,
        content: data.body.content,
		//  attachment_id: parseInt(data.body.attachment_id),
		/**
		 * @author Deepansu 
		 * removing parseInt bcz it was converting 61c083c7f4d46f184c2463f7 to 61
		 * parseInt('61c083c7f4d46f184c2463f7') = 61
		 * */ 
        attachment_id: (data.body.attachment_id),
        attachment_type: data.body.attachment_type,
        attachments: data.body.attachments,
        pings: data.body.pings,
        creator: uid,
        fullname: UserFields.fullname,
        profile_picture_url: UserFields.picture,
        created_by_admin: false,
        created_by_current_user: false,
        upvote_count: 0,
		votes: [],
        user_has_upvoted: false,
        is_new: true,
		type: "feedback"
	}
	if (data.body.parent) { feedback.parent = data.body.parent; }

	const resp = await db.setField(feedback);
	return {
		id: resp._id
	}
}

sdlmsAPI.updateFeedback = async function (data) {
	const uid = parseInt(data.uid);
	if (!data.uid || uid < 1) { throw new Error("Unauthorized"); }

	const keys = {
		creator: uid,
		_id: ObjectId(data.params.id)
	}
	const currentTime = Date.now();
	const parsedData = {
        modified: currentTime
	}
	const dataElements = ['content', 'attachments', 'pings', 'upvote_count']
	dataElements.forEach((elem) => {
		if (data.body[elem]) {
			parsedData[elem] = data.body[elem]
		}
	})
	if (data.body.is_new) { parsedData.is_new = JSON.parse(data.body.is_new.toLowerCase()) }
	let state = await db.updateFieldWithMultipleKeys(keys, parsedData);
	if (!state) { throw new Error("Unauthorized write access!"); }
	return state;
}

sdlmsAPI.deleteFeedback = async function (data) {
	const uid = parseInt(data.uid);
	if (!data.uid || uid < 1) { throw new Error("Unauthorized"); }

	const keys = {
		creator: uid,
		_id: ObjectId(data.params.id)
	}
	const record = await db.findField(keys);
	if (!record) { throw new Error("Unauthorized delete access!"); }

	let state = await db.removeField(keys);
	if (state.result.n === 1) { return { deleted: true } }
	else { return { deleted: false } }
}

sdlmsAPI.vote = async function (data) {
	const uid = parseInt(data.uid);
	if (!data.uid || uid < 1) { throw new Error("Unauthorized"); }

	const key = {
		_id: ObjectId(data.params.id)
	}
	let feedback = await db.findField(key);
	if (!feedback) { throw new Error("Invalid feedback Id") };
	let votes = feedback.votes || [];

	// if (votes.includes(uid)) {
	// 	votes.splice(votes.IndexOf(uid), 1)
	// }
	// else {
	// 	votes.push(uid)
	// }

	/**
	 * @author Deepansu
	 * above commented code was throwing Error so adding New one
	 * 
	*/
	
	(Array.isArray(votes) ? votes : []).find((vote) => vote.uid == uid)
		? (votes = votes.filter((vote) => vote.uid != uid))
		: votes.push({
				uid: uid,
				created: Date.now(),
		  });

	let state = await db.updateFieldWithMultipleKeys(key, { votes: votes, upvote_count: votes.length });
	if (!state) { throw new Error("Unauthorized write access!"); }
	return state;
}

function logGroupEvent(caller, event, additional) {
	events.log({
		type: event,
		uid: caller.uid,
		ip: caller.ip,
		...additional,
	});
}