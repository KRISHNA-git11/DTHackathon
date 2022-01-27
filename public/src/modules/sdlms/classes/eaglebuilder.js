class eagleBuilder {
	constructor(data) {
		if (!data.tid) {
			throw new Error("Invalid tid supplied");
		}
		this.data = {
			tid: Number(),
			log: Boolean(),
			tracks: Number(),
			threshold: Boolean(),
			canControl: Boolean(),
			onStart: () => {},
			onPause: () => {},
			onResume: () => {},
			onComplete: () => {},
			onExceed: () => {},
			onLimit: () => {},
			onLock: () => {},
			onShow: () => {},
			onHide: () => {},
			onRender: () => {},
			onDestroy: () => {},
			onUpdate: () => {},
			onResize: () => {},
			onMove: () => {},
			ifOnBreak: () => {},
			// sync:5
		};

		this.tid = data.tid;
		this.data = data;
		var b = document.documentElement;
		b.setAttribute("data-useragent", navigator.userAgent);
		b.setAttribute("data-platform", navigator.platform);
		if (this.data.sync && !isNaN(this.data.sync)) {
			setInterval(
				() => {
					this.log("syncing");
					if (this.is(this.data.onUpdate, "function")) {
						this.call(this.data.onUpdate, this)
					}
				},
				(this.data.sync < 5 ?
					(5000) :
					(this.data.sync * 1000))
			);
		}
		if (this.data.action == "builder") {
			this.builder(this.data.target);
		} else {
			this.render();
		}
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
	is($target, $type) {
		if (typeof $target == $type) {
			return true;
		}
		return false;
	}
	log(log) {
		!this.data.log || console.log(log);
	}
	draggable() {
		let $that = this;
		var pos1 = 0,
			pos2 = 0,
			pos3 = 0,
			pos4 = 0;
		var elmnt = null;

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
		var widget = $that.$renderer[0];
		var target = $that.$renderer.find(".sdlms-session-control")[0];
		if (!target) return;
		widget.onmousedown = function () {
			this.style.zIndex = "" + zIndex();
		};

		if (target) {
			target.parentPopup = widget;
			target.onmousedown = dragMouseDown;
		}

		function dragMouseDown(e) {
			elmnt = this.parentPopup;
			elmnt.style.zIndex = "" + zIndex();

			e = e || window.event;
			pos3 = e.clientX;
			pos4 = e.clientY;
			document.onmouseup = closeDragElement;
			document.onmousemove = elementDrag;
			if ($that.is($that.data.onMove, "function")) {

				$that.call($that.data.onMove, $that)

			}
		}

		function elementDrag(e) {
			if (!elmnt) {
				return;
			}

			e = e || window.event;
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;
			if (
				elmnt.offsetTop - pos2 > 0 &&
				elmnt.offsetTop - pos2 < $(window).height() - 12 - $(elmnt).height()
			) {
				elmnt.style.top = elmnt.offsetTop - pos2 + "px";
			}
			if (
				elmnt.offsetLeft - pos1 > 0 &&
				elmnt.offsetLeft - pos1 < $(window).width() - 1 - $(elmnt).width()
			) {
				elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
			}
		}

		function closeDragElement() {
			document.onmouseup = null;
			document.onmousemove = null;
		}
	}
	collapsible() {
		let $that = this;
		$that.$renderer
			.find(".sdlms-label-wrap")
			.click(function (e) {
				try {
					if ([...e.target.attributes].filter(e => e.name == 'track-completed').length) {
						return;
					}
				} catch (error) {

				}

				if ($($(this).next('ul')).is(":visible")) {
					if ($that.is($that.data.onShow, "function")) {
						$that.call($that.data.onShow, $.extend({}, $(this).data(), {
							status: 'show'
						}))
					}
				} else {
					if ($that.is($that.data.onHide, "function")) {
						$that.call($that.data.onHide, $.extend({}, $(this).data(), {
							status: 'hide'
						}))
					}
				}
				$(this).next().slideToggle();
			});
	}
	render(data, preview) {
		this.id = this.unique("sdlms-eagle-");
		if (preview && $("sdlms-eagle-renderer.preview").length) {
			$("sdlms-eagle-renderer.preview").remove();
		}
		let $that = this;
		$("body").prepend(
			$("<sdlms-eagle-renderer>")
			.attr({
				id: $that.id,
				class: preview ? "preview" : "",
				style: 'top:50%;left:500px'
			})
			.append(`<div class="sdlms-session-control">
                             <div tracker-time>--:--</div>
                             <div>
                                <span class="${$that.data.canControl || 'no-control'}">
                                <i class="fas stopClassBtn fa-stop"></i>
                                <i session-trigger class="fas fa-play"></i></span>
                                <i show-tracks class="fas fa-bars"></i>
                             </div>
                         </div>`)
		);
		let $renderer = $(`#${$that.id}`);
		this.$renderer = $renderer;
		this.list = [];

		if (!data) {
			require(['api'],function(api){
				api.get(`/sdlms/${$that.tid}/tracker`, {}).then((r) => {
					$that.log(r)
					$that.trackId = r.id;
					if (r.tracks) {
						let tracks = r.tracks;
						$that.list = tracks;
						$that.meta = r.meta;
						$that.template();
					}
				});
			})
			
		} else if (data.tracks) {
			$that.list = data.tracks;
			$that.meta = data.meta;
			$that.template();
		}
	}
	clone() {
		let capture = [];
		this.$renderer.find('[toggle-track]').each(function () {
			let data = $(this).data()
			if (data.status == "exceeded") {
				data.status = "paused"
			}
			capture.push(data)
		})
		let remap = this.list;
		let $that = this;
		$.each(remap, function (i, e) {
			$that.log(e.id)
			remap[i].status = $(`.sdlms-label-wrap[data-id="${e.id}"]`).find("[title-type='track']").data("status")
			remap[i].subtracks = e.subtracks.map(k => ((k.seek = (capture.find(l => l.id == k.id) || {})['seek'], k.status = (capture.find(l => l.id == k.id) || {})['status']), k))
			if (remap[i].transitions) {
				remap[i].transitions = ((e.transitions.seek = $(`[data-track-id="${e.id}"][data-transition]`).data('seek'), e.transitions.status = $(`[data-track-id="${e.id}"][data-transition]`).data('status')), e.transitions)
			}
			// console.log(remap[i])
		})
		// console.log({
		// 	meta: EAGLE_BUILDER.meta,
		// 	tracks: remap
		// })
		return {
			meta: $that.meta,
			tracks: remap
		};
	}
	template() {
		let $renderer = this.$renderer;
		this.log(this.$renderer);
		$renderer.append(
			$("<div>").attr({
				class: "sdlms-start-wrap",
				id: "track-list-" + this.id,
			})
		);
		let $container = $("#track-list-" + this.id);
		let $that = this;
		$renderer.find('[tracker-time]').text(this.time(this.meta.duration))
		$renderer.find('[show-tracks]').off('click').on('click', function () {
			$container.slideToggle();
			$(this).toggleClass('fa-bars fa-times');
		});

		function parse(tracks) {
			var html = "<ul>";

			function serial(str) {
				$that.log(str);
				let s = "";
				if (str.split("||").length < 2) {
					return str;
				}
				$.each(str.split("||"), (i, e) => {
					s += `<small>${i + 1}. </small> ${e} <br>`;
				});
				return s;
			}
			$.each(tracks, (i, e) => {
				$that.log(e);
				html += `<li class="sdlms-item ${$that.data.canControl || 'no-control'}">
                      <div class="sdlms-label-wrap" data-id="${e.id}">
                        <span class="sdlms-label-title" title-type="${e.type || "subtrack"
					}">${serial(e.title)} ${e.type == "track"
						? `<span style="font-size: 2rem;"><small track-status></small> <i class="fas fa-clipboard-check"  data-id="${e.id}" data-status="${e.status}" track-completed></i></span>`
						: ""
					}</span>
                        <span class="sdlms-label-icon"></span>
                        <span class="sdlms-track-tools">${e.type != "track"
						? `<i class="fas fa-play"data-seek="${e.seek || 0
						}" data-time="${e.duration
						}" toggle-track  data-status="${e.status || 'paused'}" data-id="${e.id}"></i>`
						: ""
					}</span>
                        <span ${e.type != "track" ? "track-seek" : ""} ></span>
                        <span ${e.type != "track" ? "track-timer" : ""}>${e.type != "track" ? "- " + $that.time(e.duration) : ""
					}</span>
                      </div>${e.subtracks ? parse(e.subtracks) : ""}
                    </li>`;
				if ((e.transitions || {}).duration) {
					html += `<li class="sdlms-transition ${$that.data.canControl || 'no-control'}" style="width:0%" data-status="${e.transitions.status}" data-seek="${(e.transitions.seek || 0)}" data-track-id="${e.id
						}" data-transition="${e.transitions.duration}"><span>${$that.time(
							e.transitions.duration
						)}</span><i data-skip-transition class="fas fa-angle-double-right"></i></li>`;
				}
			});
			return html + "</ul>";
		}
		$container.append(parse(this.list));
		this.running = [];
		$container
			.find("[toggle-track]")
			.off("click completed")
			.on("click", function (e) {
				if (!$that.data.canControl) {
					$that.log('unauthorized event');
					// return
					if ($that.is($that.data.onUnauthorizedEvent, "function")) {
						$that.data.onUnauthorizedEvent($(this).data());
					}
				}


				if ($that.onBreak) {
					$that.log(
						"Currently Transition is Running Unable to start or Stop Track"
					);
					if ($that.is($that.data.ifOnBreak, "function")) {
						$that.data.ifOnBreak({
							trackID: $that.onBreak,
						});
					}
					return;
				}
				let $thisData = $(this).data();
				if (
					(!$thisData.status || $thisData.status == "paused") &&
					$that.running.length > $that.data.tracks - 1
				) {
					$that.log("Maximum tracks reached allowed:" + $that.data.tracks);
					if ($that.is($that.data.onLimit, "function")) {
						$that.call($that.data.onLimit, $.extend({}, $(this).data(), {
							status: "limitReached",
							message: "Maximum Tracks limit reached allowed: " + $that.data.tracks,
						}))
					}
					return;
				}
				var interval,
					duration = $thisData.duration || 0,
					shouldRun,
					seek =
					$(this).data("seek") || !$(this).data("seek") < 0 ?
					Math.abs($(this).data("seek") * 60) :
					0,
					subtrack_id,
					timer;
				$that.log("Seek" + seek);
				subtrack_id = $(this).data("id");
				if (subtrack_id) {
					let track =
						$that.list.filter(
							(e) => e.subtracks.findIndex((k) => k.id == subtrack_id) > -1
						)[0] || [];
					if (track.subtracks) {
						$that.log("Found Track:" + JSON.stringify(track));
						let subtrack =
							track.subtracks[
								track.subtracks.findIndex((k) => k.id == subtrack_id)
							];
						$that.log("Current Sub Track:" + JSON.stringify(subtrack));
						$(this).toggleClass("fa-play fa-pause");
						let $track = $(this).parents(".sdlms-item").first();
						let $seek = $track.find("[track-seek]");
						let $timer = $track.find("[track-timer]");
						$(this).data("time", subtrack.duration);
						duration = $thisData.duration || subtrack.duration || 0;
						duration = duration * 60;
						timer = new Timer();
						$that.log("Duration" + duration);
						if (!$thisData.status && !$thisData.seek) {
							if ($that.is($that.data.onStart, "function")) {
								$that.call($that.data.onStart, $.extend({}, $(this).data(), {
									status: "start",
								}))
							}
						}
						if (
							$thisData.status == "running" ||
							$thisData.status == "exceeded"
						) {
							$that.log("Event Paused");
							$that.running = $that.running.filter((k) => k != subtrack_id);
							$(this).data("status", "paused");
							$track.removeClass("sdlms-active");
							clearInterval($(this).data("interval"));
							timer.stop();
							if ($that.is($that.data.onPause, "function")) {

								$that.call($that.data.onPause, $(this).data())


							}
						} else if (!$thisData.status || $thisData.status == "paused") {
							$track.addClass("sdlms-active");
							$(this).data("status", "running");

							if ($that.is($that.data.onResume, "function")) {
								$that.call($that.data.onResume, $(this).data())


							}
							$that.running.push(subtrack_id);
							$that.log("Event Play for" + duration + "Seconds");
							timer.start(seek * 1000);
							interval = setInterval(() => {
								seek = Math.round(timer.getTime() / 1000);
								shouldRun = (100 * seek) / ($thisData.time * 60) < 100;
								if (shouldRun || $that.data.threshold) {
									$seek.attr(
										"style",
										`background:red;width:${(100 * seek) / ($thisData.time * 60)
										}%;bottom:-1px`
									);
									$thisData.duration = (duration - seek) / 60;
									$timer
										.html(
											`${!shouldRun ? "+ " : "- "}` +
											$that.time(
												Math.abs(
													shouldRun ?
													($thisData.time - seek / 60) :
													(((seek / 60 - $thisData.time)) || 0)
												)
											)
										)
										.css({
											color: !shouldRun ? "red" : "",
										});
									$(this).data("duration", $thisData.duration);
									$(this).data("seek", seek / 60);
									$that.log("Seek Data" + JSON.stringify($(this).data()));
									shouldRun ||
										($that.data.threshold ?
											$(this).data("status", "exceeded").trigger("notify") :
											$(this)
											.data("status", "completed")
											.trigger("completed"));
								} else {
									clearInterval(interval);
									$(this).data("status", "completed").trigger("completed");
								}
							}, 100);
							$(this).data("interval", interval);
						} else if ($thisData.status == "completed") {
							$that.log("completed");
						}
					} else {
						$that.log("No track found to play");
					}
				}

				if ($that.is($that.data.onChange, "function")) {
					$that.call($that.data.onChange, $(this).data())

				}
			})
			.on("completed", function (Event) {

				let $track = $(this).parents(".sdlms-item").first();
				let $seek = $track.find("[track-seek]");
				$seek.attr("style", `background:red;width:100%;bottom:-1px`);
				$that.log("completed");
				$that.log($(this).data());
				$track.removeClass("sdlms-active");
				$(this)
					.removeClass("fa-play fa-pause")
					.addClass("fa-lock")
					.off("click completed")
					.on("click", function () {
						$that.log("Track is locked");
					});
				let subtrack_id = $(this).data("id");
				$(this).data("status", "completed")
				$that.running = $that.running.filter((k) => k != subtrack_id);
				if ($that.is($that.data.onComplete, "function")) {
					$that.call($that.data.onComplete, $(this).data())
				}
				if ($that.is($that.data.onChange, "function")) {
					$that.call($that.data.onChange, $(this).data())
				}
			})
			.on("notify", function (Event) {

				let $track = $(this).parents(".sdlms-item").first();
				let $seek = $track.find("[track-seek]");
				$seek.attr("style", `background:red;width:100%;bottom:-1px`);
				$that.log("It should Stop");
				$that.log($(this).data());
				// if ($that.is($that.data.onExceed, "function")) {
				//     $that.call($that.data.onExceed, $(this).data())
				// }
				// if ($that.is($that.data.onChange, "function")) {
				//     $that.call($that.data.onChange, $(this).data())

				// }
			})
			.on("lock", function (Event) {

				$that.log(`${$(this).data("id")} is marked as Locked`);
				$that.log($(this).data());
				$(this)
					.removeClass("fa-play fa-pause")
					.addClass("fa-lock")
					.off("click completed notify lock")
					.on("click", function () {
						$that.log("Track is locked");
					});
				clearInterval($(this).data("interval"));
				let subtrack_id = $(this).data("id");
				$that.running = $that.running.filter((k) => k != subtrack_id);
				if ($that.is($that.data.onLock, "function")) {
					$that.call($that.data.onLock, $(this).data())
				}
				// if ($that.is($that.data.onChange, "function")) {
				//     $that.call($that.data.onChange, $(this).data())

				// }
			});
		$renderer.find('[tracker-time]').data('duration', this.meta.duration);
		$renderer.find('[tracker-time]').data('seek', (this.meta.seek || 0));

		$renderer.find('[session-trigger]').off('click completed')
			.on('click', function () {
				let timer = new Timer();
				$that.log(this)
				let interval;
				let $timer = $renderer.find('[tracker-time]');
				let data = $timer.data();
				$(this).toggleClass("fa-play fa-pause");

				if (!$timer.data('status') || ($timer.data('status') == 'paused')) {
					data.seek = isNaN(data.seek) ? 0 : Number(data.seek);
					timer.start(data.seek * 60 * 1000);
					if (!isNaN(data.duration) && Number(data.duration)) {
						$timer.data('status', 'running');

						interval = setInterval(() => {
							let seek = Math.round(timer.getTime() / 1000);
							let shouldRun = (100 * seek) / (data.duration * 60) < 100;
							$timer
								.html(
									`${!shouldRun ? "+ " : "- "}` +
									$that.time(
										Math.abs(
											shouldRun ?
											(data.duration - seek / 60) :
											(((seek / 60 - data.duration)) || 0)
										)
									)
								)
								.css({
									color: !shouldRun ? "red" : "",
								});
							$timer.data('seek', seek / 60);
							$timer.data('interval', interval);
							$that.meta.seek = (seek / 60);
							$that.meta.status = 'running'
						}, 100);
						if ($that.is($that.data.onChange, "function")) {
							$that.call($that.data.onChange, $.extend({}, {
									type: "tracker"
								},
								$timer.data()
							))
						}
					}
				} else if ($timer.data('status') == 'running') {
					clearInterval(interval);
					$that.log($timer.data())
					$timer.data('status', 'paused');
					$that.meta.status = 'paused'
					$.each(($that.running || []), (i, e) => {
						$that._track().pause(e)
					});
					timer.stop();
					clearInterval($timer.data('interval'));
					if ($that.is($that.data.onChange, "function")) {
						$that.call($that.data.onChange, $.extend({}, {
								type: "tracker"
							},
							$timer.data()
						))
					}
				}

			}).on('completed', function () {
				console.log('done')
			});
		// console.log
		if ($that.meta.status == 'running') {
			$renderer.find('[session-trigger]').trigger('click')
		} else {
			let $timer = $renderer.find('[tracker-time]');
			let data = $timer.data();
			let timer = new Timer();
			data.seek = isNaN(data.seek) ? 0 : Number(data.seek);
			timer.start(data.seek * 60 * 1000);
			let seek = Math.round(timer.getTime() / 1000);
			let shouldRun = (100 * seek) / (data.duration * 60) < 100;
			$timer
				.html(
					`${!shouldRun ? "+ " : "- "}` +
					$that.time(
						Math.abs(
							shouldRun ?
							(data.duration - seek / 60) :
							(((seek / 60 - data.duration)) || 0)
						)
					)
				)
				.css({
					color: !shouldRun ? "red" : "",
				});

		}
		$container
			.find("[track-completed]")
			.off("click")
			.on("click", function (Event) {
				if (!$that.data.canControl) {
					$that.log('unauthorized event');
					if ($that.is($that.data.onUnauthorizedEvent, "function")) {
						$that.data.onUnauthorizedEvent($(this).data());
					}

					// return
				}

				if ($that.onBreak) {
					$that.log(
						"Currently Transition is Running Unable to start or Stop Track"
					);
					if ($that.is($that.data.ifOnBreak, "function")) {
						$that.data.ifOnBreak({
							trackID: $that.onBreak,
						});
					}
					return;
				}
				$that.log($that.running)
				if ($that.running.length) {
					$that.log("Currently Tasks is Running Unable to start or Stop Track");
					return;
				}
				let data = $(this).data();
				let $track = $(this).parents(".sdlms-item").first();
				$track.addClass("sdlms-active");
				$track.find("[track-status]").html("Completed");
				$track.find("[toggle-track]").trigger("lock").data("status", "completed");
				$track.find("[title-type='track']").data("status", "completed")
				$(this).remove();
				let $transition = $track.next(
					`[data-transition][data-track-id="${data.id}"]`
				);
				if ($that.is($that.data.onChange, "function")) {
					$that.call($that.data.onChange, $transition.data())

				}
				if ($transition.length && $transition.data("status") != "skipped") {
					let transitionTime = $transition.data("transition");
					$that.onBreak = data.id;
					let timer_ = new Timer();
					timer_.start(($transition.data('seek') * 60 * 1000) || 0);
					var t, m = 0;
					$transition.data('status', 'running')

					$transition.data(
						"interval",
						setInterval(() => {
							t = Math.round(timer_.getTime() / 1000);
							let p = ((t / 60) * 100) / transitionTime;
							if (p <= 100) {
								$transition.find('span')
									.text($that.time(t / 60))
									.end()
									.css({
										width: `${p}%`,
										background: "yellow",
									});
								$transition.data('seek', (t / 60))
							} else {
								$that.onBreak = 0;
								timer_.stop();
								clearInterval($transition.data("interval"));
								$transition.data('status', 'completed')
							}
							if (!m) {

							}
							m++
						}, 1000)

					);


				}

			});

		$container
			.find('[data-skip-transition]')
			.off('click')
			.on('click', function () {
				if (!$that.data.canControl) {
					$that.log('unauthorized event');
					if ($that.is($that.data.onUnauthorizedEvent, "function")) {
						$that.data.onUnauthorizedEvent($(this).data());
					}

				}

				$that.log($that.running)
				if ($that.running.length) {
					$that.log("Currently Tasks is Running Unable to start or Stop Track");
					return;
				}
				$that.onBreak = undefined;
				let $transition = $(this).parents(".sdlms-transition").first();
				$(this).replaceWith('<span style="font-size: 16px;padding-left: 10px;padding-top: 0.9px;">Skipped</span>');
				if ($transition.length) {
					clearInterval($transition.data("interval"));
					$transition.data('status', 'skipped')
					if ($that.is($that.data.onChange, "function")) {
						$that.call($that.data.onChange, $transition.data())
					}
					$that.log($that.clone())
				}
			})
		$container.find("[toggle-track]").each((i, e) => {


			let $track = $(e).parents(".sdlms-item").first();
			let $seek = $track.find("[track-seek]");
			let $timer = $track.find("[track-timer]");
			let data = $(e).data();
			let duration = data.time - Math.abs(data.seek);
			$seek.attr(
				"style",
				`background:red;width:${(100 * data.seek) / data.time}%;bottom:-1px`
			);

			if (data.status == 'running') {
				$(e).data('status', 'paused').trigger('click')
			}
			$timer
				.html(
					(duration > 0 ? "- " : "+ ") +
					$that.time(
						duration > 0 ?
						duration :
						Math.abs(Math.abs(data.seek) - data.time)
					)
				)
				.css({
					color: duration < 0 ? "red" : "",
				});
			duration > 0 || (!$that.data.threshold ? $(e).trigger("completed") : "");
		});
		$container.find("[data-transition]").each(function () {
			if ($(this).data('seek') || 0) {
				$(this).text($that.time($(this).data('seek') || 0)).css({
					width: `${(($(this).data('seek') * 100) / $(this).data('transition'))}%`,
					background: "yellow",
				});
			}
			if ($(this).data('status') == 'running') {
				$that.log($(this).prev('.sdlms-item'))
				$(this).prev('.sdlms-item').first().find('[track-completed]').trigger('click')
			} else if ($(this).data("status") == "skipped") {
				$(this).find("[data-skip-transition]").trigger("click")
			}
		});
		$container.find("[track-completed]").each(function () {
			if ($(this).data('status') == 'completed') {
				$(this).trigger("click")
			}
		})
		this.draggable();
		// EAGLE_BUILDER.resizable();
		this.collapsible();
		if ($that.is($that.data.onRender, "function")) {

			$that.call($that.data.onRender, $that)
		}
	}
	call(fun, data) {
		try {
			fun(data);
		} catch (error) {
			if (this.data.warn) {
				console.trace(error)
			}
		}
	}
	_track() {
		let $that = this;
		return {
			play: ($id) => {
				$that.$renderer.find('[toggle-track]').filter((i, e) => ($(e).data('status') == ('running') || $(e).data('status') == ('exceeded'))).each(function (i, e) {
					$(e).trigger('click');
				});
				$that.$renderer.find(`[toggle-track][data-id="${$id}"]`).trigger('click');
				if (!$that
					.$renderer
					.find(`[toggle-track][data-id="${$id}"]`)
					.parents('.sdlms-item:not(.sdlms-active)')
					.first()
					.find('.sdlms-label-wrap')
					.next('ul')
					.is(':visible')
				) {
					$that
						.$renderer
						.find(`[toggle-track][data-id="${$id}"]`)
						.parents('.sdlms-item:not(.sdlms-active)')
						.first()
						.find('.sdlms-label-wrap')
						.trigger('click');
				}

			},
			pause: ($id) => {
				$that.$renderer.find('[toggle-track]').filter((i, e) => ($(e).data('status') == ('running') || $(e).data('status') == ('exceeded'))).each(function (i, e) {
					$that.log($id)
					if ($(e).data('id') == $id) {
						$that.log($id)
						$(e).trigger('click');
					}
				})
			},
			transitions: ($id, status = "running") => {
				if (status == "running") {
					$that.$renderer.find(`[track-completed][data-id="${$id}"]`).trigger('click');
				} else {
					$(`[data-transition][data-track-id="${$id}"]`).find("[data-skip-transition]").trigger("click")
				}
			},
			complete: ($id) => {
				$that.$renderer.find(`[track-completed][data-id="${$id}"]`).trigger('click');
			}
		}
	}
	process(event) {
		let $that = this;
		$that.log("Event Recieved : Proccessing", event)
		if (event.transition) {
			$that._track().transitions(event.trackId, event.status)
		} else if (event.type == 'collapsible') {
			$that.$renderer.find(`.sdlms-label-wrap[data-id="${event.id}"]`).trigger('click');
		} else if (event.type == 'tracker') {
			let $tracker = $that.$renderer.find('[tracker-time]');
			$that.log($tracker, $tracker.data())
			if (event.status != $tracker.data('status')) {
				$that.$renderer.find('[session-trigger]').trigger('click');
			}
		} else if (!event.transition && event.type != "collapsible") {
			switch (event.status) {
			case 'running':
				$that._track().play(event.id)
				break;

			case 'paused':
				$that._track().pause(event.id)
				break;

			case 'complete':
				$that._track().complete(event.id)
			default:
				break;
			}
		}
	}
	time(minutes) {
		if (minutes) {
			var date = new Date(0);
			date.setSeconds(minutes * 60);
			let _k = date.toISOString().substr(11, 8).split(':');
			let _time = `${_k[1]}:${_k[2]}`;
			if (Number(_k[0]) > 0) {
				_time = _k.join(':')
			}
			return _time;
		}
		return '00:00'
	}
	builder(target = "body") {
		this.id = this.unique("sdlms-eagle-");
		let $that = this;
		let $target = $(target);
		if (!$target.length) {
			$that.log("No HTML element found For Builder Given ==>" + target);
			return;
		}
		$target.append(
			$("<sdlms-eagle-builder>")
			.attr({
				id: $that.id,
				class: $that.data.noAction ? "sdlms-readonly" : ''
			})
			.append(
				$("<form>").attr({
					id: "form-" + $that.id,

				})
			)
		);
		let $builder = $(`#form-${$that.id}`);
		$that.$builder = $builder;
		$that.create($that.data.with);
	}
	eagle() {
		let $that = this;
		let components = {
			header: (data = {}) => {
				return `<div class="sdlms-form-title" style="padding: 1rem;">
            <h2>Eagle Builder <i class="fas fa-globe-americas" style="display:none" data-id="${$that.data.assetId}" make-it-public></i></h2>
            <div class="sdlms-form-action">
              <button type="submit" class="sldms-button">Submit</button>
              <button type="button" data-preview class="sldms-button">Preview</button>
              <button type="button" data-thread="new" class="sldms-button">Add Thread</button>
              <button type="button" data-transition="new" class="sldms-button">Add  Transition</button>
            </div>
          </div>
          <div class="sdlms-form-header" style="padding: 0 1rem ;">
            <div class="" style="padding-top:8px">
              <input type="text" required name="session" value="${data.title || ''}" placeholder="Write the inroduction here..." class="sldms-form-input" />
              <input type="number" style="display:none" min="1"  value="${data.duration || ''}" name="sessionDuration" readonly class="sldms-form-input" placeholder="Min"/>
            </div>
          </div>`;
			},
			container: (thread = "") => {
				return ` <div class="sdlms-thread-container">${thread}</div>`;
			},
			thread: (subthread = "", data = {}) => {
				return ` <div class="sdlms-form-thread sdlms-thread-with-action sdlms-hidden" thread>
                     <div class="input-with-icon">
                            <input type="text" name="thread" value="${data.title || ''}" required placeholder="Thread" class="sldms-form-input" />
                            <div class="sdlms-thread-action" subthread-count>${(data.subtracks || []).length}</div>
                            <div class="sdlms-thread-action" remove-thread=""> <i class="fas fa-times"></i> </div>
                            <div class="sdlms-thread-action" collapse-subthread=""> <i class="fas fa-chevron-down"></i></div>
                    </div>
                    <div subthreadcontainer style="display:none">
                      ${subthread}
                      <div class="sdlms-form-add-more-thread">
                        <span add-subthread> Add more Subthread</span>
                      </div>
                      </div>
                  </div>
                  <hr>`;
			},
			subthread: (data = {}) => {
				return `<div class="input-with-time" subthread>
                      <input type="text" value="${data.title || ''}" name="subthread" required placeholder="Sub Thread" class="sldms-form-input" />
                      <input type="number"value="${data.duration || ''}" min="1"" placeholder="Min" name="duration" required class="sldms-form-input" />
                      <div class="sdlms-thread-action" remove-subthread> <i  class="fas fa-times"></i> </div>
                  </div>`;
			},
			transitions: (id = "", data = {}) => {
				return `  <div class="sdlms-form-thread sdlms-thread-with-action" data-id="${id}" transitions>
            <div class="input-with-time">
              <input type="text" required value="${data.title || ''}" name="transition" placeholder="Transition" value="Transition" class="sldms-form-input" />
              <input type="number" value="${data.duration || ''}" min="1"" required placeholder="Min" name="duration" class="sldms-form-input" />
              <div class="sdlms-thread-action" remove-subthread> <i  class="fas fa-times"></i> </div>
            </div>
          </div><hr>`
			},
			time: (time) => {
				// time = time.split(":");
				// return Number(time[0]) * 60 + Number(time[1]) || 10;
				return time;
			},
		}
		return components;
	};
	create(data = null) {

		let $target = this.$builder,
			eagle = this.eagle(),
			$that = this
		var eaglebuilder = {};
		

		if (data && data.tracks) {
			$target.append(eagle.header(data.meta));
			$target.append(eagle.container());
			let $container = $target.find('.sdlms-thread-container');
			$.each((data.tracks || []), function (i, track) {
				let subthread = '';
				$.each((track.subtracks || []), function (ind, e) {
					subthread += eagle.subthread(e)
				});
				$container.append(eagle.thread(subthread, track));
				if ((track.transitions || {}).duration) {
					$container.append(eagle.transitions(track.id, track.transitions))
				}
			});
			if ($that.data.noAction) {
				$target.find('.sdlms-form-action').remove();
				$target.find('input,select,textarea').prop('readonly', true);
				$target.find('input,select,textarea').prop('disabled', true);
			}


		} else {
			$target.append(eagle.header())
			$target.append(eagle.container(eagle.thread(eagle.subthread())));
		}
		if ($that.data.assetId) {
			$target.find('[make-it-public]').show();
		}
		$target.find('[make-it-public]').off('click').on('click', function () {

			let $id = $(this).data('id');
			if ($id) {
				$(this).addClass('making')
				require(['api'], function (api) {
					api.put(`/sdlms/${$that.tid}/public/${$id}`, {}).then(res => {
							console.log('done')
						}).catch(e => {})
						.finally(() => $(this).removeClass('making'));
				})
			}
		});
		if ($that.data.closable) {
			$target.append($('<i>').attr({
				class: 'fas fa-times-circle',
				assetClosable: true,
				parent: $that.data.assetId,
				style: 'position:absolute;top:0;right:0;font-size:2rem;transform: translate(50%,-50%);cursor:pointer'
			}));
		}

		$target.on('click', '[assetClosable]', function () {
			let actives = $('.comparison-container').children('[data-compare-id]');
			$('sdlms-member-list').find('.sub-menu > li').attr('shown', false)
			actives.each((i, e) => {
				$('sdlms-member-list')
					.find(`.sub-menu > li a[data-id="${$(e).attr('id')}"]`)
					.parents('li')
					.first()
					.attr('shown', true)
			});
			$(`#${$(this).attr('parent')}`).remove();
			$target.parents('sdlms-eagle-builder').first().remove();
		});

		var [$submit, $newThread, $container] = [
			$target.find('button[type="submit"]'),
			$target.find('button[data-thread="new"]'),
			$target.find(".sdlms-thread-container"),
		];

		function refreshCount() {
			$target.find('[thread]').each(function () {
				let subthreads = $(this).find('[subthread]').length;
				$(this).find('[subthread-count]').text(subthreads)
			})
		}
		$target.on("click", "[remove-thread]", function () {
			if ($that.data.noAction) {
				alert('Sorry! You can not modify.');
				return;
			}
			if (!($target.find('[thread]').length > 1)) {
				alert('Can not remove all threads');
				return;
			}
			$target.removeClass('sdlms-form-validated')
			$(this).parents(".sdlms-form-thread").next("hr").first().remove();
			$(this).parents(".sdlms-form-thread").first().remove();
			refreshCount()
		});
		$target.on("click", "[collapse-subthread]", function () {
			$(this).parents('[thread]').toggleClass('sdlms-hidden').find('[subthreadcontainer]').slideToggle()
		});
		$target.on('click', '[data-transition="new"]', function () {
			if ($that.data.noAction) {
				alert('Sorry! You can not modify.');
				return;
			}
			$target.removeClass('sdlms-form-validated')
			let last = $container.children(':not(hr)').last();
			if (last.attr('transitions') != undefined) {
				return alert('Transition is already added for the thread.')
			}
			$container.append(eagle.transitions(($target.find('[thread]').last().index() + 1), {}));
		})
		$target.on("click", "[add-subthread]", function () {
			if ($that.data.noAction) {
				alert('Sorry! You can not modify.');
				return;
			}
			$target.removeClass('sdlms-form-validated')
			$(this).parents(".sdlms-form-add-more-thread").before(eagle.subthread());
			refreshCount();
		});
		$target.on("click", "[remove-subthread]", function () {
			if ($that.data.noAction) {
				alert('Sorry! You can not modify.');
				return;
			}
			if (!($(this).parents('[thread]').first().find("[subthread]").length > 1)) {
				alert('Can not remove all Sub threads');
				return;
			}
			$target.removeClass('sdlms-form-validated')
			$(this).parents(".input-with-time").first().remove();
			refreshCount();
		});
		$target.on("click", '[data-preview]', function () {
			if ($that.data.noAction) {
				alert('Sorry! You can not modify.');
				return;
			}
			$target.addClass('sdlms-form-validated')
			$target.trigger('submit', {
				preview: true
			});
		});
		$newThread.off("click").on("click", function () {
			if ($that.data.noAction) {
				alert('Sorry! You can not modify.');
				return;
			}
			$target.removeClass('sdlms-form-validated')
			$container.append(eagle.thread(eagle.subthread()));
			refreshCount()
		});
		$target.on("submit", function (e, data = {}) {
			if ($that.data.noAction) {
				alert('Sorry! You can not modify.');
				return;
			}
			e.preventDefault();
			console.log($(this).find(':invalid'));
			if ($(this).find(':invalid').length) {
				return alert('Fields with Errors are not allowed');
			}
			let [title, duration, errors, totalTime] = [
				$target.find('[name="session"]').val(),
				$target.find('[name="sessionDuration"]').val(),
				[],
				0,
			];
			eaglebuilder.meta = {};
			eaglebuilder.meta.title = title || errors.push({
				type: "Title Error"
			});
			eaglebuilder.meta.duration = 0;

			eaglebuilder.tracks = [];
			$target.find("[thread]").each(function () {
				let thread = {};
				thread.subtracks = [];
				thread.id = $(this).index() + 1;
				thread.type = "track";
				thread.title = $(this).find('[name="thread"]').val();
				thread.transitions = {};
				$(this)
					.find("[subthread]")
					.each(function () {
						let subthread = {};
						subthread.id = `${thread.id}-${$(this).index() + 1}`;
						subthread.title = $(this).find('[name="subthread"]').val()
						subthread.duration = $(this).find('[name="duration"]').val()
						subthread.duration = eagle.time(subthread.duration);
						totalTime += Number(subthread.duration);
						thread.subtracks.push(subthread);
					});
				let $transition = $target.find(`[transitions][data-id="${thread.id}"]`);
				if ($transition.length) {
					thread.transitions.title = $transition.find('[name="transition"]').val();
					thread.transitions.duration = $transition.find('[name="duration"]').val();
					thread.transitions.duration = eagle.time(thread.transitions.duration)
					totalTime += thread.transitions.duration;
				}
				eaglebuilder.tracks.push(thread);
			});
			if (errors.length) {
				return alert('Fields with Errors are not allowed');
			}
			eaglebuilder.meta.duration = totalTime;
			console.log(eaglebuilder)
			if (data.preview) {
				$that.render(eaglebuilder, true);
				return false
			}
			let payload = {
				meta: eaglebuilder.meta,
				tracks: eaglebuilder.tracks,
			}
			/**
			 * @todo We have to make like we threadbuilder 
			 * Yes- i am aware we made it before threadbuilder
			 * so threadbuilder has clean code here
			 * but we will make this like that 
			 * */

			$that.exists($that.tid, "tracker").then((resp) => {
				/**
				 * @description This will check if there is an existing session tracker for the session, if not it will pass
				 * an extra parameter with the post request for making the current eaglebuiler as the session tracker
				 */
				if (!resp) {
					payload.sessionTracker = true;
				}
			})
			let reqType = $that.data.req
			require(['api'], function (api) {
				let request = api[reqType || "post"](reqType == "post" ? `/sdlms/${$that.tid}/eaglebuilder` : `/sdlms/${$that.tid}/eaglebuilder/${$that.data.id}`, payload);
				request.then(
					location.reload()
				)
			})
		});
		$submit.on("click", function () {
			if ($that.data.noAction) {
				alert('Sorry! You can not modify.');
				return;
			}
			$target.addClass("sdlms-form-validated");
			$target.find(':invalid').each(function () {
				if ($(this).parents('[subthreadcontainer]').length) {
					if (!$(this).parents('[subthreadcontainer]').is(':visible')) {
						$(this).parents('[thread]').find('[collapse-subthread]').trigger('click')
					}
				}
			})
			try {
				$target.find(":invalid").focus();
			} catch (error) {
				console.error('Element is hidden so can not focus')
			}


		});
		$target.find('[thread]').first().find('[collapse-subthread]').trigger('click');
		if ($that.data.addFeebacks) {
			new FeedBacks($.extend({}, $that.data, {
				target: `#${$that.id}`
			}));
		}
		refreshCount()
	}
	destroy() {
		$(this.$renderer).remove();
		$(this.$builder).remove();
		if (this.is(this.data.onDestroy, "function")) {
			this.call(this.data.onDestroy, "Destroyed")
		}
	}
	async exists   (tid = 0, asset = "eaglebuilder") {
		let exists = false;
		await api.get(`/sdlms/${tid}/${asset}`, {}).then((res) => {
			exists = !!(Object.keys(res).length);
		})
		return exists
	}
}