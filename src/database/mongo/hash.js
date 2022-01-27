'use strict';

module.exports = function (module) {
	const helpers = require('./helpers');
	const winston = require('winston');

	const cache = require('../cache').create('mongo');

	module.objectCache = cache;

	module.setObject = async function (key, data) {
		const isArray = Array.isArray(key);
		if (!key || !data || (isArray && !key.length)) {
			return;
		}

		const writeData = helpers.serializeData(data);
		try {
			if (isArray) {
				const bulk = module.client.collection('objects').initializeUnorderedBulkOp();
				key.forEach(key => bulk.find({ _key: key }).upsert().updateOne({ $set: writeData }));
				await bulk.execute();
			} else {
				await module.client.collection('objects').updateOne({ _key: key }, { $set: writeData }, { upsert: true });
			}
		} catch (err) {
			if (err && err.message.startsWith('E11000 duplicate key error')) {
				return await module.setObject(key, data);
			}
			throw err;
		}

		cache.del(key);
	};

	module.setObjectField = async function (key, field, value) {
		if (!field) {
			return;
		}
		var data = {};
		data[field] = value;
		await module.setObject(key, data);
	};

	module.getObject = async function (key) {
		if (!key) {
			return null;
		}

		const data = await module.getObjects([key]);
		return data && data.length ? data[0] : null;
	};

	// Returns all the users information based on a common key i.e profileviews
	module.getUserObjects = async function () {
		const Groups = require('../../groups');

		var retObj = [];
		const data = await module.getCustomObjectsFields("profileviews");
		if (data) {
			retObj = data.map((it) => {
				return {
					uid: it.uid,
					username: it.username,
					userslug: it.userslug,
					topiccount: it.topiccount,
					postcount: it.postcount,
					quizCount: it.quizCount ? it.quizCount : 0,
					spreadsheetCount: it.spreadsheetCount ? it.spreadsheetCount : 0,
				}
			})
			for(var i in retObj){
				let groups = await Groups.getUserGroups([retObj[i].uid]);
				retObj[i].groups = groups[0];
			}
		}
		
		return retObj && retObj.length ? retObj : null;
	};

	module.getObjects = async function (keys) {
		return await module.getObjectsFields(keys, []);
	};

	module.getObjectField = async function (key, field) {
		if (!key) {
			return null;
		}
		const cachedData = {};
		cache.getUnCachedKeys([key], cachedData);
		if (cachedData[key]) {
			return cachedData[key].hasOwnProperty(field) ? cachedData[key][field] : null;
		}
		field = helpers.fieldToString(field);
		const item = await module.client.collection('objects').findOne({ _key: key }, { projection: { _id: 0, [field]: 1 } });
		if (!item) {
			return null;
		}
		return item.hasOwnProperty(field) ? item[field] : null;
	};

	module.getObjectFields = async function (key, fields) {
		if (!key) {
			return null;
		}
		const data = await module.getObjectsFields([key], fields);
		return data ? data[0] : null;
	};

	module.getObjectsFields = async function (keys, fields) {
		if (!Array.isArray(keys) || !keys.length) {
			return [];
		}
		const cachedData = {};
		const unCachedKeys = cache.getUnCachedKeys(keys, cachedData);
		let data = [];
		if (unCachedKeys.length >= 1) {
			data = await module.client.collection('objects').find(
				{ _key: unCachedKeys.length === 1 ? unCachedKeys[0] : { $in: unCachedKeys } },
				{ projection: { _id: 0 } }
			).toArray();
			data = data.map(helpers.deserializeData);
		}

		const map = helpers.toMap(data);
		unCachedKeys.forEach(function (key) {
			cachedData[key] = map[key] || null;
			cache.set(key, cachedData[key]);
		});

		if (!fields.length) {
			return keys.map(key => (cachedData[key] ? { ...cachedData[key] } : null));
		}
		return keys.map(function (key) {
			const item = cachedData[key] || {};
			const result = {};
			fields.forEach((field) => {
				result[field] = item[field] !== undefined ? item[field] : null;
			});
			return result;
		});
	};

	module.getCustomObjectsFields = async function (key) {
		if (!key.length) {
			return [];
		}
		let data = [];
		data = await module.client.collection('objects').find( { [key]: { $gt: 0 } } ).toArray();
		return data;
	};

	module.getObjectKeys = async function (key) {
		const data = await module.getObject(key);
		return data ? Object.keys(data) : [];
	};

	module.getObjectValues = async function (key) {
		const data = await module.getObject(key);
		return data ? Object.values(data) : [];
	};

	module.isObjectField = async function (key, field) {
		const data = await module.isObjectFields(key, [field]);
		return Array.isArray(data) && data.length ? data[0] : false;
	};

	module.isObjectFields = async function (key, fields) {
		if (!key) {
			return;
		}

		const data = {};
		fields.forEach(function (field) {
			field = helpers.fieldToString(field);
			data[field] = 1;
		});

		const item = await module.client.collection('objects').findOne({ _key: key }, { projection: data });
		const results = fields.map(f => !!item && item[f] !== undefined && item[f] !== null);
		return results;
	};

	module.deleteObjectField = async function (key, field) {
		await module.deleteObjectFields(key, [field]);
	};

	module.deleteObjectFields = async function (key, fields) {
		if (!key || (Array.isArray(key) && !key.length) || !Array.isArray(fields) || !fields.length) {
			return;
		}
		fields = fields.filter(Boolean);
		if (!fields.length) {
			return;
		}

		var data = {};
		fields.forEach(function (field) {
			field = helpers.fieldToString(field);
			data[field] = '';
		});
		if (Array.isArray(key)) {
			await module.client.collection('objects').updateMany({ _key: { $in: key } }, { $unset: data });
		} else {
			await module.client.collection('objects').updateOne({ _key: key }, { $unset: data });
		}

		cache.del(key);
	};

	module.incrObjectField = async function (key, field) {
		return await module.incrObjectFieldBy(key, field, 1);
	};

	module.decrObjectField = async function (key, field) {
		return await module.incrObjectFieldBy(key, field, -1);
	};

	module.incrAssetCount = async function (key, field) {
		return await module.incrObjectFieldCount(key, field, 1);
	};

	module.decrAssetcount = async function (key, field) {
		return await module.incrObjectFieldCount(key, field, -1);
	};

	module.incrAssetTime = async function (key, field, time) {
		return await module.incrObjectFieldCount(key, field, time, 'time');
	};

	module.decrAssetTime = async function (key, field, time) {
		return await module.incrObjectFieldCount(key, field, -time, 'time');
	};

	module.incrObjectFieldBy = async function (key, field, value) {
		value = parseInt(value, 10);
		if (!key || isNaN(value)) {
			return null;
		}

		var increment = {};
		field = helpers.fieldToString(field);
		increment[field] = value;

		if (Array.isArray(key)) {
			var bulk = module.client.collection('objects').initializeUnorderedBulkOp();
			key.forEach(function (key) {
				bulk.find({ _key: key }).upsert().update({ $inc: increment });
			});
			await bulk.execute();
			cache.del(key);
			const result = await module.getObjectsFields(key, [field]);
			return result.map(data => data && data[field]);
		}

		const result = await module.client.collection('objects').findOneAndUpdate({ _key: key }, { $inc: increment }, { returnOriginal: false, upsert: true });
		cache.del(key);
		return result && result.value ? result.value[field] : null;
	};

	module.incrObjectFieldCount = async function (key, field, value, type = '') {
		value = parseInt(value, 10);
		if (!key || isNaN(value)) {
			return null;
		}
		field = helpers.fieldToString(field);

		var assetsCountField = [{
			typeOfAsset: field,
			totalCount: 0,
			totalTimeCount: 0
		}];

		var result;
		
		if (!await module.client.collection('objects').findOne({ _key: key }, { 'assetsCount': { $exists: false, $ne: null }})) {

			await module.client.collection('objects').update({ _key: key }, { $set:{ 'assetsCount': assetsCountField } });
		}

		if (!await module.client.collection('objects').findOne({ _key: key, 'assetsCount.typeOfAsset': field })) {

			await module.client.collection('objects').update({ _key: key }, { $push: { 'assetsCount': {
				typeOfAsset: field,
				totalCount: 0,
				totalTimeCount: 0
			} }})
		}

		if (type == 'time') {
			result = await module.client.collection('objects').findOneAndUpdate({ _key: key, 'assetsCount.typeOfAsset': field  }, { $inc: { 'assetsCount.$.totalTimeCount' : value} }, { returnOriginal: false, upsert: true});
		}
		else {
			result = await module.client.collection('objects').findOneAndUpdate({ _key: key, 'assetsCount.typeOfAsset': field }, { $inc: { 'assetsCount.$.totalCount' : value} }, { returnOriginal: false, upsert: true});
		}
		cache.del(key);
		return result && result.value ? result.value[field] : null;
	};

	/**
	 * @author imshawan
	 * @description This function will add the attendance field to the session's document and keep on appending the uids along with the timestamp
	 */
	
	module.addToClass = async function (keys, field) {
		if (!await module.client.collection('objects').findOne(keys, { 'attendance': { $exists: false, $ne: null }})) {

			await module.client.collection('objects').update(keys, { $set:{ 'attendance': [] } });
		}

		if (!await module.client.collection('objects').findOne({ ...keys, 'attendance':  {$elemMatch: {'uid': field.uid} } })) {

			await module.client.collection('objects').update(keys, { $push: { 'attendance': field }})
		}

		cache.del(keys);
	};

	module.addReactions = async function (keys, field) {
		if (!await module.client.collection('objects').findOne(keys)) {
			await module.client.collection('objects').insertOne({
				tid: keys.tid,
				type: keys.type,
				reactions: [
					field
				]
			});
		}
		else {
			await module.client.collection('objects').update(keys, { $push: { 'reactions': field }})
		}

		cache.del(keys);
	};

	/**
	 * @author imshawan
	 * @description Custom functions to manipulate data with ease rather than using nodebb's legacy functions
	 */

	module.updateField = async (key, field) => {
		if (!field) {return; }
		await module.client.collection('objects').update({ _key: key }, { $set: field });
	}

	module.updateFieldWithMultipleKeys = async (key, field) => {
		if (!field) {return; }
		let record = await  module.client.collection('objects').findOne(key);
		if (!record) {
			return null;
		}
		else {
			await module.client.collection('objects').updateOne(key, { $set: field });
			return { updated: true }
		}
	}

	module.findField = async (keys) => {
		return await module.client.collection('objects').findOne(keys);
	}

	module.findFields = async (keys) => {
		return await module.client.collection('objects').find(keys).toArray();
	}

	module.setField = async (payload) => {
		var res = await module.client.collection('objects').insertOne(payload);
		return res.ops[0];
	}

	module.removeField = async (keys) => {
		return await module.client.collection('objects').remove(keys);
	}

	/**
	 * 
	 * @author imshawan
	 * @function updateAssetCount
	 * @param {*} key => The keys to find the document for updating the asset count
	 * @param {*} assetType => Type of the asset for which the value should be incremented. (threadbuilder || eaglebuilder || quiz)
	 * @param {*} value => Increment or decrement value. Pass 1 for increment and -1 for decrement
	 * @param {*} data => {userId, username} for registering the count information
	 * @returns 
	 */
	
	module.updateAssetCount = async function (key, assetType, value, data) {
		value = parseInt(value, 10);
		if (!key || isNaN(value)) {
			return null;
		}
		assetType = helpers.fieldToString(assetType);

		if (!await module.client.collection('objects').findOne(key, { 'assetsCount': { $exists: false, $ne: null }})) {

			await module.client.collection('objects').update(key, { $set:{ 'assetsCount': [] } });
		}
		if (!await module.client.collection('objects').findOne({...key, 'assetsCount': { $elemMatch: {'userId': data.userId} } })) {

			await module.client.collection('objects').update(key, { $push:{ 'assetsCount': { ...data, 'count': [] } } });
		}
		if (!await module.client.collection('objects').findOne({...key, 
			'assetsCount': { $elemMatch: {'userId':  data.userId, 'count': { $elemMatch: {'typeOfAsset': assetType} } } } })) { 
			await module.client.collection('objects').update({...key, 'assetsCount': { $elemMatch: {'userId': data.userId} } }, 
			{ $push: { 'assetsCount.$.count': {
				'typeOfAsset': assetType,
				'totalCount': 0,
			} }})
		}
		await module.client.collection('objects').findOneAndUpdate(
			key,
			{ $inc: {
				'assetsCount.$[i].count.$[j].totalCount': value
			}},
			{arrayFilters: [ { 'i.userId': { $eq: data.userId } }, {'j.typeOfAsset': { $eq: assetType } } ]}
		)
	}
};
