"use strict";

const winston = require("winston");
const db = require("../database");
const user = require("../user");
const helpers = require('../controllers/helpers');

const reactionController = module.exports;

reactionController.getAllReactions = async function (req, res, next) {
    var data = await db.findField({"type": "reaction"});
    delete data._id;
    helpers.formatApiResponse(200, res, data);
 }

/**
 * @author imshawan
 * @description {*} Gets all the reaction of that topic based on the user Id
 *  
 * @param {req.params} req 
 * @param {*} res 
 */

reactionController.getReactionsByUid = async function (req, res, next) {
    const keys = {
        tid: parseInt(req.params.tid),
        uid: parseInt(req.params.uid),
        type: "reaction"
    }

    helpers.formatApiResponse(200, res, await db.findField(keys));
}

/**
 * @description Handles reactions for a particular session
 */

reactionController.react = async function (req, res, next) {
    const keys = {
        tid: parseInt(req.params.tid),
        type: "reactions"
    }
    const uid = parseInt(req.uid);
    const field = {
        uid: uid,
        username: req.body.username,
        rid: parseInt(req.params.rid),
        icon: req.body.icon,
        emoji: req.body.emoji,
        timestamp: Date.now()
    }

    helpers.formatApiResponse(200, res, await db.addReactions(keys, field));
}

/**
 * @description Gets the reactions for a particular session based on the session topic Id
 */


reactionController.getReactions = async function (req, res, next) {
    const key = {
        tid: parseInt(req.params.tid),
        type: "reactions"
    }
    var field = await db.findField(key);

    helpers.formatApiResponse(200, res, { tid: field.tid, reactions: field.reactions });
}