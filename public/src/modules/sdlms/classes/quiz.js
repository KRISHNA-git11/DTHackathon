class Quiz{
	constructor($target, config = {}){
		
		var $that = this;
		this.$active = {
			id: 0,
			$elem: {},
		};
		this.data = [];
		let stylesID = this.generateID();
		$($target).html($("<sdlms-quiz>").attr({ id: "sdlms-" + stylesID }));
		this.$component = $("#sdlms-" + stylesID);
		this.config = config;
		if(!config.tid){
			throw new Error('tid is required to init quiz');
		}
		console.log(this.$active);
		if(config.assetId){
			$that.$assetId = config.assetId;
		}
		if (config.data && config.extr) {
			$that.render($target, config.data,undefined,config.extr);
			
		} else if (config.data){
			$that.data = config.data;
			
			$that.create();
			$that.preview();
		}else{
			$that.create();
		}
		$that.$component.on("click", "#quiz-next", function () {
			if ($that.save() == "ok") {
				$that.preview();
			}
		});
		$that.$window = 0;
		$(window).on("blur", function () {
			$that.$window++;
		});
		$that.$component.on("click", '[data-quiz="remove"]', function () {
			let id = $(this).data("id");

			if (
				confirm(
					"This action cannot be reversed. Would you like to remove this Question?"
				)
			) {
				$that.data = $that.data.filter((e) => e.id != id);
				$that.preview();
			}
		});
		$that.$component.on("click", '[data-quiz="edit"]', function () {
			let id = $(this).data("id");
			let edit = $that.data.filter((e) => e.id == id);

			if (edit.length) {
				$that.create(edit[0]);
			}
			$that.data = $that.data.filter((e) => e.id != id);
		});
		$that.$component.on("click", "#quiz-save", function () {
			if ($that.save() == "ok") {
				$that.preview();

				if (!$that.data.length) {
					alert("Al least one question is required");
					return;
				}
				let s = $that.save(0);
				if (s) {
					require(['api'],function(api){
						if($that.$assetId){
							api.put(`/sdlms/${config.tid}/quiz/${$that.$assetId}`, { data: $that.data }).then((r) => {
								require(["sdlms/toolbar"], function (toolbar) {
									toolbar.builder();
								});
								alert(s.message)
								$that.$component.remove();
								$that.destroy();
							});
						}else{
							api.post(`/sdlms/${config.tid}/quiz`, { data: $that.data }).then((r) => {
								require(["sdlms/toolbar"], function (toolbar) {
									toolbar.builder();
								});
								alert(s.message)
								$that.$component.remove();
								$that.destroy();
							});
						}
					})
					
					
				}
			}
		});
		if (!config.data) {
		$that.$component.append(
			$("<div>").attr({ class: "sdlms-preview-container" })
		);
		}
		if ((config.extr || {}).closable) {
			$($target)
				
				.append(
					$("<i>").attr({
						class: "fas fa-times-circle",
						assetClosable: true,
						style:
							"position:absolute;top:0;right:0;font-size:2rem;cursor:pointer",
					})
				)
				
			$($target).on("click", "[assetClosable]", function () {
				$($target).remove();
				let actives = $(".comparison-container").children("[data-compare-id]");
				$("sdlms-member-list").find(".sub-menu > li").attr("shown", false);
				actives.each((i, e) => {
					$("sdlms-member-list")
						.find(`.sub-menu > li a[data-id="${$(e).attr("id")}"]`)
						.parents("li")
						.first()
						.attr("shown", true);
				});
				if (typeof (config.extr || {}).onClose == "function") {
					(config.extr || {}).onClose(config.extr || {});
				}
			});
		}
	}
	destroy(){
		this.$active = {
			id: 0,
			$elem: {},
		}
		this.data = []
	}
	generateID () {
		var stamp = new Date().getTime();
		var uuid = "xxxxxxxx_xxxx_xxxx_yxxx_xxxxxxxxxxxx".replace(
			/[xy]/g,
			function (c) {
				var r = (stamp + Math.random() * 16) % 16 | 0;
				stamp = Math.floor(stamp / 16);
				return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
			}
		);
		return uuid.replaceAll("_", "-");
	};
	numToSSColumn(num){
		var s = "",
			t;

		while (num > 0) {
			t = (num - 1) % 26;
			s = String.fromCharCode(65 + t) + s;
			num = ((num - t) / 26) | 0;
		}
		return s || undefined;
	};
	create  (data = {}) {
		var $that = this;
		var ID = $that.generateID();

		if (!$that.$component.find(".quiz-container").length) {
			$that.$component.append(
				$("<div>").attr({
					class: "quiz-container composing",
					style: "background:#2461b2",
					id: ID,
				})
			);
		} else {
			$that.$component.find(".quiz-container").attr("id", ID);
		}
		$that.$component.find(".quiz-container").empty();
		var $container = {
				$quiz: $(`#${ID}`),
			},
			$elem = {};
		$container.$quiz.html("");
		console.log($that)
		$that.$active.id = ID;
		$that.$active.$elem = $container.$quiz;
		function createOption($target, index, value = "") {
			$target.append(
				$("<div>")
					.attr({
						class: "quiz-option-input-container",
					})
					.append(
						$("<input>").attr({
							class: "quiz-option",
							type: "text",
							question: "question",
							id: "option-" + index + ID,
							placeholder: "Option " + $that.numToSSColumn(index + 1),
							value: value,
						})
					)
					.append(
						$("<div>")
							.attr({
								class: "remove-quiz-option",
								parentId: "option-" + index + ID,
							})
							.html("remove")
					)
			);
			$elem.$options = $container.$quiz.find(".quiz-option");
			$(`#answer-${ID}`).trigger("reset");
		}
		$container.$quiz.append($('<div>').attr({
			class:'sdlms-form-title'
		}));
		$container.$quiz.find('.sdlms-form-title').append(`<h2>Quiz Builder <i class="fas fa-globe-americas" style="display:none" data-id="${$that.$assetId}" make-it-public></i></h2>`)
		$container.$quiz.find('.sdlms-form-title').append(
			$("<div>").attr({
				class: "action-container",
				id: "action-container-" + ID,
			})
		);
		$container.$quiz.append(function () {
			let $question = $("<div>")
				.attr({
					class: "question-container",
					id: "question-container-" + ID,
				})
				.append(
					$("<textarea>")
						.attr({
							class: "quiz-question",
							id: "question-" + ID,
							placeholder: "Question",
							type: "text",
							rows: 5,
							value: data.question || "",
						})
						.html(data.question || "")
				);
			return $question;
		});

		if($that.$assetId){
			$container.$quiz.find('[make-it-public]').show();
		}
		$container.$quiz.find('[make-it-public]').off('click').on('click',function(){
            
            let $id = $(this).data('id');
            if($id){
                $(this).addClass('making')
				require(['api'],function(api){
					api.put(`/sdlms/${$that.config.tid}/public/${$id}`,{}).then(res => {
						console.log('done')
					}).catch(e=> {})
					.finally(()=>$(this).removeClass('making'));
				})
            }
        });
		$container.$quiz.on("click", ".remove-quiz-option", function () {
			if ($elem.$options.length < 4) {
				alert("At least three options are required.");
				return;
			}
			$(`#${$(this).attr("parentId")}`)
				.parent(".quiz-option-input-container")
				.remove();
			$elem.$options = $container.$quiz.find(".quiz-option");
			$elem.$options.each(function () {
				let i = $(this).parent(".quiz-option-input-container").index();
				$(this).attr("placeholder", `Option ${$that.numToSSColumn(i + 1)}`);
			});
			$(`#answer-${ID}`).trigger("reset");
		});

		$container.$quiz.append(function () {
			let $inputs = $("<div>").attr({
				class: "option-container",
				id: "option-container-" + ID,
			});
			for (
				let index = 0;
				index < (data.options && data.options.length ? data.options.length : 4);
				index++
			) {
				createOption(
					$inputs,
					index,
					data.options && data.options.length ? data.options[index] : ""
				);
			}
			return $inputs;
		});
		$elem.$question = $(`#question-container-${ID}`);

		$elem.$options = $container.$quiz.find(".quiz-option");

		$container.$quiz.append(
			$("<div>").attr({
				class: "answer-container",
				id: "answer-container-" + ID,
			})
		);
		$elem.$answer = $("#answer-container-" + ID);
		$elem.$answer.append(
			$("<select>")
				.attr({
					class: "quiz-answer",
					name: "answer",
					id: "answer-" + ID,
				})
				.html(function () {
					let ops = $elem.$options.map((i, e) => $(e).val()).get();
					let t = '<option value="">Select Answer</option>';
					$.each(ops, function (i, e) {
						t += `<option class="${i}">${e}</option>`;
					});
					return t;
				})
		);
		$container.$quiz.on("focus reset", `#answer-${ID}`, function () {
			$(this).html(function () {
				let ops = $elem.$options.map((i, e) => $(e).val()).get();
				// console.log(ops);
				let t = '<option value="">Select Answer</option>';
				$.each(ops, function (i, e) {
					t += `<option value="${i}">${e}</option>`;
				});
				return t;
			});
		});
		
		$container.$action = $("#action-container-" + ID);
		
		$container.$action.append(
			$("<button>")
				.attr({
					class: "sldms-button",
					id: `add-more-option-${ID}`,
				})
				.html("Add more options")
		);

		// $container.$action.append(
		// 	$("<button>")
		// 		.attr({
		// 			class: "sldms-button",
		// 			id: `remove-option-${ID}`,
		// 		})
		// 		.html("Remove  option")
		// );

		$container.$action.append(
			$("<button>")
				.attr({
					class: "sldms-button",
					id: `quiz-next`,
				})
				.html("Next")
		);

		$container.$action.append(
			$("<button>")
				.attr({
					class: "sldms-button",
					id: `quiz-save`,
				})
				.html("Finish")
		);

		$container = $.extend({}, $container, {
			$options: $(`#option-container-${ID}`),
		});
		$container.$quiz.find(".quiz-option");

		let $addOption = $(`#add-more-option-${ID}`),
			$removeOption = $(`#remove-option-${ID}`);

		$addOption.on("click", function () {
			createOption($container.$options, $elem.$options.length);
		});

		$removeOption.on("click", function () {
			if ($elem.$options.length < 4) {
				alert("At least three options are required.");
				return;
			}
			$elem.$options.eq($elem.$options.length - 1).remove();
			$elem.$options = $container.$quiz.find(".quiz-option");
			$(`#answer-${ID}`).trigger("reset");
		});
	};
	save(next = 1) {
		var $that = this;
		let $active = $that.$active.$elem;
		var question = $active.find(".quiz-question").val();
		var answer = $active.find(".quiz-answer").val();
		var options = $active
			.find(".quiz-option")
			.map((i, e) => $.trim($(e).val()))
			.get();
		var filtered = options.filter((e) => $.trim(e) != "");
		let diff = options.length - filtered.length;

		if (
			next ||
			!$that.data.length ||
			(!next && question && filtered.length < 3 && !diff)
		) {
			if (!$.trim(question)) {
				alert("Question is required.");
				$active.find(".quiz-question").css({
					borderColor: "red",
				});
				$active.find(".quiz-question").on("input", function () {
					$(this).css({
						borderColor: "#ccc",
					});
				});
				return;
			}
			if (!$.trim(answer)) {
				alert("answer is required.");
				$active.find(".quiz-answer").css({
					borderColor: "red",
				});
				$active.find(".quiz-answer").on("change", function () {
					$(this).css({
						borderColor: "#ccc",
					});
				});
				return;
			}

			if (filtered.length < 3) {
				alert("At least three options with text are required.");
				return;
			}
			if (diff) {
				if (!confirm(`${diff} option found empty. Would you like to remove?`)) {
					return;
				} else {
					$active
						.find(".quiz-option")
						.filter(function () {
							return !this.value;
						})
						.remove();
					return $that.save();
				}
			}
			$that.data.push({
				question: $.trim(String(question)),
				options: filtered,
				id: $that.$active.id,
				hash: $that.convert(answer),
			});
			$that.$active = {
				id: 0,
				$elem: {},
			};
			if (next) {
				$that.create();
			}
			app.log(JSON.stringify($that.data));
		}
		return next
			? "ok"
			: {
					message: `Total ${$that.data.length} quizes Created `,
					data: $that.data,
			  };
	};
	preview () {
		var $that = this;
		if (!$that.$component.find(".sdlms-preview-container").length) {
			$that.$component.append(
				$("<div>").attr({ class: "sdlms-preview-container" })
			);
		}

		let $preview = $that.$component.find(".sdlms-preview-container");

		$preview.html("");

		$preview.append(function () {
			let k = "";
			$.each($that.data, function (i, e) {
				var nameID = $that.generateID();
				var quiz = $("<div>").attr({
					quizTarget: e.id,
					style:'cursor:move',
					class:"sdlms-quiz-question-container"
				});
				quiz.append(
					$("<div>").html(
						`<div class="quiz-question" question style="padding-right:100px"><b data-index>${$that.numToSSColumn(
							i + 1
						)}. </b> ${e.question} 
						<i style="right:45px;top:2px" option-collapse class="fas fa-chevron-down"></i>
						<span data-quiz="edit" data-id="${e.id}"><i class="fas fa-edit"></i></span>
						<span data-id="${
							e.id
						}" data-quiz="remove"><i class="fas fa-trash-alt"></i></span>
						
					</div>`
					)
				);
				quiz.append(function () {
					let options = "";
					$.each(e.options, function (oi, oe) {
						var ID = $that.generateID();
						options += `  <p class="sdlms-quiz-preview-option">
                        <input type="radio" id="option-${ID}" readonly disabled ${
							$that.reverse(e.hash) == oi ? "checked" : ""
						} value="${oe}" name="quiz-${nameID}">
                        <label for="option-${ID}">${oe}</label>
                      </p>`;
					});
					return `<div class="sdlms-quiz-options-container">${options}</div>`;
				});
				k += quiz[0].outerHTML;
			});
			return k;
		});
		$preview.find('[option-collapse]').off('click').on('click',function(){
			$(this).parents('.sdlms-quiz-question-container').toggleClass('sdlms-shown')
				   .find('.sdlms-quiz-options-container').slideToggle()
		})
		require(['Sortable'],function(Sortable){
			Sortable.create( $preview[0],{
				animation: 150,
				onEnd:function(){
					let reindex = [];
					$preview.find('[quizTarget]').each(function(){
						$(this).find('[data-index]').text($that.numToSSColumn($(this).index() + 1)+ '. ');
						let i = $that.data.findIndex(e => e.id == $(this).attr('quizTarget'));
						reindex.push($that.data[i]);
					});
					$that.data = reindex;	
				}
			});
		})
	};
	reverse  (key)  {
		return atob(decodeURIComponent(key)).split("-").pop();
	};
	convert (key) {
		let $that = this;
		return encodeURIComponent(
			btoa(
				$that.generateID().split(Math.floor(Math.random() * 20)) +
					"-" +
					$.trim(String(key))
			)
		);
	};
	render (
		$target,
		data = {},
		onEnd = (reply) => {
			console.log(reply);
		},
		config
	) {
		var $that = this;
		$target = $($target);
		if (!$target.find(".sdlms-preview-container").length) {
			$target
				.find("sdlms-quiz")
				.html(
					$("<div>").attr({
						class: "sdlms-preview-container",
						style: "display:flex;flex-wrap:wrap;width:100%",
						id: "sdlm-" + $that.generateID(),
					})
				);
		}
		$target.find("sdlms-quiz").css('display','block')
		let $preview = $target.find(".sdlms-preview-container");
		$preview.empty();
		$preview.append($('<div>').attr({
			class:'sdlms-form-title',
			style:'padding:1rem 0'
		}));
		$preview.find('.sdlms-form-title').append(' <h2>Quiz</h2>')
		
		let started_at = new Date().getTime();
		
		$preview.append(function () {
			let k = "";
			$.each(data, function (i, e) {
				var nameID = $that.generateID();
				var quiz = $("<div>").attr({
					quizTarget: e.id,
					style: "width:100%",
					class:"sdlms-quiz-question-container"
				});
				quiz.append(
					$("<div>").html(
						`<div class="quiz-question" question><b style="margin-right:10px">${$that.numToSSColumn(
							i + 1
						)}.</b> ${e.question}<i option-collapse class="fas fa-chevron-down"></i></div>`
					)
				);
				k += quiz.append(function () {
					let options = "";
					$.each(e.options, function (oi, oe) {
						var ID = $that.generateID();
						options += `  <p class="sdlms-quiz-render-option">
                        <input type="radio" id="option-${ID}" value="${oi}" name="quiz-${e.id}">
                        <label for="option-${ID}">${oe}</label>
                      </p>`;
					});
					return `<div class="sdlms-quiz-options-container">${options}</div>`;
				})[0].outerHTML;
			});
			return k;
		});
		$preview.find('[option-collapse]').off('click').on('click',function(){
			$(this).parents('.sdlms-quiz-question-container').toggleClass('sdlms-shown')
				   .find('.sdlms-quiz-options-container').slideToggle()
		})
		// $preview.append(`
        //         <div class="quiz-stepper" style='width:100%'>
        //             <button name="prev">Prev</button>
        //             <button name="next">Next</button>
        //         </div>`);
		$preview.append(
			$("<button>")
				.attr({
					class: "sldms-button",
					id: `quiz-submit`,
					style:'margin-left:auto'
				})
				.html("Submit")
		);
		var quizes = $preview.find("[quizTarget]");
		var now = 0;
		quizes.first().find('[option-collapse]').trigger('click');
		$preview.find('#quiz-submit').off('click').on('click',function(){
			end();
		})
		function end() {
			let ans = [];
			let error = 0;
			let result = [];
			let attempt = 0;
			$preview.find("[quizTarget]").each(function (i, e) {
				$(`[name="quiz-${$(e).attr('quizTarget')}"]:checked`).val()
					? (attempt++, $(`[name="quiz-${$(e).attr('quizTarget')}"]:checked`).val())
					: error++;
				ans.push({
					id: $(this).attr("quizTarget"),
					hash: $(`[name="quiz-${$(e).attr('quizTarget')}"]:checked`).val()
						? $that.convert($(`[name="quiz-${$(e).attr('quizTarget')}"]:checked`).val())
						: null,
				});
				let p = data.find((e) => e.id == $(this).attr("quizTarget"));
				if (
					$that.reverse(p.hash) == $(`[name="quiz-${$(e).attr('quizTarget')}"]:checked`).val()
				) {
					result.push($(this).attr("quizTarget"));
				}
			});
			let ended = new Date().getTime();
			let obj = {
				started: started_at,
				ended: ended,
				timeTaken: ended - started_at,
				score: `${((result.length * 100) / data.length).toFixed(2)}%`,
				raw: `${((result.length * 100) / data.length).toFixed(2)}`,
				questions: data.length,
				attempt: attempt,
				skip: data.length - attempt,
				result: result,
				keys: ans,
				questions: data,
				component: $preview,
				tabChanged: $that.$window,
			};
			return onEnd(obj);
		}
		if(config.addFeebacks){
			new FeedBacks($.extend({},config,{
				target:`#${$that.$component[0].id}`
			}));
        }
		$preview.find("button[name=next]").click(function () {
			quizes.eq(now).hide();
			now = now + 1 < quizes.length ? now + 1 : end() || quizes.length - 1;
			quizes.eq(now).show();
			
		});
		$preview.find("button[name=prev]").click(function () {
			quizes.eq(now).hide();
			now = now > 0 ? now - 1 : now;
			quizes.eq(now).show();
		});
	};
	get()  {
		return { data: this.data };
	};
}