var app=window.app,
    trainingView,
    loc_string=window.loc_string;

trainingView = {
    swipeAnswer: null,

    init: function() {
	'use strict';
	
	// initialise Swipe
	this.swipeAnswer = new Dragend(document.getElementById("swipeArea"), {
            pageClass: "dragend-page",
            direction: "horizontal",
            onSwipeEnd: trainingView.SwipeAnswer_onSwipe,
        });
	document.getElementById("ImageMenu").addEventListener("click",trainingView.ButtonMenu_onClick);
	document.getElementById("LectionCaption").innerHTML = window.loc_string.lection_caption;
    },
    show: function() {
	this.swipeAnswer.jumpToPage(2);
    },
    pause: function() {
	ViewMaster.closeCurrent();
    },
    close: function() {
	app.writeBoxes();
        app.store_back();
    },
    revealAnswer: function () {
        'use strict';
	if (app.currentWord.word === undefined) return;
        var answer;
        
        answer = (app.reverse)
            ? app.currentWord.word
            : app.currentWord.translation;
	if (!app.vowels) answer = app.removeVowels(answer);
        document.getElementById("coverDiv").style.visibility = "hidden";
        document.getElementById("answer").innerHTML = answer.replace(",", "<br>");
        document.getElementById("answer").style.color = "#000000";
        document.getElementById("swipeArea").style.overflow = "visible";
        app.matchFont("answer");
        this.swipeAnswer.preventScroll = false;
	this.hideUndo();
        this.activateButtonCorrect();
        this.activateButtonWrong();
    },
    hideAnswer: function () {
        'use strict';
        document.getElementById("answer").innerHTML = "";
        document.getElementById("swipeArea").style.overflow = "hidden";
        document.getElementById("cover").innerHTML = "?";
        app.matchFont("cover");
        document.getElementById("cover").style.color = "#a0a0a0";
        document.getElementById("coverDiv").style.visibility = "visible";
        this.swipeAnswer.jumpToPage(2);
        this.swipeAnswer.preventScroll = true;
        this.deactivateButtonCorrect();
        this.deactivateButtonWrong();
    },
    /* update the displays for the word and its translation (if already revealed)
     */
    updateWord: function () {
        'use strict';
	if (app.currentWord.word === undefined) return;
        if (document.getElementById("coverDiv").style.visibility === "hidden") {
            this.revealAnswer();
        }
        var question = (!app.reverse)
            ? app.currentWord.word
            : app.currentWord.translation;
	if (!app.vowels) question = app.removeVowels(question);
        document.getElementById("question").innerHTML = question;
        app.matchFont("question");
            
    },
    showUndoWrong: function() {
	var wrapper = document.getElementById("UndoDiv");
	wrapper.style.right="auto";
	wrapper.style.left="0px";
	this.showUndo();
    },
    showUndoCorrect: function () {
	var wrapper = document.getElementById("UndoDiv");
	wrapper.style.left="auto";
	wrapper.style.right="0px";
	this.showUndo();
    },
    showUndo: function() {
	var wrapper = document.getElementById("UndoDiv");
	wrapper.style.visibility = "visible";
	wrapper.style.opacity = "0.5";

	if (this.debug !== undefined) {
	    wrapper.style.animation="removeDebug";
	}
	
	//Trigger annimation
	wrapper.style.display = "none";
	window.setTimeout(function(){
	    wrapper.style.display="block";
	},1);

    },
    hideUndo: function() {
	if (this.debug === undefined) {
	    document.getElementById("UndoDiv").style.visibility="hidden";
	} else {
	    document.getElementById("UndoDiv").style.opacity="0.1";
	}
    },
    updateBoxes: function () {
        'use strict';
	var i;

        var box = app.count();
        for (i = 0; i < 5; i += 1) {
            document.getElementById("Box" + i).innerHTML = box[i];
            document.getElementById("Box" + i).style.fontWeight = "normal";
            document.getElementById("Box" + i + "Div").style.backgroundColor = "";
            app.matchFont("Box" + i);
        }
        if (app.revisionMode) {
	    document.getElementById("Box" + 1 + "Div").style.backgroundColor = "#a0a0a0";
	    document.getElementById("Box" + 3 + "Div").style.backgroundColor = "#a0a0a0";

	    //show revision Box in the Middle
            document.getElementById("Box" + 2).style.fontWeight = "bold";
            document.getElementById("Box" + 2 + "Div").style.backgroundColor = "#fcff66";
	    document.getElementById("Box" + 2).innerHTML = box[5];
        } else {
            document.getElementById("Box" + app.currentBox).style.fontWeight = "bold";
            document.getElementById("Box" + app.currentBox + "Div").style.backgroundColor = "#fcff66";
	}
    },
    activateButtonCorrect: function () {
        'use strict';
        document.getElementById("ButtonCorrect").disabled = false;
	document.getElementById("ButtonCorrect").classList.remove("ButtonDisabled");
	document.getElementById("ButtonCorrect").classList.add("ButtonEnabled");
        document.getElementById("ImageCorrect").src = "res/tick.png";
    },
    deactivateButtonCorrect: function () {
        'use strict';
        document.getElementById("ButtonCorrect").disabled = true;
	document.getElementById("ButtonCorrect").classList.add("ButtonDisabled");
	document.getElementById("ButtonCorrect").classList.remove("ButtonEnabled");
        document.getElementById("ImageCorrect").src = "res/tickDeact.png";
    },
    activateButtonWrong: function () {
        'use strict';
        document.getElementById("ButtonWrong").disabled = false;
	document.getElementById("ButtonWrong").classList.remove("ButtonDisabled");
	document.getElementById("ButtonWrong").classList.add("ButtonEnabled");
        document.getElementById("ImageWrong").src = "res/cross.png";
    },
    deactivateButtonWrong: function () {
        'use strict';
        document.getElementById("ButtonWrong").disabled = true;
	document.getElementById("ButtonWrong").classList.add("ButtonDisabled");
	document.getElementById("ButtonWrong").classList.remove("ButtonEnabled");
        document.getElementById("ImageWrong").src = "res/crossDeact.png";
    },
    ButtonCorrect_onClick: function () {
        'use strict';
        app.moveCorrect();
	trainingView.showUndoCorrect();
    },
    ButtonWrong_onClick: function () {
        'use strict';
        app.moveWrong();
	trainingView.showUndoWrong();
    },
    ButtonMenu_onClick: function (event) {
        'use strict';
	ViewMaster.closeCurrent();
        event.stopPropagation();
    },
    SwipeAnswer_onSwipe: function () {
        'use strict';
        if (trainingView.swipeAnswer.page === 2) {
	    trainingView.ButtonWrong_onClick();
        } else if (trainingView.swipeAnswer.page === 0) {
	    trainingView.ButtonCorrect_onClick();
        }
    },
    triggerUndo: function() {
	if (app.revisionMode) {
	    app.words[5].push(app.currentWord);
	    app.currentWord = app.words[app.lastBox].pop();
	} else {
	    app.words[app.currentBox].push(app.currentWord);
	    app.currentWord = app.waitingList.undo();
	    app.currentBox = app.lastBox;
	    delete app.currentWord.dest;
	}
	trainingView.revealAnswer();
	trainingView.updateWord();
	trainingView.updateBoxes();
	trainingView.hideUndo();
    },

}
