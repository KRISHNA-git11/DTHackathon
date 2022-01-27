'use strict';

/* globals define */

define('composer/sdlms/spreadsheet', function() {

	var spreadsheet = {};
    spreadsheet.$active  = {};

	$(window).on('action:composer.discard', function (evt, data) {
        spreadsheet.$active  = {};
	});

	spreadsheet.init = function(postContainer, post_uuid,config = {}) {
		var element = postContainer.find('.spreadsheet');
        if(!element){
            app.log('Element Is not present.');
            return;
        }
        spreadsheet.$active =  jspreadsheet(element[0],config);
		// element.find('tr[data-y]').hide()
		// element.find('tr[data-y]:nth-child(-n + 4)').show();
		// element.css({
		// 	position:'relative'
		// });
		// element.find('.jexcel').css({
		// 	position:'relative'
		// }).append($('<div>').attr({
		// 	style:'position:absolute;bottom: -26px;right:0;color: blue;text-decoration: underline;cursor:pointer',
		// 	id:'addNewRows'
		// }))
		spreadsheet.$container = element;
		var data = {
			element: element,
			config: config
		};
		$(window).trigger('composer:spreadsheet:init', data);
	};
    spreadsheet.getActiveTemplate = function() {
		let data = [];
		try {
			data = spreadsheet.$active.getData()
		} catch (error) {
			
		}
        return data;  
    }
	spreadsheet.getActiveTemplateHTML = function() {
		spreadsheet.$container.find('#addNewRows').remove()
		spreadsheet.$container.find('tr[data-y]:not(:visible)').remove();
		return spreadsheet.$container.html()
	}

	return spreadsheet;
});
