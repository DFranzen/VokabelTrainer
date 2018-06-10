editDialog = {
    init: function () {
        'use strict';
	window.console.log("Activating LongPress for editDialog");
	editDialog.activateLongpress(document.getElementById("questionDiv"));

	document.getElementById("SaveCaption").innerHTML = window.loc_string.save_caption;
	document.getElementById("CancelCaption").innerHTML = window.loc_string.cancel_caption;

	app.matchFont("SaveCaption");
	app.matchFont("CancelCaption");
    },
    show: function () {
        'use strict';
        var answer;

        trainingView.revealAnswer();
        document.getElementById("editQuestionField").style.fontSize = document.getElementById("question").style.fontSize;
        document.getElementById("editAnswerField").style.fontSize = document.getElementById("answer").style.fontSize;
        answer = document.getElementById("answer").innerHTML;
        document.getElementById("editAnswerField").value = answer.replace("<br>", ",");
        document.getElementById("editQuestionField").value = document.getElementById("question").innerHTML;
    },
    save: function () {
        'use strict';

	var question = document.getElementById("editQuestionField").value;
	var answer = document.getElementById("editAnswerField").value;
	
        app.currentWord.word = app.reverse ? answer : question;
        app.currentWord.translation = app.reverse ? question : answer;
        trainingView.updateWord();
	ViewMaster.closeCurrent();
    },
    cancel: function() {
	'use strict';
	ViewMaster.closeCurrent();
    },
    close: function () {
	app.matchFont("answer");
	app.matchFont("question");
    },
    longpress: false,
    presstimer: null,
    longtarget: null,
    activateLongpress: function (node) {
        'use strict';
	if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
            node.addEventListener("touchstart", editDialog.startLongPress);
            node.addEventListener("touchend", editDialog.cancelLongPress);
            node.addEventListener("touchleave", editDialog.cancelLongPress);
            node.addEventListener("touchcancel", editDialog.cancelLongPress);
	} else {
	    node.addEventListener("mousedown", editDialog.startLongPress);
	    node.addEventListener("mouseup", editDialog.cancelLongPress);
	    node.addEventListener("mousemove", editDialog.cancelLongPress);
	}

        node.addEventListener("click", editDialog.clickLongPress);
    },
    startLongPress: function (e) {
        'use strict';
        
        if (e.type === "click" && e.button !== 0) {
            return;
        }
        editDialog.longpress = false;

        editDialog.presstimer = setTimeout(function () {
            editDialog.presstimer = null;
            editDialog.longpress = true;
	    ViewMaster.show("edit");
        }, 1200);
	document.getElementById("app").classList.add("greyedOut");

        return false;
    },
    clickLongPress:  function (e) {
        'use strict';

        if (editDialog.presstimer !== null) {
            clearTimeout(editDialog.presstimer);
            editDialog.presstimer = null;
        }

        document.getElementById("app").classList.remove("greyedOut");

        if (editDialog.longpress) {
            return false;
        }
    },
    cancelLongPress: function (e) {
        'use strict';

        if (editDialog.presstimer !== null) {
            clearTimeout(editDialog.presstimer);
            editDialog.presstimer = null;
        }
        document.getElementById("app").classList.remove("greyedOut");
    }
};
