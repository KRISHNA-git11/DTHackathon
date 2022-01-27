'use strict';

/* globals define */

define('composer/sdlms/quiz', ['sdlms'] , function (sdlms) {

	var $quizes = {
		$active: {
			id: 0,
			$elem: {}
		},
		data: []
	}
	var $window = 0;
	$(window).on('action:composer.discard', function (evt, data) {
		$quizes.$active = {};
	});
	$quizes.generateID = () => {
		var stamp = new Date().getTime();
		var uuid = 'xxxxxxxx_xxxx_xxxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = (stamp + Math.random() * 16) % 16 | 0;
			stamp = Math.floor(stamp / 16);
			return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
		return uuid.replaceAll('_', '-');
	}
	$quizes.init = function ($target, config = {}) {
		app.log(sdlms);
		let stylesID = $quizes.generateID();
		$($target).html($('<div>').attr({ component: 'sdlms-quiz', id: 'sdlms-' + stylesID }));
		$quizes.$component = $('[component="sdlms-quiz"]');
		$quizes.getStyles($quizes.$component, $quizes.$component.attr('id'));

		$quizes.create();
		$quizes.$component.on('click', '#quiz-next', function () {
			if ($quizes.save() == 'ok') {
				$quizes.preview()
			}
		});
		$quizes.$component.on('click', '[data-quiz="remove"]', function () {
			let id = $(this).data('id')

			if (confirm('This action cannot be reversed. Would you like to remove this Question?')) {
				$quizes.data = $quizes.data.filter(e => e.id != id);
				updatePrivew();
			}

		});
		$quizes.$component.on('click', '[data-quiz="edit"]', function () {
			let id = $(this).data('id')
			let edit = $quizes.data.filter(e => e.id == id);

			if (edit.length) {
				$quizes.create(edit[0])
			}
			$quizes.data = $quizes.data.filter(e => e.id != id);
		});
		$quizes.$component.on('click', '#quiz-save', function () {

			if (!$quizes.data.length) {
				alert('Al least one question is required');
				return
			}
			let s = $quizes.save(0);
			if (s) {
				$quizes.$component.html(s.message)
			}
		});
		$quizes.$component.append($('<div>').attr({ class: 'sdlms-preview-container' }));
	};
	$quizes.numToSSColumn = (num) => {
		var s = '', t;

		while (num > 0) {
			t = (num - 1) % 26;
			s = String.fromCharCode(65 + t) + s;
			num = (num - t) / 26 | 0;
		}
		return s || undefined;
	}
	$(window).on('blur', function () {
		$window++;
	});
	$quizes.create = (data = {}) => {
		var ID = $quizes.generateID();

		
		if (!$quizes.$component.find('.quiz-container').length) {
			$quizes.$component.append($('<div>').attr({ class: 'quiz-container composing',style:'background:#2461b2', id: ID }))
		} else {
			$quizes.$component.find('.quiz-container').attr('id', ID)
		}
		$quizes.$component.find('.quiz-container').empty();
		var $container = {
			$quiz: $(`#${ID}`)
		}, $elem = {};
		$container.$quiz.html('')
		$quizes.$active.id = ID;
		$quizes.$active.$elem = $container.$quiz;
		function createOption($target, index, value = '') {

			$target.append($('<div>').attr({
				class: 'quiz-option-input-container'
			}).append(
				$('<input>').attr({
					class: 'quiz-option',
					type: 'text',
					question: 'question',
					id: 'option-' + index + ID,
					placeholder: 'Option ' + $quizes.numToSSColumn(index + 1),
					value: value
				})
			).append(
				$('<div>').attr({
					class: 'remove-quiz-option',
					parentId: 'option-' + index + ID,
				}).html('remove')
			));
			$elem.$options = $container.$quiz.find('.quiz-option');
			$(`#answer-${ID}`).trigger('reset')
		}
		$container.$quiz.append(function () {
			let $question = $('<div>').attr({
				class: 'question-container',
				id: 'question-container-' + ID
			}).append(
				$('<textarea>').attr({
					class: 'quiz-question',
					id: 'question-' + ID,
					placeholder: 'Question',
					type: 'text',
					rows: 5,
					value: (data.question || '')
				}).html(data.question || '')
			);
			return $question;
		});

		$container.$quiz.on('click', '.remove-quiz-option', function () {
			if ($elem.$options.length < 4) {
				alert('At least three options are required.');
				return;
			}
			$(`#${$(this).attr('parentId')}`).parent('.quiz-option-input-container').remove();
			$elem.$options = $container.$quiz.find('.quiz-option');
			$elem.$options.each(function () {
				let i = $(this).parent('.quiz-option-input-container').index();
				$(this).attr('placeholder', `Option ${$quizes.numToSSColumn((i + 1))}`)
			});
			$(`#answer-${ID}`).trigger('reset')
		})

		$container.$quiz.append(function () {
			let $inputs = $('<div>').attr({
				class: 'option-container',
				id: 'option-container-' + ID
			});
			for (let index = 0; index < (data.options && data.options.length ? data.options.length : 4); index++) {
				createOption($inputs, index, (data.options && data.options.length ? data.options[index] : ''))
			}
			return $inputs;
		});
		$elem.$question = $(`#question-container-${ID}`);

		$elem.$options = $container.$quiz.find('.quiz-option');
		$container.$quiz.append($('<div>').attr({
			class: 'answer-container',
			id: 'answer-container-' + ID
		}));
		$elem.$answer = $('#answer-container-' + ID);
		$elem.$answer.append($('<select>').attr({
			class: 'quiz-answer',
			name: 'answer',
			id: 'answer-' + ID
		}).html(function () {
			let ops = $elem.$options.map((i, e) => $(e).val()).get();
			let t = '<option value="">Select Answer</option>';
			$.each(ops, function (i, e) {
				t += `<option class="${i}">${e}</option>`
			})
			return t;
		})
		)
		$container.$quiz.on('focus reset', `#answer-${ID}`, function () {
			$(this).html(function () {
				let ops = $elem.$options.map((i, e) => $(e).val()).get();
				// console.log(ops);
				let t = '<option value="">Select Answer</option>';
				$.each(ops, function (i, e) {

					t += `<option value="${i}">${e}</option>`
				})
				return t;
			})
		})
		$container.$quiz.append($('<div>').attr({
			class: 'action-container',
			id: 'action-container-' + ID
		}));
		$container.$action = $('#action-container-' + ID);
		$container.$action.append($('<button>').attr({
			class: '',
			id: `add-more-option-${ID}`
		}).html('Add more options'));

		$container.$action.append($('<button>').attr({
			class: '',
			id: `remove-option-${ID}`
		}).html('Remove  option'));

		$container.$action.append($('<button>').attr({
			class: '',
			id: `quiz-next`
		}).html('Next'));

		$container.$action.append($('<button>').attr({
			class: '',
			id: `quiz-save`
		}).html('Save'));

		$container = $.extend({}, $container, {
			$options: $(`#option-container-${ID}`)
		});
		$container.$quiz.find('.quiz-option')

		let $addOption = $(`#add-more-option-${ID}`),
			$removeOption = $(`#remove-option-${ID}`);

		$addOption.on('click', function () {
			createOption($container.$options, ($elem.$options.length));
		});

		$removeOption.on('click', function () {
			if ($elem.$options.length < 4) {
				alert('At least three options are required.');
				return;
			}
			$elem.$options.eq($elem.$options.length - 1).remove();
			$elem.$options = $container.$quiz.find('.quiz-option');
			$(`#answer-${ID}`).trigger('reset')
		});

	}
	$quizes.save = (next = 1) => {
		let $active = $quizes.$active.$elem;
		var question = $active.find('.quiz-question').val();
		var answer = $active.find('.quiz-answer').val();
		var options = $active.find('.quiz-option').map((i, e) => $.trim($(e).val())).get();
		var filtered = options.filter(e => $.trim(e) != '')
		let diff = options.length - filtered.length;

		if ((next || !$quizes.data.length) || (!next && question && filtered.length < 3 && !diff)) {
			if (!$.trim(question)) {
				alert('Question is required.');
				return;
			}
			if (!$.trim(answer)) {
				alert('answer is required.');
				return;
			}

		
			if (filtered.length < 3) {
				alert('At least three options with text are required.');
				return;
			}
			if (diff) {
				if (!confirm(`${diff} option found empty. Would you like to remove?`)) {
					return;
				} else {
					$active.find('.quiz-option').filter(function () { return !this.value; }).remove();
					return $quizes.save();
				}
			} 
			$quizes.data.push({
				question: $.trim(String(question)),
				options: filtered,
				id: $quizes.$active.id,
				hash: $quizes.convert(answer)
			});
			$quizes.$active = {
				id: 0,
				$elem: {}
			}
			if (next) {
				$quizes.create()
			}
			app.log(JSON.stringify($quizes.data))
		}
		return next ? 'ok' : { message: `Total ${$quizes.data.length} quizes Created `, data: $quizes.data };
	}
	$quizes.preview = () => {
		if (!$quizes.$component.find('.sdlms-preview-container').length) {
			$quizes.$component.append($('<div>').attr({ class: 'sdlms-preview-container' }))
		}

		let $preview = $quizes.$component.find('.sdlms-preview-container');

		$preview.html('');

		$preview.append(function () {
			let k = '';
			$.each($quizes.data, function (i, e) {
				var quiz = $('<div>').attr({
					quizTarget: e.id
				});
				quiz.append($('<div>').html(
					`<div class="quiz-question" style="padding-right:100px"><b>${$quizes.numToSSColumn(i + 1)}. </b> ${e.question} <span data-id="${e.id}" data-quiz="remove">remove</span><span data-quiz="edit" data-id="${e.id}">Edit</span></div>`
				));
				quiz.append(function () {
					let options = '';
					$.each(e.options, function (oi, oe) {
						var ID = $quizes.generateID();
						options += `  <p>
                        <input type="radio" id="option-${ID}" readonly disabled ${$quizes.reverse(e.hash) == oi ? 'checked' : ''} value="${oe}" name="quiz-${i}">
                        <label for="option-${ID}">${oe}</label>
                      </p>`
					});
					return options;
				});
				k += quiz[0].outerHTML;
			});
			return k
		});
	}
	$quizes.getStyles = ($container, id) => {
		$container.append(`<style>#${id} *{user-select:none}#${id}{width:100%;margin:1rem;overflow:auto;display:flex}#${id} input[type=text],#${id} select,#${id} textarea{display:block;width:100%;padding:6px 12px;font-size:14px;line-height:1.42857143;color:#555;background-color:#fff;background-image:none;border:1px solid #ccc;border-radius:4px;-webkit-box-shadow:inset 0 1px 1px rgb(0 0 0 / 8%);box-shadow:inset 0 1px 1px rgb(0 0 0 / 8%);-webkit-transition:border-color ease-in-out .15s,-webkit-box-shadow ease-in-out .15s;-o-transition:border-color ease-in-out .15s,box-shadow ease-in-out .15s;transition:border-color ease-in-out .15s,box-shadow ease-in-out .15s;margin:10px 0}#${id} input[type=text]:focus,#${id} select:focus,#${id} textarea:focus{border-color:#2461b28f;outline:0;-webkit-box-shadow:inset 0 1px 1px rgb(0 0 0 / 8%),0 0 8px rgb(102 175 233 / 60%);box-shadow:inset 0 1px 1px rgb(0 0 0 / 8%),0 0 8px rgb(102 175 233 / 60%)}#${id} .quiz-container,#${id} .sdlms-preview-container{width:50%;padding:.5rem 1rem}#${id} .action-container{padding-top:.3rem}#${id} .action-container button{display:inline-block;font-weight:400;color:#212529;text-align:center;vertical-align:middle;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background-color:transparent;border:1px solid #fff;padding:.375rem .75rem;font-size:1rem;line-height:1.5;border-radius:.25rem;transition:color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;color:#fff;outline:#fff;cursor:pointer;font-size:.9rem}#${id} .action-container button:not(:first-child){margin-left:10px}.sdlms-preview-container{background:#fff}.sdlms-preview-container .quiz-stepper button{display:inline-block;font-weight:400;color:#212529;text-align:center;vertical-align:middle;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background-color:transparent;border:1px solid #2461b2;padding:.375rem .75rem;font-size:1rem;line-height:1.5;border-radius:.25rem;transition:color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;color:#2461b2;outline:#2461b2;cursor:pointer}#${id} [quiztarget]>p{margin:12px 0}#${id} [quizTarget] [type=radio]:checked,#${id} [quizTarget] [type=radio]:not(:checked){position:absolute;left:-9999px}#${id} [quizTarget] [type=radio]:checked+label,#${id} [quizTarget] [type=radio]:not(:checked)+label{position:relative;padding-left:28px;cursor:pointer;line-height:20px;display:inline-block;color:#666}#${id} [quizTarget] [type=radio]:checked+label:before,#${id} [quizTarget] [type=radio]:not(:checked)+label:before{content:'';position:absolute;left:0;top:0;width:18px;height:18px;border:1px solid #ddd;border-radius:100%;background:#fff}#${id} [quizTarget] [type=radio]:checked+label:after,#${id} [quizTarget] [type=radio]:not(:checked)+label:after{content:'';width:12px;height:12px;background:#f87da9;position:absolute;top:3px;left:3px;border-radius:100%;-webkit-transition:all .2s ease;transition:all .2s ease}#${id} [quizTarget]{margin-top:10px}[component="sdlms-quiz"] .quiz-question{font-size:1.2rem;}#${id} [quizTarget] [type=radio]:not(:checked)+label:after{opacity:0;-webkit-transform:scale(0);transform:scale(0)}#${id} [quizTarget] [type=radio]:checked+label:after{opacity:1;-webkit-transform:scale(1);transform:scale(1)}#${id} .quiz-question{position:relative}#${id} .quiz-question span{position:absolute;top:0;cursor:pointer;right:0}#${id} .quiz-question span[data-quiz="remove"]{right:40px}#${id} .remove-quiz-option{display:none;justify-content:flex-end;font-size:.8rem;text-decoration:underline;color:#fff;cursor:pointer}#${id} .quiz-stepper{display:flex;justify-content:space-between;align-items:center}#${id} .quiz-option-input-container:hover .remove-quiz-option{display:flex}#${id}  .option-container {  counter-reset: options;}#${id} .quiz-option-input-container {  position: relative;}#${id} .option-container > .quiz-option-input-container:before {  content: counter(options, upper-alpha) ".";  counter-increment: options;  position: absolute;  top: 0%;  transform: translate(10px, 6px);  z-index: 9;  left: 0;  font-size: 14px;}#${id} .quiz-option {  padding-left: 27px !important;}</style>`)
	}
	$quizes.reverse = (key) => {
		return $quizes.Base64.decode(decodeURIComponent(key)).split("-").pop()
	}
	$quizes.convert = (key) => {
		return encodeURIComponent($quizes.Base64.encode($quizes.generateID().split(Math.floor(Math.random() * 20)) + '-' + $.trim(String(key))))
	}
	$quizes.render = ($target,data = {}, onEnd = (reply) => { console.log(reply) }) => {
		if (!$target.find('.sdlms-preview-container').length) {
			$target.html($('<div>').attr({ class: 'sdlms-preview-container' ,style:'display:flex;flex-wrap:wrap', id:'sdlm-'+ $quizes.generateID()}))
		}
		let $preview = $target.find('.sdlms-preview-container');
		let started_at = new Date().getTime()
		$preview.html('');
		$quizes.getStyles($preview,$preview.attr('id'))
		$preview.append(function () {
			let k = '';
			$.each(data, function (i, e) {
				var quiz = $('<div>').attr({
					quizTarget: e.id,
					style:'width:100%'
				});
				quiz.append($('<div>').html(
					`<div class="quiz-question"><b>${$quizes.numToSSColumn(i + 1)}.</b> ${e.question}</div>`
				));
				k += quiz.append(function () {
					let options = '';
					$.each(e.options, function (oi, oe) {
						var ID = $quizes.generateID();
						options += `  <p>
                        <input type="radio" id="option-${ID}" value="${oi}" name="quiz-${i}">
                        <label for="option-${ID}">${oe}</label>
                      </p>`
					});
					return options;
				})[0].outerHTML;
			});
			return k
		});
		$preview.append(`
                <div class="quiz-stepper" style='width:100%'>
                    <button name="prev">Prev</button>
                    <button name="next">Next</button>
                </div>`
		);
		var quizes = $preview.find('[quizTarget]');
		var now = 0;
		quizes.hide().first().show();
		$preview.find("button[name=next]").click(function () {
			quizes.eq(now).hide();
			now = (now + 1 < quizes.length) ? now + 1 : end() || (quizes.length - 1);
			quizes.eq(now).show();
			function end() {
				let ans = [];
				let error = 0
				let result = [];
				let attempt = 0;
				$preview.find('[quizTarget]').each(function (i, e) {
					$(`[name="quiz-${i}"]:checked`).val() ? (attempt++, $(`[name="quiz-${i}"]:checked`).val()) : error++
					ans.push(
						{
							id: $(this).attr('quizTarget'),
							hash: $(`[name="quiz-${i}"]:checked`).val() ?
								$quizes.convert($(`[name="quiz-${i}"]:checked`).val())
								: null
						}
					);
					let p = data.find(e => e.id == $(this).attr('quizTarget'));
					if ($quizes.reverse(p.hash) == $(`[name="quiz-${i}"]:checked`).val()) {
						result.push($(this).attr('quizTarget'));
					}
				});
				let ended = new Date().getTime();
				let obj = {
					started: started_at,
					ended: ended,
					timeTaken: (ended - started_at),
					score: `${((result.length * 100) / data.length).toFixed(2)}%`,
					raw: `${((result.length * 100) / data.length).toFixed(2)}`,
					questions: data.length,
					attempt: attempt,
					skip: data.length - attempt,
					result: result,
					keys: ans,
					questions: data,
					component: $preview,
					tabChanged: $window
				}
				return onEnd(obj);
			}
		});
		$preview.find("button[name=prev]").click(function () {
			quizes.eq(now).hide();
			now = (now > 0) ? now - 1 : now;
			quizes.eq(now).show();
		});

	}
	$quizes.Base64 = {
		_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

		encode: function (input = '') {
			var output = "";
			var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
			var i = 0;

			input = $quizes.Base64._utf8_encode(input);

			while (i < input.length) {

				chr1 = input.charCodeAt(i++);
				chr2 = input.charCodeAt(i++);
				chr3 = input.charCodeAt(i++);

				enc1 = chr1 >> 2;
				enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
				enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
				enc4 = chr3 & 63;

				if (isNaN(chr2)) {
					enc3 = enc4 = 64;
				} else if (isNaN(chr3)) {
					enc4 = 64;
				}

				output = output +
					$quizes.Base64._keyStr.charAt(enc1) + $quizes.Base64._keyStr.charAt(enc2) +
					$quizes.Base64._keyStr.charAt(enc3) + $quizes.Base64._keyStr.charAt(enc4);
			}

			return output;
		},

		decode: function (input = '') {
			var output = "";
			var chr1, chr2, chr3;
			var enc1, enc2, enc3, enc4;
			var i = 0;

			input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

			while (i < input.length) {

				enc1 = $quizes.Base64._keyStr.indexOf(input.charAt(i++));
				enc2 = $quizes.Base64._keyStr.indexOf(input.charAt(i++));
				enc3 = $quizes.Base64._keyStr.indexOf(input.charAt(i++));
				enc4 = $quizes.Base64._keyStr.indexOf(input.charAt(i++));

				chr1 = (enc1 << 2) | (enc2 >> 4);
				chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
				chr3 = ((enc3 & 3) << 6) | enc4;

				output = output + String.fromCharCode(chr1);

				if (enc3 != 64) {
					output = output + String.fromCharCode(chr2);
				}
				if (enc4 != 64) {
					output = output + String.fromCharCode(chr3);
				}
			}

			output = $quizes.Base64._utf8_decode(output);

			return output;
		},

		_utf8_encode: function (string) {
			string = string.replace(/\r\n/g, "\n");
			var utftext = "";

			for (var n = 0; n < string.length; n++) {

				var c = string.charCodeAt(n);

				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if ((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}
			}
			return utftext;
		},

		_utf8_decode: function (utftext) {
			var string = "";
			var i = 0;
			var c = 0
			var c1 = 0
			var c2 = 0;

			while (i < utftext.length) {

				c = utftext.charCodeAt(i);

				if (c < 128) {
					string += String.fromCharCode(c);
					i++;
				}
				else if ((c > 191) && (c < 224)) {
					c2 = utftext.charCodeAt(i + 1);
					string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
					i += 2;
				}
				else {
					c2 = utftext.charCodeAt(i + 1);
					c3 = utftext.charCodeAt(i + 2);
					string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
					i += 3;
				}
			}
			return string;
		}
	}
	$quizes.get =  () =>{
		return {data:$quizes.data}
	}
	return $quizes;
});
