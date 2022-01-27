'use strict';

/* globals define */

define('composer/sdlms/threadbuilder', function () {

    var threadbuilder = {};
    threadbuilder.$active = {};

    $(window).on('action:composer.discard', function (evt, data) {
        threadbuilder.$active = {};
    });

    threadbuilder.id = () => {
        var stamp = new Date().getTime();
        var uuid = 'xxxxxxxx_xxxx_xxxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (stamp + Math.random() * 16) % 16 | 0;
            stamp = Math.floor(stamp / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid.replaceAll('_', '-');
    }
    (function ($) {
        $.fn.serializeObject = function () {
            var self = this,
                json = {},
                push_counters = {},
                patterns = {
                    "validate": /^[a-zA-Z][a-zA-Z0-9_]*(?:\[(?:\d*|[a-zA-Z0-9_]+)\])*$/,
                    "key": /[a-zA-Z0-9_]+|(?=\[\])/g,
                    "push": /^$/,
                    "fixed": /^\d+$/,
                    "named": /^[a-zA-Z0-9_]+$/
                };
            this.build = function (base, key, value) {
                base[key] = value;
                return base;
            };
            this.push_counter = function (key) {
                if (push_counters[key] === undefined) {
                    push_counters[key] = 0;
                }
                return push_counters[key]++;
            };
            $.each($(this).serializeArray(), function () {
                // Skip invalid keys
                if (!patterns.validate.test(this.name)) {
                    return;
                }
                var k,
                    keys = this.name.match(patterns.key),
                    merge = this.value,
                    reverse_key = this.name;
                while ((k = keys.pop()) !== undefined) {
                    reverse_key = reverse_key.replace(new RegExp("\\[" + k + "\\]$"), '');
                    if (k.match(patterns.push)) {
                        merge = self.build([], self.push_counter(reverse_key), merge);
                    }
                    else if (k.match(patterns.fixed)) {
                        merge = self.build([], k, merge);
                    }
                    else if (k.match(patterns.named)) {
                        merge = self.build({}, k, merge);
                    }
                }
                json = $.extend(true, json, merge);
            });
            return json;
        };
    })(jQuery);
    threadbuilder.init = function (postContainer, post_uuid, dump = {}) {
        var element = postContainer.find('.threadbuilder');
        if (!element) {
            app.log('Element Is not present.');
            return;
        }
        let stylesID = threadbuilder.id();
        $(element).replaceWith($('<div>').attr({ component: 'sdlms-thread', id: 'sdlms-' + stylesID }));
        let $component = $('[component="sdlms-thread"]');


        threadbuilder.$container = $component;

        $component.append(
            $('<form>').attr({
                class: 'sdlms-thread-form'
            }).append(`
            <style>
            [component=sdlms-thread]{width:100%}.sdlms-main-thread{width:100%;background:#fff;border:1px solid #fff;padding:1rem;border-radius:8px}
            .sdlms-thread-container{width:100%;display:flex;align-items:flex-start}[class^=sdlms-container]{display:flex;padding:0 0 0 1rem}.sdlms-container-33{width:calc(100% / 3)}
            .sdlms-container-50{width:calc(100% / 2)}.sdlms-header{padding-bottom:1rem}.sdlms-header *{font-weight:700}.sdlms-add-more{display:flex;justify-content:end}
            .sdlms-add-more span{cursor:pointer}.sdlms-input{width:100%;padding:.5rem}option{border-radius:0}
            </style>`)
        ).append($('<div>').attr({
            class: 'sdlms-thread-action',
            style: 'display:flex;justify-content:flex-end;padding:1rem 0'
        }).append(
            $('<span>').attr({
                style: 'cursor:pointer;'
            }).text('Add new Thread').on('click', function (e) {
                threadbuilder.thread(
                    $component.find('.sdlms-thread-form'),
                    0, '', $component.find('.sdlms-main-thread').length)
            }))
        )
        let $form = $component.find('.sdlms-thread-form');
        threadbuilder.$active = $form;
        if (dump.thread && dump.thread.length) {
            $.each(dump.thread, function (i, e) {
                threadbuilder.thread($form, 1, e.subthread, 0)
            })
        } else {
            threadbuilder.thread($form, 0, [], 0)
        }

        var data = {
            element: element,
            config: config
        };
        $form.on('change','.sdlms-input',function(){
            console.log(threadbuilder.getJSON())
        })
        $(window).trigger('composer:threadbuilder:init', data);
    };
    threadbuilder.thread = (target, index, values = [], threadIndex) => {
        target.append(
            $('<div>').attr({
                class: 'sdlms-main-thread',
                style: 'margin-top:1rem;border-bottom: 2px dashed #ccc;'
            }).append(
                $('<div>').attr({
                    class: 'sdlms-thread-container sdlms-header'
                }).append(
                    $('<div>').attr({
                        class: 'sdlms-container-33',
                        style: 'padding:0'
                    }).text('Sub-Thread Content')
                ).append(
                    $('<div>').attr({
                        class: 'sdlms-container-33'
                    })
                ).append(
                    $('<div>').attr({
                        class: 'sdlms-container-33'
                    }).append(
                        $('<div>').attr({
                            class: 'sdlms-container-50',
                            style: 'padding:0'
                        }).text('Category')
                    ).append(
                        $('<div>').attr({
                            class: 'sdlms-container-50'
                        }).text('Process')
                    )
                )
            ).append(
                $('<div>').attr({
                    class: 'sub',
                }).html(() => {
                    let str = '';
                    if (values.length) {
                        $.each(values, function (i, e) {
                            str += threadbuilder.Subthread(i, threadIndex, e)
                        });
                    } else {
                        str += threadbuilder.Subthread(0, threadIndex, {})
                    }
                    return str;
                })
            ).append(
                $('<div>').attr({
                    class: 'sdlms-add-more'
                }).append($('<span>').attr({

                }).text('Add more subthread').on('click', function (e) {
                    $(this).parents('.sdlms-main-thread').find('.sub').append(
                        threadbuilder.Subthread($(this).parents('.sdlms-main-thread').find('.sub .sdlms-thread-container').length, threadIndex)
                    )
                })
                )
            )
        )
    }
    threadbuilder.Subthread = (index, threadIndex, values = {}) => {
        return $('<div>').attr({
            class: 'sdlms-thread-container',
            style: 'margin-top:1rem;' + (index ? 'border-top: 1px solid;padding-top: 1rem;' : '')
        }).append($('<div>').attr({
            class: 'sdlms-container-33'
        }).append(
            $('<textarea>').attr({
                class: 'sdlms-input',
                placeholder: 'Enter sub-thread text here...',
                rows: '5',
                name: `thread[${threadIndex}][subthread][${index}][content]`
            }).html(values.content || '')
        )
        ).append($('<div>').attr({
            class: 'sdlms-container-33'
        }).append(
            $('<textarea>').attr({
                class: 'sdlms-input',
                placeholder: 'Enter interpretation text here...',
                rows: '5',
                name: `thread[${threadIndex}][subthread][${index}][interpretation]`
            }).html(values.interpretation || '')
        )
        ).append($('<div>').attr({
            class: 'sdlms-container-33'
        }).append(
            $('<div>').attr({
                class: 'sdlms-container-50'
            }).append(
                $('<select>').attr({
                    class: 'sdlms-input',
                    name: `thread[${threadIndex}][subthread][${index}][category]`,
                    value: values.category || 'Test option'
                }).append(
                    $('<option>').attr({
                        value: '1'
                    }).text('Choose Category')
                )
            )
        ).append(
            $('<div>').attr({
                class: 'sdlms-container-50'
            }).append(
                $('<select>').attr({
                    class: 'sdlms-input',
                    name: `thread[${threadIndex}][subthread][${index}][process]`,
                    value: values.process || 'Test option'
                }).append(
                    $('<option>').attr({
                        value: '1'
                    }).text('Choose Process')
                )
            )
        )
        )[0].outerHTML;
    }
    threadbuilder.getJSON = ()=>{
        return $('.sdlms-thread-form').serializeObject()
    }
    threadbuilder.table = (e) =>{
        return  $('<div>').attr({
            class:'sdlms-table-contianer'
        }).append(
            $('<div>').attr({
                class:'sdlms-table-cell sdlms-table-header'
            }).append($('<div>').text('Sub-Thread Content'))
              .append($('<div>').text('Interpretation'))
              .append($('<div>').text('Category'))
              .append($('<div>').text('Process'))
        ).append(function(){
            let str = '';
            $.each(e.subthread,function(i,et){
                str += `  
                <div class="sdlms-table-cell sdlms-table-body">
                <div>${et.content}</div>
                <div>${et.interpretation}</div>
                <div>${et.category}</div>
                <div>${et.process}</div>
            </div>`
            });
            return str;
        })[0].outerHTML;
    }
    threadbuilder.getHTML = ()=>{
        let dump =  threadbuilder.getJSON();
        let $raw = $('<div>').append(
                `<style>.sdlms-table-header{width:100%;display:flex;font-weight:700}
                .sdlms-table-contianer{width:100%;color:#000;margin-bottom:1rem}.sdlms-table-body{width:100%;display:flex}.sdlms-table-cell>div{width:calc(100%/4);padding:10px;text-align:center}
                .sdlms-table-header{border:1px solid #ccc;border-bottom:none}.sdlms-table-body>div{border:.5px dotted #ccc;text-align:left;font-size:1.4rem}</style>`)
               
            $.each(dump.thread,function(i,e){
                $raw.append(threadbuilder.table(e));
            })

        return $($raw).html();
    }
    
    return threadbuilder;
});
