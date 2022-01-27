'use strict';
define('sdlms', ['api', 'sdlms/monitorBoard'], function (api, monitorBoard) {

    var sdlms = {
        topic: {},
        active: {},
        posts: {},
        info: {},
        triggered: false,
        api: api,
        monitorBoard: monitorBoard
    };
    return api;
});
