"use strict"

define("sdlms/liveClass/liveClass", [
    'api', "sdlms/eaglebuilder", "sdlms/reactions", "sdlms/members", "sdlms/toolbar"
], function (api, eb, reactions, members, toolbar) {
    var LIVE_CLASS = {}
    LIVE_CLASS.init = (data) => {
        if (!data.tid) {
            throw new Error("No topic present")
        }
        LIVE_CLASS.tid = data.tid
        LIVE_CLASS.data = data;
        $("body").append(`
            
            <div id="breaking-news-container">
            <div id="breaking-news-colour" class="slideup animated"></div>  
                 <a class="breaking-news-headline delay-animated2 fadein marquee"> </a>  
            </div>  
        `);
        LIVE_CLASS.create()
    }
    LIVE_CLASS.create = () => {
        var b = document.documentElement;
        b.setAttribute("data-useragent", navigator.userAgent);
        b.setAttribute("data-platform", navigator.platform);

        $(".live").append(`<div class="demo" ></div>`)
        $("body").find(".demo").css({
            "display": "flex",
            "justify-content": "space-between",
            "padding-bottom": "1rem"
        })
        if (!!ajaxify.data.Sessions.length) {

            $(".demo").append(`<div class="eblc" "><div style="display:flex;align-items:center" class="sessionHeadl"><h1  class="text-dark classHead" >${ajaxify.data.Sessions[0].topic} for ${ajaxify.data.Sessions[0].category} </h1> </div>
            </div>`)
            $(".live").append(`<div class="${ajaxify.data.isTeacher ? 'reactions' : 'reactor'}"></div> `)
            $(".classHead").css({
                "text-align": "center"
            })
            // We will remove this while we will work on UI parts
            $(".sessionHeadl").prepend(`<div style="margin-right:1rem" ><div class="live-indicator-block">
            <span class="live-indicator">
                    <i class="fa fa-circle blink" aria-hidden="true"></i>Live
                    </span></div></div>`)
            $("body").find(".live-indicator").css({
                "background": "#ea2429",
                "color": "#fff",
                "padding": "6px 7px",
                "line-height": 1,
                "border-radius": "6px",
                "text-transform": "uppercase",
                "display": "inline - block",
                "vertical-align": "middle",
                "font-size": "12px",
                "font-weight": "bold",
                "width": "auto",
            })
            $("body").find(".blink").css({
                "animation": "blinker 1s cubic-bezier(0.5, 0, 1, 1) infinite alternate",
                "font-size": "10px",
                "margin-right": "5px",
                "vertical-align": "baseline",
            })
            $(".demo").css({
                "display": "flex",
                "justify-content": "space-between",
            });
            LIVE_CLASS.initEB();
            if (ajaxify.data.isTeacher) {
                LIVE_CLASS.stopClass()
            }

        } else {
            $(".live").append(`<div class="demo" style="display:flex;" ><h2 class="text-center" >There's no live class running...</h2></div>`)
        }
        LIVE_CLASS.initReactions();
        LIVE_CLASS.initMembers();
        LIVE_CLASS.initToolBar();
        $('body').append($('<div>').attr({
            class:'sdlms-zen-mode-widget',
        }).off('click').on('click',function(){

            if(!$(this).data('show')){
                $(this).data('show',1);
                $('.sdlms-floating-member-widget,.sdlms-zen-mode-widget,.sdlms-focus-mode-widget,.sdlms-floating-reaction-widget').css({
                    bottom:'30px'
                });
                $('.reactor').animate({right:-$('.sldms-reaction-icon-container').width()})
                $('sdlms-sidebar').animate({left:-$('sdlms-sidebar').width()});
                $('#breaking-news-container').animate({bottom:-30})
            }else{
                $('.sdlms-floating-member-widget,.sdlms-zen-mode-widget,.sdlms-focus-mode-widget,.sdlms-floating-reaction-widget').css({
                    bottom:'60px'
                });
                $('sdlms-sidebar').animate({left:0});
                $('.reactor').animate({right:-0})
                $('#breaking-news-container').animate({bottom:0})
                $(this).data('show',0);
            }
               
        }).html('<img src="http://vpr.deepthought.education:5055/assets/uploads/files/files/files/4042635.png">'));

        /**
         * @author Deepansu
         * Do not enable it
         * */ 
        // $('body').append($('<div>').attr({
        //     class:'sdlms-focus-mode-widget',
        // }).off('click').on('click',function(){
        //     if(!$('.comparison-container').children().length && !$(this).data('show')){
        //         return alert("Compare mode can not be enable because no comparision asset found.");
        //     };
        //     if(!$(this).data('show')){
        //         $(this).css({
        //             bottom:$('.sdlms-zen-mode-widget').data('show') ? '30px' : '60px',
        //             right:'80px'
        //         });
        //         $(this).data('show',1);
        //         $('.sdlms-floating-member-widget').css({
        //             zIndex:10000,
        //             bottom:$('.sdlms-zen-mode-widget').data('show') ? '30px' : '60px',
        //         });
        //         $('sdlms-member-list').css({
        //             zIndex:10000
        //         })

        //     }else{
        //         $(this).css({
        //             bottom:$('.sdlms-zen-mode-widget').data('show') ? '30px' : '60px',
        //             right:'153px'
        //         });
        //         $('.sdlms-floating-member-widget').css({
        //             zIndex:9,
        //             bottom:$('.sdlms-zen-mode-widget').data('show') ? '30px' : '60px',
        //         }) 
        //         $('sdlms-member-list').css({
        //             zIndex:10
        //         })
        //         $(this).data('show',0);
        //     }
        //     $('.comparison-container').toggleClass('focus-mode');
        //     let max_comparison_per_screen = 2;
        //     if($(window).width() > 1400){
        //         max_comparison_per_screen = 3;
        //     }
        //     $('.comparison-container').find('[data-compare-id]').css({
        //         minWidth:`${($('.comparison-container').width()/max_comparison_per_screen) - 15}px`
        //     });
        // }).html('<img src="http://vpr.deepthought.education:5055/assets/uploads/files/files/files/3316992.png">'));

    }

    LIVE_CLASS.initEB = () => {
        var isTeacher = ajaxify.data.isTeacher
        var tid = ajaxify.data.Sessions[0].tid
        var  eb =  new eagleBuilder({
            tid: tid || 51,
            log: !true,
            tracks: 1, // Set as one only supported mupltiple
            threshold: true,
            warn: !true,
            canControl: isTeacher,
            target: ".eblc",
            onChange: (data) => {
                if (isTeacher) {
                    console.log(data)
                    socket.emit('meta.live.ebChange', data, (err) => {
                        console.log(err)
                    })
                    saveEB()
                   
                } else {
                    console.log("listening")
                }
            },
            onRender: (data) => {
                if (isTeacher) {
                    socket.emit('meta.live.ebRefresh', data, (err) => {
                        console.log(err)
                    })
                }
            },
        })
        function saveEB() {
            var cloned = eb.clone();
            let trackId = eb.trackId;
            app.log(trackId)
            api.put(`/sdlms/${tid}/eaglebuilder/${trackId}`, cloned)
        }
        if (!isTeacher) {
            socket.on('meta.live.ebChange', data => {
                console.log(data)
                eb.process(data)
            })
            socket.on('meta.live.ebRefresh', data => {
                eb.destroy()
                eb.render()
            })
            socket.on("meta.live.stopSession", data => {
                location.reload()
            })
        } else {
            window.onbeforeunload = saveEB
        }

    }
    LIVE_CLASS.initMembers = () => {
        var tid = ajaxify.data.Sessions[0].tid
        members.init({
            tid: tid,
            log: !true,
        });
        socket.on('meta.live.joined', data => {
            members.join(data)
        })
    }
    LIVE_CLASS.initReactions = () => {
        var isTeacher = ajaxify.data.isTeacher
        var tid = ajaxify.data.Sessions[0].tid
        function saveReactions(data) {
            if (!isTeacher) {
                console.log(data)

                api.put(`/sdlms/reactions/${tid}/${data.reaction}`, data);
                socket.emit('meta.live.react', data, (err) => {
                    console.log(err)
                })
            }
        }
        reactions.init({
            tid: tid,
            control: isTeacher,
            name: ((ajaxify.data.userData || [])[0].username),
            target: isTeacher ? '.reactions' : '.reactor',
            onReact: (data) => {
                saveReactions(data)
            }
        })
        if (isTeacher) {
            socket.on('meta.live.react', data => {
                console.log(data)
                reactions.react(data)
            })
        }

    }

    LIVE_CLASS.initToolBar = () => {
        var isTeacher = ajaxify.data.isTeacher;
        var tid = ajaxify.data.Sessions[0].tid
        var uid = ajaxify.data.userData[0].uid

        if (!isTeacher) {
            toolbar.init({
                tid: tid,
                uid: uid
            })
        }

    }
    LIVE_CLASS.stopClass = () => {
        // $(".demo").append(`<button style = "margin-top:1rem;" class="stopClassBtn btn btn-danger" title="Stop Class" > <i class="fas fa-sign-out-alt"></i> </button>`)
        $(".stopClassBtn").off("click").on("click", function () {
            var modal = bootbox.dialog({
                title: "Stop the class?",
                message: "Confirm ending the class for everyone",
                buttons: {
                    cancel: {
                        label: "Cancel",
                        className: "btn-primary",
                        callback: cancel
                    },
                    confirm: {
                        label: "Confirm",
                        className: "btn-primary",
                        callback: submit,
                    }

                },
            });

            modal.modal("show");
            function submit() {
                api.put(`/sdlms/monitor/${ajaxify.data.Sessions[0].tid}`, {
                    isLive: false
                })
                var data = {}
                socket.emit("meta.live.stopSession", data, (data) => {
                    // console.log(data)
                })

                location.reload()
            }
            function cancel() {
                modal.modal("hide");
            }

        })
    }

    return LIVE_CLASS
});