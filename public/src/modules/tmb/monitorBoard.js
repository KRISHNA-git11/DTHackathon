"use strict";

define("tmb/monitorBoard", ["api", "sdlms/eaglebuilder"], function (api, eb) {
	let $monitorBoard = {};
	$monitorBoard.init = (data) => {
		if (!data.tid) {
			throw new Error("Invalid tid supplied");
		}
		$monitorBoard.tid = data.tid;
		$monitorBoard.data = data;
		$monitorBoard.exists = false;
		$monitorBoard.create();
	};
	$monitorBoard.unique = (prefix = "") => {
		var dt = new Date().getTime();
		var uuid = "xxxxxxxx-xxxx-yxxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
			var r = (dt + Math.random() * 16) % 16 | 0;
			dt = Math.floor(dt / 16);
			return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
		});
		return prefix + uuid;
	};
	$monitorBoard.log = (log) => {
		!$monitorBoard.data.log || console.log(log);
	};
	$monitorBoard.formatTime = (stamp) => {
		var timeLeftForEB = Math.floor(
			(stamp - Date.now()) / 60000
		);
		var timeLeftForEBHr = Math.floor(timeLeftForEB / 60);
		var timeLeftForEBMin = timeLeftForEB % 60;
		var timeLeftForEBDays = Math.floor(timeLeftForEBHr / 24)
		var timeLeftForEBdhr = timeLeftForEBHr % 24
		var timeFormat = timeLeftForEBDays > 0 ? `${timeLeftForEBDays}days ${timeLeftForEBdhr}hrs` : `${timeLeftForEBHr}hrs ${timeLeftForEBMin}mins`
		return timeFormat
	}
	$monitorBoard.create = () => {
		var b = document.documentElement;
		b.setAttribute("data-useragent", navigator.userAgent);
		b.setAttribute("data-platform", navigator.platform);
		// this.id = this.unique("sdlms-lesson-");
		$(".tmb").append(`<div></div>`);
		let $board = $(".tmb");
		$monitorBoard.$board = $board;
		{
			ajaxify.data.isTeacher ?
				$board.append(`<h1 class="text-muted" >Teacher Monitor Board</h1>`) : $board.append(`<h1 class="text-muted" >Student Monitor Board</h1>`)
		}
		var $that = $monitorBoard;
		async function renderupcomingClass(classInformation) {
			// eb.exists(classInformation[0].tid)
			// console.log(checkEB)
			$(".tmb").append(`
            <div class="classInfo" >
            <h4 class="text-bold" style="margin:1rem 0;" > Your next session is on ${classInformation[0].topic || ""
				} for ${classInformation[0].category || ""} at ${new Date(
					(classInformation[0].schedule || 0)
				).toDateString() || ""}
            </h4>
            </div>
            `);
			$(".classInfo").css({
				display: "flex",
				"justify-content": "space-between",
			});
			// let exists = false;
			if (ajaxify.data.isTeacher) {
				await api.get(`/sdlms/${classInformation[0].tid}/eaglebuilder`, {}).then((res) => {
					$that.exists = !!(Object.keys(res).length);
				})
				if ($that.exists) {
					// if (false) {
					$(".classInfo").append(
						`<h4 class="EBmapped" > EB Mapped  </h4>`
					);

				} else {
					if (classInformation[0].schedule <= (Date.now())) {
						$(".classInfo").append(
							`<h4>Please map the EB to start the class 
								<button title="map EB" class="eagleBuilderBtn btn btn-primary btn-sm" data-target=".tmb" id="${classInformation[0].tid}" style="margin-right:1rem;"> 
								<i class="fas fa-paperclip"></i> </button>
							</h4>`
						);
					} else {
						$(".classInfo").append(
							`<h4>you got ${$that.formatTime(classInformation[0].schedule) || ""} to map the EB</h4>`
						);
					}
					$monitorBoard.initEB(classInformation[0].tid, "classInfo")

				}
				$monitorBoard.checkClassStart(classInformation[0], "classInfo", `<button class="startClassBtn btn btn-primary btn-sm" > ${!classInformation[0].isLve ? `<i title="Start Class"  class="fas fa-play"></i>` : `<i title="Join class" class="fas fa-sign-in-alt"></i>`} </button>`)
			} else {
				$monitorBoard.checkClassStart(classInformation[0], "classInfo", `<button class="joinClassBtn btn btn-primary" > <i title="Join class" class="fas fa-sign-in-alt"></i> </button>`)
			}

			$(".startClassBtn").off('click').on("click", function () {
				api.put(`/sdlms/monitor/${classInformation[0].tid}`, {
					isLive: true
				}).then(r => {
					location.href = location.origin + "/live/" + classInformation[0].tid;
				})
			})
			$(".joinClassBtn").off('click').on("click", function () {
				api.put(`/sdlms/sessions/${classInformation[0].tid}/join`).then((res) => {
					socket.emit('meta.live.joined', res, (err) => {
						console.log(err)
					});
					location.href = location.origin + "/live/" + classInformation[0].tid;
				});
			})
		}
		if ($monitorBoard.sessionsList("live").length) {
			renderupcomingClass($monitorBoard.sessionsList("live"));
		} else if ($monitorBoard.sessionsList("upcoming").length) {
			renderupcomingClass($monitorBoard.sessionsList("upcoming"));
		} else {
			$(".tmb").append(`
            <div class="classInfo" >
            <h3> You have no Upcoming sessions
            </h3>
            </div>
            `);
		}
		$(".tmb").append(
			`<div class="sessionsToggle" style="margin-top:10px;" ><button class="renderUpcoming" data-type="navigation" data-navigate= "1">My Upcoming Sessions</button> <button class="renderPrevious" data-type="navigation" data-navigate= "-1" >My Previous Sessions </button></div>`
		);

		$that.renderUpcoming();
		$("[data-type = 'navigation']").off("click").on("click", function () {
			let navigate = $(this).data("navigate") || 0
			$("body").find(".ue,.editSchedule,.pe,.SessionsDiv").remove();
			$("[data-type = 'navigation']").css({
				boxShadow: '0 0 10px rgba(0,0,0,0)'
			})
			$(this).css({
				boxShadow: '0 0 10px rgba(0,0,0,0.4)'
			});
			return navigate == -1 ? $that.renderPrevious() : $that.renderUpcoming();
		})
		// $(".renderUpcoming").on("click", () => {
		// 	$(".ue,.editSchedule,.pe").remove();
		// 	$that.renderUpcoming();
		// });
		// $(".renderPrevious").on("click", () => {
		// 	$(".ue,.editSchedule,.pe").remove();
		// 	$that.renderPrevious();
		// });
	};
	$monitorBoard.sessionsList = (params) => {
		var siteData = ajaxify.data;
		$monitorBoard.log(siteData);
		siteData.Sessions.sort((a, b) =>
			a.schedule > b.schedule ? 1 : b.schedule > a.schedule ? -1 : 0
		);
		if (params == "upcoming") {
			return siteData.Sessions.filter((el) => el.schedule > Date.now());
		} else if (params == "live") {
			return siteData.Sessions.filter(
				(el) => el.schedule + 3600000 >= Date.now() && Date.now() > el.schedule
			);
		} else {
			return siteData.Sessions.filter(
				(el) => el.schedule + 3600000 < Date.now()
			);
		}
	};
	$monitorBoard.checkClassStart = (session, className, appendData) => {
		if (!session) {
			console.log('something failed')
			return false
		}
		if (session.schedule <= Date.now()) {
			console.log('apended')
			$(`.${className}`).append(appendData)
			if (!$monitorBoard.exists) {
				console.log("second check")
				$("body").find(".startClassBtn").attr("disabled", true)
			}
		}
	}
	$monitorBoard.formatDate = (date = (new Date())) => {
		return date.toLocaleTimeString()
			.split(" ")
			.slice(0, 1)
			.join(" ")
	}
	$monitorBoard.renderUpcoming = () => {
		var $that = $monitorBoard;
		$monitorBoard.sessionsList("upcoming").map((ev) => {
			var headId = `head-${ev.tid}`;
			$(".sessionsToggle").append(
				`
				<div class="SessionsDiv" style="display:flex;margin-top:1rem" >
				<h4 class="ue ${ev.tid}"  id="${headId}" >${ev.category} : ${ev.topic} on ${new Date(ev.schedule).toDateString()} at ${$that.formatDate(new Date(ev.schedule))} </h4>
					 <span> <button title="edit session" class="editSchedule btn btn-primary btn-sm" id=${ev.tid} name=${ev.topic} ><i class="fas fa-edit"></i></button> </span>
					 </div>`
			);
			if (ajaxify.data.isTeacher) {
				console.log(ev.tid)
				$monitorBoard.initEB(ev.tid, ev.tid)
			}
		});
		if (ajaxify.data.isStudent && !ajaxify.data.isTeacher) {
			$(".editSchedule").remove();
		}
		$("body").on("click", '.editSchedule', function () {
			$('#changeSession').remove();
			var refId = `head-${$(this).attr('id')}`;
			$(`#${refId}`).parents(".SessionsDiv").first().after(`<form id="changeSession" >
			<input type="hidden" value=${$(this).attr('id')} id="tid" name="tid"  >

			<sdlms style="display:block">
			<div><label for="topic" >New Topic</label>
			<input type="text" id="changedTopic" name="topic" value=${$(this).attr('name')} ></div>

			<div>
			<label for="changedDate">Schedule (date and time):</label>
			<input required type="datetime-local" id="changedDate" value="session" name="schedule">
			</div>
			
			</sdlms>
			<button class=" btn btn-primary">submit</button>
			
		  </form>`);
			// $(".editSchedule").remove();
		});
		$("body").on("submit", "#changeSession", function (e) {
			e.preventDefault();
			let $form = $(this);
			let dataArray = $form.serializeArray()
			let data = {}
			$.each(dataArray, (i, e) => {
				data[e.name] = e.value
			})
			data.schedule = new Date(data.schedule).getTime();
			$that.log(data)
			api.put('/sdlms/monitor', data)
				.then((res) => {
					$that.log(res);
				})
				.catch((e) => {
					$that.log("error", e);
				})
				.finally(() => {
					$that.log("put requested");
				});
			location.reload()
		});
	}
	$monitorBoard.renderPrevious = () => {
		$monitorBoard.sessionsList("past").map((ev) =>
			$(".tmb").find('.sessionsToggle').append(
				`<div class="SessionsDiv" style="display:flex;margin-top:1rem" ><h4 class="pe" >${ev.topic} on ${new Date(
					ev.schedule
				).toDateString()} at ${new Date(ev.schedule)
					.toLocaleTimeString()
					.split(" ")
					.slice(0, 1)
					.join(" ")} </h4></div>`
			)
		);
	}
	$monitorBoard.initEB = (tid, target) => {

		$('#changeSession').remove();
		$(`.${target}`).parents('.SessionsDiv').first().find('span').append(`<button title="map EB" class="eagleBuilderBtn btn btn-primary btn-sm" id=${tid} data-tid="${tid}" style="margin-right:1rem;" > <i class="fas fa-paperclip"></i> </button>`)
		$(".eagleBuilderBtn").off('click').on('click', function (e) {
			var $id = $(this).data('tid')
			console.log($id)
			$("body").find(".EagleBuilderContainer,sdlms-eagle-builder").remove();
			if (!$(this).data('target')) {
				$(this).parents('.SessionsDiv').first().after(`<div class="EagleBuilderContainer" data-id="${$id}" style="margin-top:10px;display:none" ></div>`);
			} else {
				$(`${$(this).data('target')}`).append(`<div class="EagleBuilderContainer" data-id="${$id}" style="margin-top:10px;display:none" ></div>`);
			}
			api.get(`/sdlms/${$id}/eaglebuilder`, {}).then((res) => {
				new eagleBuilder({
					tid: tid,
					log: true,
					tracks: 1, // Set as one only supported mupltiple
					threshold: true,
					warn: !true,
					canControl: true,
					action: "builder",
					target: ".EagleBuilderContainer",
					with: !!Object.keys(res).length ? res : undefined,
					req: !!Object.keys(res).length ? "put" : "post",
					id: res.id
				});
				$('.EagleBuilderContainer').slideDown()
			})
		})
	}
	return $monitorBoard;

});


