/**
 * @author Deepansu
 * @date 12/2021
 * @description Allow user to build the threads based on @tid and @uid with update and private,public mode
 * @name Session as @name Topic
 * @returns @threadbuilder 
 */

/**
 * @var {class} threadbuilder
 * @description Contains the @methods or @function - to run the threadbuilder
 * @function threadbuilder.init
 * @function threadbuilder.unique
 * @function threadbuilder.log
 * @function threadbuilder.builder
 * @function threadbuilder.thread
 * @function threadbuilder.create
 */

class threadBuilder {
	constructor(data = {}) {
		/**
		 * @author Deepansu
		 * @description Tid is required to init a thread builder
		 */

		if (!data.tid) {
			throw new Error("Invalid tid supplied");
		}
		this.tid = data.tid;
		this.data = data;
		this.assetId = data.assetId;

		var b = document.documentElement;
		b.setAttribute("data-useragent", navigator.userAgent);
		b.setAttribute("data-platform", navigator.platform);
		this.data.queue = 0;
		this.builder(this.data.target);
	}
	/**
	 * @author Deepansu
	 * @date 12/2021
	 * @name unique
	 * @type {function} 
	 * @description to get unique id 
	 * @param {String} prefix optional identifier for generated unique id {prefix + id}
	 */

	unique(prefix = "") {
		var dt = new Date().getTime();
		var uuid = "xxxxxxxx-xxxx-yxxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
			var r = (dt + Math.random() * 16) % 16 | 0;
			dt = Math.floor(dt / 16);
			return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
		});
		return prefix + uuid;
	}
	/**
	 * @author Deepansu
	 * @date 12/2021
	 * @name log
	 * @type {function} 
	 * @description To Log 
	 * @param {*} log 
	 */

	log(log) {
		!this.data.log || console.log(log);
	}
	/**
	 * @author Deepansu
	 * @date 12/2021
	 * @name builder
	 * @type {function} 
	 * @description Attach an  sdlms-thread-builder element
	 * @param {HTML ELEMENT} HTML element to render builder default body 
	 */

	builder(target = "body") {

		this.id = this.unique("sdlms-thread-");
		let $that = this;
		let $target = $(target);
		if (!$target.length) {

			/**
			 * @author Deepansu
			 * @description Given target should be a valid HTML Element
			 */
			$that.log("No HTML element found For Builder Given ==>" + target);
			throw new Error(`No HTML element found while searching ${target}`);
		}
		$target.append(
			$("<sdlms-thread-builder>")
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
	/**
	 * @author Deepansu
	 * @date 12/2021
	 * @name thread
	 * @type {function} 
	 * @description Returns Components of @threadbuilder
	 * @param {void()}
	 */

	thread() {
		let $that = this;
		let components = {
			header: () => {
				return `
                <div class="sdlms-form-title" style="padding: 1rem;">
                    <h2>Thread Builder <i class="fas fa-globe-americas" style="display:none" data-id="${$that.data.assetId}" make-it-public></i></h2>
                    <div class="sdlms-form-action">
                        <button type="submit" class="sldms-button">Submit</button>
                        <button type="button" data-thread="new" class="sldms-button">Add Thread</button>
                    </div>
                </div>`;
			},
			container: (thread = "") => {
				return ` <div class="sdlms-thread-container">${thread}</div>`;
			},
			thread: (subthread = "", data = {}) => {
				return ` 
                <div class="sdlms-form-thread sdlms-thread-with-action sdlms-hidden" thread="">
                <div class="input-with-icon">
                        <input required type="text" name="thread" value="${data.title || 'Thread ' + ($('[thread]').length + 1)}"  required class="sldms-form-input">
                        <div class="sdlms-thread-action" subthread-count>${(data.subthreads || []).length}</div>
                        <div class="sdlms-thread-action" remove-thread=""> <i class="fas fa-times"></i> </div>
                        <div class="sdlms-thread-action" collapse-subthread=""> <i class="fas fa-chevron-down"></i></div>
                 </div>
               <div subthreadcontainerwithClosure style="display:none">
               <div subthreadcontainer > ${subthread}</div>
               <div class="sdlms-closure">
                  <textarea required placeholder="Write the Summary of this Thread here..." summary class="sldms-form-input" rows="1">${data.summary || ''}</textarea>
                  <textarea required placeholder="Enter the speaker's emotion...."  emotions class="sldms-form-input" rows="1">${data.emotions || ''}</textarea>
               </div>
               </div>
            </div>
            <hr />`;
			},
			subthread: (data = {}) => {
				return `
                <div class="sdlms-form-subthread" subthread>
                    <textarea required placeholder="Enter Sub-thread 1 content here...." content class="sldms-form-input" rows="1">${data.content || ''}</textarea>
                    <textarea required placeholder="Write your Interpretation here...."  interpretation class="sldms-form-input" rows="1">${data.interpretation || ''}</textarea>
                     <div class="sdlms-thread-group">
                        <div class="sdlms-checkbox-group sdlms-w-50">
                            <div class="sdlms-checkbox"> <label><input type="checkbox" ${!!!Number(data.rt) || 'checked'} name="rt"> R T </label> </div>
                            <div class="sdlms-checkbox"> <label><input type="checkbox" ${!!!Number(data.q) || 'checked'} name="q"> Q </label> </div>
                            <div class="sdlms-checkbox"> <label><input type="checkbox" ${!!!Number(data.a) || 'checked'} name="a"> A </label> </div>
                            <div class="sdlms-checkbox"> <label><input type="checkbox" ${!!!Number(data.em) || 'checked'} name="em"> E M </label> </div>
                        </div>
                        <div class="sdlms-w-50" style="display:flex"> 
                            <select required class="sldms-form-input"  category value="${data.category || ''}"> <option value="">  Category </option> <option value="test"> test </option> </select>
                            <select required class="sldms-form-input"  process value="${data.process || ''}"> <option value="">  Process </option> <option value="test"> test </option> </select>
                        </div>
                     </div>
                    <div class="sdlms-form-add-more-thread"> <span remove-subthread="">Remove this Subthread</span> <span add-subthread=""> Add more Subthread</span> </div>
                </div>`;
			}
		}
		return components;
	};
	/**
	 * @author Deepansu
	 * @date 12/2021
	 * @name create
	 * @type {function} 
	 * @description Append @threabuilder to sdlms-thread-builder and attach all the events 
	 * @param {Object} data optional if @threadbuilder is initied with existing @threadbuilder then render it with Exisiting
	 */
	create(data = null) {

		let $target = this.$builder,
			components = this.thread(),
			$that = this,
			threadBuilder = {};
		if (data) {
			$target.append(components.header(data.meta));
			$target.append(components.container());
			let $container = $target.find('.sdlms-thread-container');
			$.each((data.threads || []), function (i, thread) {
				let subthread = '';
				$.each((thread.subthreads || []), function (ind, e) {
					subthread += components.subthread(e)
				});
				$container.append(components.thread(subthread, thread));
			})
			if ($that.data.noAction) {
				$target.find('.sdlms-form-action').remove();
				$target.find('input,select,textarea').prop('readonly', true);
				$target.find('input,select,textarea').prop('disabled', true);
			}
		} else {
			$target.append(components.header())
			$target.append(components.container(components.thread(components.subthread())));
		}
		if ($that.data.assetId) {
			$target.find('[make-it-public]').show();
		}
		$target.find('[make-it-public]').off('click').on('click', function () {
			let $id = $(this).data('id');
			if ($id) {
				$(this).addClass('making');

				/**
				 * @author Deepansu
				 * @description Make a request to make the current @threadbuilder as public
				 */
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

		/**
		 * @author Deepansu
		 * @description Update the Count of subthreads for Each threads
		 */

		function refreshCount() {
			$target.find('[thread]').each(function () {
				let subthreads = $(this).find('[subthread]').length;
				$(this).find('[subthread-count]').text(subthreads)
			})
		}
		/**
		 * @author Deepansu
		 * @description Update the list of active assets and remove the  element 
		 */
		$target.on('click', '[assetClosable]', function () {
			$(`#${$(this).attr('parent')}`).remove();
			let actives = $('.comparison-container').children('[data-compare-id]');
			$('sdlms-member-list').find('.sub-menu > li').attr('shown', false)
			actives.each((i, e) => {
				$('sdlms-member-list')
					.find(`.sub-menu > li a[data-id="${$(e).attr('id')}"]`)
					.parents('li')
					.first()
					.attr('shown', true)
			});
		});
		var [$submit, $newThread, $container] = [
			$target.find('button[type="submit"]'),
			$target.find('button[data-thread="new"]'),
			$target.find(".sdlms-thread-container"),
		];

		/**
		 * @author Deepansu
		 * @description Remove the thread and their children [subthread]
		 */
		$target.on("click", "[remove-thread]", function () {
			if ($that.data.noAction) {
				alert('Sorry! You can not modify.');
				return;
			}
			$target.removeClass('sdlms-form-validated');
			if ($target.find('[thread]').length > 1) {
				$(this).parents(".sdlms-form-thread").next("hr").first().remove();
				$(this).parents(".sdlms-form-thread").first().remove();
				refreshCount()
			} else {
				alert('Can not remove all Threads')
			}

		});
		/**
		 * @author Deepansu
		 * @description Just collapsing
		 */
		$target.on("click", "[collapse-subthread]", function () {
			$(this).parents('[thread]').toggleClass('sdlms-hidden').find('[subthreadcontainerwithClosure]').slideToggle()
		});

		/**
		 * @author Deepansu
		 * @description Add subthread to a thread
		 */
		$target.on("click", "[add-subthread]", function () {
			if ($that.data.noAction) {
				alert('Sorry! You can not modify.');
				return;
			}
			$target.removeClass('sdlms-form-validated')
			$(this).parents(".sdlms-form-subthread").after(components.subthread());
			refreshCount()
		});
		/**
		 * @author Deepansu
		 * @description Remove subthread to a thread
		 */
		$target.on("click", "[remove-subthread]", function () {
			if ($that.data.noAction) {
				alert('Sorry! You can not modify.');
				return;
			}
			if ($(this).parents("[subthreadcontainer]").find('[subthread]').length > 1) {
				$target.removeClass('sdlms-form-validated');
				$(this).parents("[subthread]").first().remove();
				refreshCount()
			} else {
				alert('Can not remove all subthreads')
			}

		});
		$target.find('select').each(function () {
			$(this).val($(this).attr('value'))
		});
		/**
		 * @author Deepansu
		 * @description Add new thread to @threadbuilder
		 */
		$newThread.off("click").on("click", function () {
			if ($that.data.noAction) {
				alert('Sorry! You can not modify.');
				return;
			}
			$target.removeClass('sdlms-form-validated')
			$container.append(components.thread(components.subthread()));
			refreshCount()
		});
		/**
		 * @author Deepansu
		 * @description Save @threadbuilder
		 */
		$target.on("submit", function (e, data = {}) {
			if ($that.data.noAction) {
				alert('Sorry! You can not modify.');
				return;
			}
			e.preventDefault();
			if ($(this).find(':invalid').length) {
				return alert('Fields with Errors are not allowed');
			}

			let [title, duration, errors, totalTime] = [
				$target.find('[name="session"]').val(),
				$target.find('[name="sessionDuration"]').val(),
				[],
				0,
			];
			/**
			 * @author Deepansu
			 * @date 30-12-2021
			 * @description Making meta empty bcz we will read it when session tracker changes it's state
			 */
			threadBuilder.meta = {

			};

			threadBuilder.threads = [];
			$target.find("[thread]").each(function () {
				let _thread = {};
				_thread.subthreads = [];
				_thread.id = $(this).index() + 1;
				_thread.title = $(this).find('[name="thread"]').val();
				_thread.emotions = $(this).find('[emotions]').val();
				_thread.summary = $(this).find('[summary]').val();
				$(this)
					.find("[subthread]")
					.each(function () {
						let subthread = {};
						subthread.id = `${_thread.id}-${$(this).index() + 1}`;
						subthread.content = $(this).find('[content]').val();
						subthread.interpretation = $(this).find('[interpretation]').val();
						subthread.category = $(this).find('[category]').val();
						subthread.process = $(this).find('[process]').val();
						subthread.rt = $(this).find('[name="rt"]').is(':checked') ? 1 : 0;
						subthread.q = $(this).find('[name="q"]').is(':checked') ? 1 : 0;
						subthread.a = $(this).find('[name="a"]').is(':checked') ? 1 : 0;
						subthread.em = $(this).find('[name="em"]').is(':checked') ? 1 : 0;
						_thread.subthreads.push(subthread);
					});

				threadBuilder.threads.push(_thread);
			});
			$that.log(threadBuilder)

			// api.get("sdlms/tid/threadbuilder/id")
			/**
			 * @author Deepansu
			 * @description Make a request to make the current @threadbuilder as public
			 */
			if (!$that.data.queue) {
				$that.data.queue = 1;
				require(['api'], function (api) {
					if ($that.data.assetId) {
						// PUT
						api.put(`/sdlms/${$that.data.tid}/threadbuilder/${$that.data.assetId}`, {
								data: threadBuilder
							})
							.then((res) => {
								console.log(res)
							})
							.finally(() => {
								$that.data.queue = 0;
							})
						// .finally $that.data.queue = 0
					} else {
						// Post
						api.post(`/sdlms/${$that.data.tid}/threadbuilder`, {
								data: threadBuilder
							})
							.then((res) => {
								console.log(res)
								$that.data.assetId = res._id;
								$target.find('[make-it-public]').data('id', res._id).show();
								require(['sdlms/toolbar'], function (toolbar) {
									toolbar.builder()
								})
							})
							.finally(() => {
								$that.data.queue = 0;
							})
					}
				})
			} else {
				// Plese Wait We are .... 
				console.log("Please wait")
			}



		});
		refreshCount()
		$target.find('[thread]').first().find('[collapse-subthread]').trigger('click')
		$submit.on("click", function () {
			if ($that.data.noAction) {
				alert('Sorry! You can not modify.');
				return;
			}
			$target.addClass("sdlms-form-validated");
			$target.find(':invalid').each(function () {
				if ($(this).parents('[subthreadcontainerwithclosure]').length) {
					if (!$(this).parents('[subthreadcontainerwithclosure]').is(':visible')) {
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
		if ($that.data.addFeebacks) {
			new FeedBacks($.extend({}, $that.data, {
				target: `#${$that.id}`
			}));
		}

	}

}