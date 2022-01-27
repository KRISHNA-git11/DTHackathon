"use strict";

define("sdlms/members", [
    "api", "sdlms/eaglebuilder", "sdlms/threadbuilder", "sdlms/quiz","Sortable","sdlms/feedbacks"
], function (api, eaglebuilder, threadbuilder, quiz,Sortable,feedbacks) {

    var MEMBERS = {};

    MEMBERS.init = (data) => {
        if (!data.tid) {
            throw new Error("Invalid tid supplied");
        }
        MEMBERS.tid = data.tid;
        MEMBERS.data = data
        MEMBERS.render()


    };

    MEMBERS.unique = (prefix = "") => {
        var dt = new Date().getTime();
        var uuid = "xxxxxxxx-xxxx-yxxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
        });
        return prefix + uuid;
    };

    MEMBERS.is = ($target, $type) => {
        if (typeof $target == $type) {
            return true;
        }
        return false;
    };

    MEMBERS.log = (log) => {
        !MEMBERS.data.log || console.log(log);
    };
    MEMBERS.time = (timestamp, addmin = 0) => {
        if (timestamp) {
            var date = new Date(timestamp + addmin * 60000);
            let _k = date.toISOString().substr(11, 8).split(':');
            let _time = `${_k[1]}:${_k[2]}`;
            if (Number(_k[0]) > 0) {
                _time = _k.join(':')
            }
            return _time;
        }
        return '00:00'
    };



    MEMBERS.call = (fun, data) => {
        try {
            fun(data);
        } catch (error) {
            if (MEMBERS.data.warn) {
                console.trace(error)
            }
        }
    };
    MEMBERS.render = () => {
        MEMBERS.id = MEMBERS.unique("sdlms-eagle-");
        $("body").prepend(
            $("<sdlms-member-list>")
                .attr({
                    id: MEMBERS.id,
                    style: 'display:none',
                })
            // .append(`<div class="widget-move"> Move </div>`)
        );
        let $renderer = $(`#${MEMBERS.id}`);
        MEMBERS.$renderer = $renderer;

        $('body').append($('<div>').attr({
            class: 'sdlms-floating-member-widget',
        }).off('click').on('click', function () {

            if ($('.reactions').is(':visible')) {
                $('.reactions').slideToggle()
            }
            $renderer.slideToggle();
        }).html('<img src="http://vpr.deepthought.education:5055/assets/uploads/files/files/files/3204235.png">'));
        MEMBERS.template();
        api.get(`/sdlms/attendance/${MEMBERS.tid}`, {}).then((r) => {
            MEMBERS.list = (r.attendance || []);
            MEMBERS.template();
        }).catch((e) => {
            // 
        });
    }
    MEMBERS.template = () => {
        let $that = MEMBERS;
        $that.$renderer.append($('<div>').attr({
            class: 'sldms-student-container',
            id: `sldms-student-container-${MEMBERS.id}`
        }));
        $(`#sldms-student-container-${MEMBERS.id}`).append($('<ul>').attr({
            id: `student-list-${MEMBERS.id}`,
            class: 'student-list'
        }));
        let $container = $(`#student-list-${MEMBERS.id}`)
        $.each(MEMBERS.list, (index, student) => {
            $container.append($that.student(student))
        });
        let exists = [];
        function refreshList(){
            let actives = $('.comparison-container').children('[data-compare-id]');
            $('sdlms-member-list').find('.sub-menu > li').attr('shown',false)
            actives.each((i,e)=>{
                $('sdlms-member-list')
                        .find(`.sub-menu > li a[data-id="${$(e).attr('id')}"]`)
                        .parents('li')
                        .first()
                        .attr('shown',true)
            });
        }
        $container.find('[student]').off('click')
            .on('click', function () {
                if ($(this).data('shown')) {
                    $(this).trigger("sdlms.hide")
                } else {
                    $(this).trigger("sdlms.show")
                }
                if ($(this).data('uid')) {
                    let data = $(this).data();
                }
            }).on('sdlms.show', function () {
                $(this).data('shown', 1);
                let data = $(this).data();
                $that.uid = data.uid;
                api.get(`/sdlms/${$that.tid}/assets/${data.uid}`, {})
                    .then((r) => {
                        $(`#list-${data.uid}`).remove();
                        $(this).after(
                            $that._templatePart().container([{
                                title: 'Eagle Builders',
                                icon: '<i class="fas fa-dove"></i>',
                                type: "eb",
                                children: r.widgets.eaglebuilders
                            },
                            {
                                title: 'Thread Builders',
                                icon: '<i class="far fa-comment-dots"></i>',
                                type: "tb",
                                children: r.widgets.threadbuilders
                            },
                            {
                                title: 'Quizzes',
                                icon: '<i class="fas fa-question"></i>',
                                type: "qz",
                                children: r.widgets.quizzes
                            }])
                        )
                        $(`#list-${data.uid}`).slideDown();
                        $container.find('.nav-links > li .arrow').off('click').on('click', function () {
                            if ($(this).parents('li').data('children')) {
                                $(this).parents('li').first().find('.sub-menu').slideToggle();
                                $(this).parents('li').first().toggleClass('active');
                            } else {
                                alert('Nothing to show here.')
                            }

                        });
                        let max_comparison_per_screen = 2;
                        if ($(window).width() > 1400) {
                            max_comparison_per_screen = 3
                        }
                        let users  = MEMBERS.list.map(e => $.extend({},e,{
                            id:e.uid,
                            fullname:e.fullname || e.username,
                            username:e.username,
                            profile_picture_url:e.picture
                        }));
                        $container.find('.nav-links > li ul > li a').off('click').on('click', function () {
                            let $id = $(this).data('id');
                            let $type = $(this).data('type');
                            let container_id = MEMBERS.unique('compare-');
                            if (!$('.comparison-container').length) {
                                $('.live').append($('<div>').attr({
                                    class: 'comparison-container',
                                    style: 'display:flex;overflow:auto;flex-wrap:no-wrap;height: 100%;'
                                }));
                            }

                            if (!$(`#${$id}`).length || ($(`#${$id}`).length && !$(`#${$id}`).children().length)) {

                                $('.comparison-container').append($('<div>').attr({
                                    'data-compare-id': container_id,
                                    id: $id,
                                    name: data.name,
                                    style: `min-width:${$('.comparison-container').width() / max_comparison_per_screen}px;padding-right:10px;height: 100%;position:relative`
                                }));
                                $(this).data('container', container_id)
                                switch ($type) {
                                    case 'eb':
                                        api.get(`/sdlms/${$that.tid}/eaglebuilder?id=${$id}`, {}).then((res) => {
                                            new eagleBuilder($.extend({}, {
                                                with: res,
                                                action: "builder",
                                                target: `[data-compare-id="${container_id}"]`,
                                                log: true,
                                                picture:(ajaxify.data.userData || [{}])[0].picture,
                                                tracks: 1,
                                                threshold: true,
                                                canControl: true,
                                                assetId: $id,
                                                users:users,
                                                uid:data.uid,
                                                addFeebacks:true,
                                                noAction: true,
                                                closable: true,
                                                onClose: function (obj) {
                                                    exists = exists.filter((e) => e != obj.assetId);
                                                    refreshList()
                                                }
                                            }, MEMBERS.data));
                                            refreshList()
                                        });

                                        break;
                                    case 'tb':
                                        api.get(`/sdlms/${MEMBERS.tid}/threadbuilder/${$id}`, {}).then((res) => {
                                            new threadBuilder($.extend({}, {
                                                with: res[0].data,
                                                target: `[data-compare-id="${container_id}"]`,
                                                noAction: true,
                                                addFeebacks:true,
                                                closable: true,
                                                picture:(ajaxify.data.userData || [{}])[0].picture,
                                                uid:data.uid,
                                                users:users,
                                                assetId: $id,
                                                onClose: function (obj) {
                                                    $(obj.target).remove()
                                                    exists = exists.filter((e) => e != obj.assetId);
                                                    refreshList()

                                                }
                                            }, MEMBERS.data));
                                            refreshList();
                                        })
                                        break;
                                    case 'qz':
                                        api.get(`/sdlms/${MEMBERS.tid}/quiz/${$id}`, {}).then((res) => {
                                            new Quiz(`[data-compare-id="${container_id}"]`, {
                                                data: res[0].data,
                                                tid:MEMBERS.data.tid,
                                                assetId: $id,
                                                extr: {
                                                    assetId: $id,
                                                    closable: true,
                                                    users:users,
                                                    uid:data.uid,
                                                    picture:(ajaxify.data.userData || [{}])[0].picture,
                                                    addFeebacks:true,
                                                    onClose: function (obj) {
                                                        console.log(obj);
                                                        $('.comparison-container').find(`#${obj.assetId}`).remove();
                                                        refreshList()
                                                        exists = exists.filter((e) => e != obj.assetId);

                                                    }
                                                }
                                            });
                                            refreshList()
                                        })
                                        break;
                                    default:
                                        break;
                                }

                            } else {
                                refreshList()
                                $(`#${$id}`).children().first()
                                    .css({
                                        borderColor: '#0d52ff',
                                        borderStyle: 'dotted'
                                    }).delay(1000).queue(function (then) {
                                        $(`#${$id}`).children().first().css({
                                            borderColor: '#ccc',
                                            borderStyle: 'dashed'
                                        });
                                        then();
                                    })
                            }
                            Sortable.create( $('.comparison-container')[0],{
                                animation: 150
                            });
                        });
                    })
            }).on('sdlms.hide', function () {
                $(this).data('shown', 0);
                let data = $(this).data();
                $(`#list-${data.uid}`).slideUp(function () {
                    $(`#list-${data.uid}`).remove()
                });
            });
        
    }
    MEMBERS.join = (user) => {
        let $container = $(`#student-list-${MEMBERS.id}`);
        $container.append(MEMBERS.student(user))
    }
    MEMBERS._templatePart = (part) => {
        let parts = {

            container: (rows) => {
                let str = '';
                $.each(rows, (i, e) => {
                    str += parts.row(e)
                });
                return `<ul class="nav-links assets-list" style="display:none" id="list-${MEMBERS.uid}">${str}</ul>`
            },
            row: (row) => {
                return `
                    <li data-children="${!!row.children}">
                        <div class="icon-link">
                          <a href="#"> ${row.icon}<span class="link_name">${row.title} <span class="assets-count">${(row.children || []).length}</span></span></a>
                          <i class="fas fa-plus arrow" data-children="${!!(row.children || []).length}"></i>
                        </div>
                        ${parts.submenu((row.children || []), row.type)}
                     </li>
                    `
            },
            submenu: (children, type) => {
                let str = '';
                let labels = {
                    eb: 'Eagle Builder',
                    tb: 'Thread Builder',
                    qz: 'Quizzes'
                }
                $.each(children, (i, e) => {
                    var lbl = `${labels[type]}  ${(i + 1)}`
                    str += `<li><a href="#${e.id}" data-id="${e.id}" data-type="${type}" >${e.title ? e.title : lbl}</a></li>`
                });
                return `<ul class="sub-menu" style="display:none">${str}</ul>`

            }
        }
        return parts;
    }
    MEMBERS.student = (student) => {
        MEMBERS.log(student);
        let $that = MEMBERS;

        return `<li student data-name="${student.fullname || student.displayname}" data-uid="${student.uid}"> 
        <div class="sdlms-user-details">
        <span> <img src="${student.picture || 'http://vpr.deepthought.education:5055/assets/uploads/files/profile/1-profileavatar-1635572456194.png'}">
            <div> ${student.fullname || student.displayname}  <span class="sdlms-user-name">@${student.username}</span></div>
        </span>
            <span class="user-joined">Joined at ${$that.time(student.joinedAt, Math.abs(new Date().getTimezoneOffset()))}</span></div>
        </li>`
    }

    return MEMBERS;
})