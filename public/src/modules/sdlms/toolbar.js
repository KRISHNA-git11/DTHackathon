"use strict";

define("sdlms/toolbar", [
    "api", "sdlms/threadbuilder", "sdlms/quiz", "sdlms/eaglebuilder"
], function (api, threadbuilder, quiz, eaglebuilder) {
    var TOOLBAR = {};
    TOOLBAR.init = (data = {}) => {
        if (!data.tid) {
            throw new Error("Invalid tid supplied");
        }

        TOOLBAR.tid = data.tid;
        TOOLBAR.data = data;

        var b = document.documentElement;
        b.setAttribute("data-useragent", navigator.userAgent);
        b.setAttribute("data-platform", navigator.platform);
        TOOLBAR.builder();
    }
    TOOLBAR.unique = (prefix = "") => {
        var dt = new Date().getTime();
        var uuid = "xxxxxxxx-xxxx-yxxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
        });
        return prefix + uuid;
    }

    TOOLBAR.log = (log) => {
        !TOOLBAR.data.log || console.log(log);
    }
    TOOLBAR.builder = () => {
        $("sdlms-sidebar").remove();
        TOOLBAR.id = TOOLBAR.unique("sdlms-eagle-");
        $("body").prepend(
            $("<sdlms-sidebar>")
                .attr({
                    id: TOOLBAR.id,
                    class: 'sdlms-sidebar close'
                })
        );
        let $renderer = $(`#${TOOLBAR.id}`);
        TOOLBAR.$renderer = $renderer;
        TOOLBAR.template();
    }
    TOOLBAR.template = () => {
        api.get(`/sdlms/${TOOLBAR.tid}/assets/${TOOLBAR.data.uid}`, {})
            .then((r) => {
                TOOLBAR.$renderer.append(
                    TOOLBAR._templatePart().header() +
                    TOOLBAR._templatePart().container([{
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
                TOOLBAR.$renderer.find('.toggleBar').on('click', function () {
                    $('.sdlms-sidebar').toggleClass('close')
                });
                TOOLBAR.$renderer.find('.nav-links > li .arrow').on('click', function () {
                    $(this).parents('li').first().find('.sub-menu').slideToggle();
                    $(this).parents('li').first().toggleClass('active');

                });
                TOOLBAR.$renderer.find('.nav-links > li ul > li a').on('click', function () {
                    let $id = $(this).data('id');
                    let $type = $(this).data('type');
                    $('.sdlms-tools-container').remove();
                    $('.live').append('<div class="sdlms-tools-container"></div>')
                    switch ($type) {
                        case "eb":
                            if ($id) {

                                api.get(`/sdlms/${TOOLBAR.tid}/eaglebuilder?id=${$id}`, {}).then((r) => {
                                    new eagleBuilder($.extend({}, {
                                        with: r,
                                        action: "builder",
                                        target: '.sdlms-tools-container',
                                        log: true,
                                        tracks: 1, // Set as one only supported mupltiple
                                        threshold: true,
                                        warn: !true,
                                        canControl: true,
                                        closable:true,
                                        req: "put",
                                        id: $id,
                                        assetId:$id
                                    }, TOOLBAR.data))
                                })
                            } else {
                                new eagleBuilder(
                                    $.extend({}, {
                                        action: "builder",
                                        target: '.sdlms-tools-container',
                                        log: true,
                                        tracks: 1, // Set as one only supported mupltiple
                                        threshold: true,
                                        warn: !true,
                                        canControl: true,
                                        req: "post",
                                        closable:true
                                    }, TOOLBAR.data)
                                )
                            }
                            break;
                        case "tb":
                            if ($id) {

                                api.get(`/sdlms/${TOOLBAR.tid}/threadbuilder/${$id}`, {}).then((r) => {
                                    new threadBuilder($.extend({}, { with: r[0].data, assetId: $id, target: '.sdlms-tools-container' }, TOOLBAR.data))
                                })
                            } else {
                                new threadBuilder($.extend({}, { assetId: $id, target: '.sdlms-tools-container' }, TOOLBAR.data))
                            }
                            break;
                        case "qz":
                            if ($id) {
                                api.get(`/sdlms/${TOOLBAR.tid}/quiz/${$id}`, {}).then((r) => {
                                    new Quiz('.sdlms-tools-container', $.extend({},TOOLBAR.data,{  assetId: $id,data: r[0].data }))
                                })
                            } else {
                                new Quiz('.sdlms-tools-container',TOOLBAR.data)
                            }

                        default:
                            break;
                    }
                });
            })
    }
    TOOLBAR._templatePart = (part) => {
        let parts = {
            header: () => {
                return ` 
                        <div class="logo-details">
                              <i class="fas fa-bars toggleBar cursor"></i>
                        </div>`
            },
            container: (rows) => {
                let str = '';
                $.each(rows, (i, e) => {
                    str += parts.row(e)
                });
                return `<ul class="nav-links">${str}</ul>`
            },
            row: (row) => {
                return `
                    <li data-children="${!!row.children}">
                        <div class="iocn-link">
                          <a href="#"> ${row.icon}<span class="link_name">${row.title}</span></a>
                          <i class="fas fa-plus arrow"></i>
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
                    str += `<li><a href="#" data-id="${e.id}" data-type="${type}" >${e.title ? e.title : lbl}</a></li>`
                });
                str += `<li><a href="#" data-id="0" data-type="${type}" >Add More</a></li>`
                return `<ul class="sub-menu">${str}</ul>`

            }
        }
        return parts;
    }
    return TOOLBAR;
});