"use strict";

define("sdlms/reactions", [
	"api",
], function (api) {

	var REACTION = { };

	REACTION.init = (data) => {
		if (!data.tid) {
			throw new Error("Invalid tid supplied");
		}
		REACTION.data = data;
        if(!data.control){
            REACTION.builder(REACTION.data.target);
        }
		else{
            REACTION.reacted(REACTION.data.target);
        }
		
	};

	REACTION.reacted = (target) => {
		REACTION.id = REACTION.unique("sdlms-reaction-");
		let $target = $(target);
		if (!$target.length) {
			REACTION.log("No HTML element found For Builder Given ==>" + target);
			return;
		}
		$target.append(
			$("<sdlms-reaction-renderer>")
			.attr({
				id: REACTION.id,
			})
		);
		let $renderer = $(`#${REACTION.id}`);
		REACTION.$renderer = $renderer;
		function zIndex() {
            var elems = document.querySelectorAll("*");
            var highest = Number.MIN_SAFE_INTEGER || -(Math.pow(2, 53) - 1);
            for (var i = 0; i < elems.length; i++) {
                var zindex = Number.parseInt(
                    document.defaultView
                        .getComputedStyle(elems[i], null)
                        .getPropertyValue("z-index"),
                    10
                );
                if (zindex > highest) {
                    highest = zindex;
                }
            }
            return highest + 1;
        }
		REACTION.$renderer.append(` <ul class="reaction-container"></ul>`);
		REACTION.userReactions();

		$('body').append($('<div>').attr({
            class:'sdlms-floating-reaction-widget',
        }).off('click').on('click',function(){
			if($('sdlms-member-list').is(':visible')){
				$('sdlms-member-list').slideToggle()
			}
            $('.reactions').slideToggle();
			
        }).html('<img src="http://vpr.deepthought.education:5055/assets/uploads/files/files/files/2161483.png">'));
		
	};
	REACTION.userReactions = () =>{
		api.get(`/sdlms/reactions/${REACTION.data.tid}`, {}).then(res =>{
			if((res.reactions || []).length){
				$.each(res.reactions, (i,reaction)=>{
					REACTION.react(reaction)
				});
				
			}
		});
	}
	REACTION.unique = (prefix = "") => {
		var dt = new Date().getTime();
		var uuid = "xxxxxxxx-xxxx-yxxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
			var r = (dt + Math.random() * 16) % 16 | 0;
			dt = Math.floor(dt / 16);
			return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
		});
		return prefix + uuid;
	};

	REACTION.is = ($target, $type) => {
		if (typeof $target == $type) {
			return true;
		}
		return false;
	};

	REACTION.log = (log) => {
		!REACTION.data.log || console.log(log);
	};

	REACTION.react = (data) => {
		let $that = REACTION;
		REACTION.$renderer.find(".reaction-container").append(
			` <li><b>${data.username || 'Anonymous'}</b> 
				Reacted  ${data.icon && data.icon != 'undefined' ? `<img class="react-icon" src="${data.icon}">` : (data.emoji || '😁')} at <b>${$that.time(data.timestamp,Math.abs(new Date().getTimezoneOffset()))}</b></li>`
		);
		
		if($('.reactions').length){
			$('.reactions')[0].scrollTop = $('.reactions')[0].scrollHeight;
		}
		$(`.breaking-news-headline`).html('&nbsp;&nbsp;&nbsp;📖&nbsp;&nbsp;&nbsp;'+ REACTION.$renderer.find(".reaction-container").find('li').last().text() + '&nbsp;&nbsp;&nbsp;📖&nbsp;&nbsp;&nbsp;');

		
	};

	REACTION.time = (timestamp,addmin=0) => {
		if (timestamp) {
			var date = new Date(timestamp + addmin*60000);
			let _k = date.toISOString().substr(11, 8).split(':');
			let _time = `${_k[1]}:${_k[2]}`;
			if (Number(_k[0]) > 0) {
				_time = _k.join(':')
			}
			return _time;
		}
		return '00:00'
	};

	REACTION.reactions = () => {
        return api.get(`/sdlms/reactions`, {});
	};
    
	REACTION.template = () => {
		REACTION.reactions().then((data) => {
			REACTION.list = data.data;
			REACTION.render(REACTION.list);
		});
	};

	REACTION.render = (data) => {
		let str = '';
		let baseURL = 'http://vpr.deepthought.education:5055/assets/uploads/files/files/system/';
		let $that = REACTION;
		REACTION.$builder.append($('<div>').attr({
			class: 'sldms-reaction-container',
			id: `sldms-reaction-container-${REACTION.id}`
		}))
		$.each(data, function (i, e) {
			str += `<li title="${e.title}" 
					data-icon="${e.icon ? baseURL+e.icon : undefined}" 
					data-emoji="${e.emoji}" 
					data-username="${($that.data || {}).name || 'Anonymous' }" 
					data-count="${e.count || 0}" 
					data-reaction="${e.id}">
						${e.icon && $.trim(e.icon) ? `<img src="${baseURL+e.icon}">` :  e.emoji}
					</li>`
		});
		let $container = $(`#sldms-reaction-container-${REACTION.id}`);
		$container.append(` <div class="sldms-wrapper"><i class="fas fa-heart"></i></div>`);
		$container.append(`<div class="sldms-reaction-icon-container"></div>`)
		$container.find('.sldms-reaction-icon-container').append($('<ul class="sldms-reactions">').html(str));
		$container.find('[data-reaction]').off('click').on('click', function (e) {
			$(this).data('timestamp', new Date().getTime())
			if ($that.is($that.data.onReact, "function")) {
				$that.call($that.data.onReact, $(this).data())
			}
			
			$(this).addClass('reacted').delay(1000).queue(function (then) {
				$(this).removeClass('reacted');
				then();
			});
			if(data.control){
				$that.react($(this).data())
			}
		});
	};

	REACTION.builder = (target) => {
		REACTION.id = REACTION.unique("sdlms-reaction-");
		let $target = $(target);
		if (!$target.length) {
			REACTION.log("No HTML element found For Builder Given ==>" + target);
			return;
		}
		$target.append(
			$("<sdlms-reaction-builder>")
			.attr({
				id: REACTION.id,
			})
			.append(
				$("<form>").attr({
					id: "form-" + REACTION.id,
				})
			)
		);
		let $builder = $(`#form-${REACTION.id}`);
		REACTION.$builder = $builder;
		REACTION.template()

	};

	REACTION.call = (fun, data) => {
		try {
			fun(data);
		} catch (error) {
			if (REACTION.data.warn) {
				console.trace(error)
			}
		}
	};

	return REACTION;
})