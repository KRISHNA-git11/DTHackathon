class FeedBacks {
    constructor(data) {
        if (!data.target || !$(data.target).length) {
            throw new Error('Invalid HTML elem supplied');
        }
        if (!data.assetId) {
            throw new Error('Invalid assetId supplied');
        }
        if (!data.uid) {
            throw new Error('Invalid uid supplied');
        }
        this.data = data;
        var b = document.documentElement;
        b.setAttribute("data-useragent", navigator.userAgent);
        b.setAttribute("data-platform", navigator.platform);
        this.builder();
    }
    unique(prefix = "") {
        var dt = new Date().getTime();
        var uuid = "xxxxxxxx-xxxx-yxxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
        });
        return prefix + uuid;
    }

    log(log) {
        !this.data.log || console.log(log);
    }
    builder() {
        this.id = this.unique("sdlms-this-");

        $(this.data.target).append(
            $("<sdlms-feedbacks>")
                .attr({
                    id: this.id,
                    style:'width:100%'
                })
        );
        let $container = $(`#${this.id}`);
        $container.append(`<div class="sdlms-feedbacks" id="feedback-${this.id}">feedbacks <i class="fas fa-chevron-down"></i></div>`);
        $container.append(`<div class="sdlms-feedbacks-container" style="display:none" id="feedback-contianer-${this.id}">this <i class="fas fa-chevron"></i></div>`)
        this.render();
    }
    render() {
        let self = this;
        let assetId = self.data.assetId;

        var saveComment = function (data) {
            $(Object.keys(data.pings)).each(function (index, userId) {
                var fullname = data.pings[userId];
                var pingText = '@' + fullname;
                data.content = data.content.replace(new RegExp('@' + userId, 'g'), pingText);
            });
            return data;
        }
        let $renderer = $(`#feedback-contianer-${self.id}`)
        let $feedback = $(`#feedback-${self.id}`);
        $feedback.off('click').on('click', function () {
            $(this).toggleClass('sdlms-shown')
            $renderer.slideToggle();
        });
        var usersArray = self.data.users || [];
        function  checkForNew(date){
            return ((Date.now() -  new Date(date).getTime())/(1000) < 5000)
        }
        require(['api'], function (api) {
            $renderer.comments({
                profilePictureURL: self.data.picture,
                currentUserId: self.data.uid,
                roundProfilePictures: true,
                textareaRows: 3,
                parentElement: self.data.target,
                enableAttachments: !true,
                enableHashtags: true,
                enablePinging: true,
                users:usersArray,
                scrollContainer: $renderer,
                timeFormatter: function (time) {
                    let date = new Date(time);
                    var intervals = [
                        { label: 'year',   seconds: 31536000 },
                        { label: 'month',  seconds: 2592000 },
                        { label: 'day',    seconds: 86400 },
                        { label: 'hour',   seconds: 3600 },
                        { label: 'minute', seconds: 60 },
                        { label: 'second', seconds: 1 }
                    ];
                    
                    var seconds = Math.floor((Date.now() - date.getTime()) / 1000);
                    if(!seconds) return `Just now`;
                    var interval = intervals.find(i => i.seconds < seconds);
                    var count = Math.floor(seconds / interval.seconds);
                    return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
                },
                searchUsers: function (term, success, error) {
                    success(usersArray.filter(function (user) {
                        var containsSearchTerm = user.fullname.toLowerCase().indexOf(term.toLowerCase()) != -1;
                        var isNotSelf = user.id != self.data.uid;
                        return containsSearchTerm && isNotSelf;
                    }));
                },
                getComments: function (success, error) {

                    api.get(`/api/v3/sdlms/feedbacks?id=${assetId}`, {}).then(res => {
                        res = res.map(e => $.extend({}, e, {
                            id: e._id,
                            created_by_current_user: (e.creator == self.data.uid),
                            is_new:checkForNew(e.modified || e.created),
                            user_has_upvoted: !!((e.votes && Array.isArray(e.votes) ? e.votes : [])).find(vote => vote.uid == self.data.uid)
                        }))
                        success(res);
                    })

                },

                postComment: function (data, success, error) {
                    let feedback = saveComment(data);
                    let payload = {
                        content: feedback.content,
                        attachment_id: assetId,
                        attachment_type: "feedback",
                        pings: feedback.pings,
                        attachments: feedback.attachments,
                        parent: feedback.parent,
                        created_by_current_user: feedback.created_by_current_user
                    }
                    console.log(feedback)
                    api.post(`/api/v3/sdlms/feedbacks`, payload).then(res => {
                        success(feedback);
                        self.render();
                    });
                },
                putComment: function (data, success, error) {
                    let feedback = saveComment(data);
                    let payload = {
                        id: feedback.id,
                        content: feedback.content,
                        pings: feedback.pings != null ? feedback.pings : {},
                        attachments: feedback.attachments != null ? feedback.attachments : [],
                        upvote_count: feedback.upvote_count
                    }
                    api.put(`/api/v3/sdlms/feedbacks/${data.id}`, payload).then(res => {
                        success(feedback);
                        self.render();
                    });
                },
                deleteComment: function (data, success, error) {
                    api.del(`/api/v3/sdlms/feedbacks/${data.id}`, {}).then(res => {
                        success();
                        self.render();
                    });
                },
                upvoteComment: function (data, success, error) {
                    api.put(`/sdlms/feedbacks/${data.id}/vote`, {}).then(res => {
                        success(data);
                        // this.render();
                    });
                },
                validateAttachments: function (attachments, callback) {
                    setTimeout(function () {
                        callback(attachments);
                    }, 500);
                },
            });
        })
    }
}