// $(window).on("sdlms:init:monitor", (event, data) => {
// 	new monitorBoard(data);
// });

/*
const format_TimeTaken = (val) => {
	var sec_num = parseInt(val / 1000); var secsUsed = 0; var years = Math.floor(sec_num / 31536000); if (years > 0) { secsUsed += (years * 31536000); }
	var months = Math.floor((sec_num - secsUsed) / 2628288); if (months > 0) { secsUsed += (months * 2628288); }
	var weeks = Math.floor((sec_num - secsUsed) / 604800); if (weeks > 0) { secsUsed += (weeks * 604800); }
	var days = Math.floor((sec_num - secsUsed) / 86400); if (days > 0) { secsUsed += (days * 86400); }
	var hours = Math.floor((sec_num - secsUsed) / 3600); if (hours > 0) { secsUsed += (hours * 3600); }
	var minutes = Math.floor((sec_num - secsUsed) / 60); if (minutes > 0) { secsUsed += (minutes * 60); }
	var seconds = sec_num - secsUsed;
	if (years > 0) { return years + ' Years ' + months + ' Months ' + weeks + ' Weeks ' + days + ' Days ' + hours + ' H ' + minutes + ' M ' + seconds + ' S'; }
	else if (months > 0) { return months + ' Months ' + weeks + ' Weeks ' + days + ' Days ' + hours + ' H ' + minutes + ' M ' + seconds + ' S'; }
	else if (weeks > 0) { return weeks + ' Weeks ' + days + ' Days ' + hours + ' H ' + minutes + ' M ' + seconds + ' S'; }
	else if (days > 0) { return days + ' Days ' + hours + ' H ' + minutes + ' M ' + seconds + ' S'; }
	else if (hours > 0) { return hours + ' H ' + minutes + ' M ' + seconds + ' S'; }
	else if (minutes > 0) { return minutes + ' M ' + seconds + ' S'; }
	else if (seconds > 0) { return seconds + ' S'; }
	else if (seconds == 0) { return 'less than a second'; }
	else { return days + ' Days ' + hours + ' H ' + minutes + ' M ' + seconds + ' S'; }
}

function renderupcomingClass(classInformation) {
	var timeLeftForEB = Math.floor(
		(classInformation[0].schedule - Date.now()) / 60000
	);
	var timeLeftForEBHr = Math.floor(timeLeftForEB / 60);
	var timeLeftForEBMin = timeLeftForEB % 60;

	$(".tmb").append(`
	<div class="classInfo" >
	<h3 class=" text-bold "> Your next session is on ${classInformation[0].topic} for ${classInformation[0].category}
	</h3>
	</div>
	`);
	if (checkForEB()) {
		$(".classInfo").append(
			`
			</h4> You have already mapped the eagle builder for ${classInformation[0].topic}  </h4>
			`
		);
	} else {
		$(".classInfo").append(
			`
			you got ${timeLeftForEBHr}hrs, ${timeLeftForEBMin}minutes to map the EB
			`
		);
	}
}
renderupcomingClass(this.sessionsList("upcoming"));
*/
