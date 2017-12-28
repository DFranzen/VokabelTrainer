
/* Todo-list
 * *** Features
 *  - Demo Workthrough / Hilfe
 *  - Lektionen umbennen / duplizieren / erstellen
 *  - Wörter hinzufügen
 *  - Wörter editieren in List view
 *  - mark / unmark alle files im file view
 *  - Optionales Zeitlimit im Wiederholungsmodus
 *  - Blättern mit swipe im File view
 *  - Font-size über app-neustart speichern
 *  - css icons zum blättern im Detail dialog
 * *** Bugs
 *  - Check file availability after wake
 *  - Delete leftovers of deleted files to enable readd of broken files
 *  - Change outer margins of table in Detail list view 
 * *** Ideas
 *  - picture vokabelListen
 *  - localise
 * *** Progress
 *  - BUG: Double click fires sometimes with multiple clicks or swipes
 *  - BUG: Message Dialog does not close on back
 *  - BUG: Message Dialog says continue if #(6) = all
 *  - BUG: Message dialog shows on startup
 *  - BUG: Undo circle not decreasing after half way
 *  - BUG: Font-size after edit
 *  - BUG: Files do not combine correctly into repetition mode, when #(4)=all
 *  - #(words) auf der Vorschau
 *  - change font-size in file view with volumne rocker
 *  - Blättern zum nächsten File in List view
 *  - added ViewMaster to control the views
 *  - Modularised trainingView out of app and menu out of listAPI
 */

var Dragend = window.Dragend,
    listAPI = window.listAPI,
    dialog = window.dialog,
    cordova = window.cordova,
    trainigView = window.trainingView,
    ViewMaster,
    messageBox,
    menu = window.menu,
    editDialog,
    app;

var loc_string_eng = {
    revision_start_caption: "Well done",
    revision_start_message: "You have learned all your words. Now we start repetition mode",
    revision_end_caption: "Complete",
    revision_end_message: "You have finished your revision. Now practise the words you did not know",
    revision_restart_caption: "Continue Revision",
    revision_restart_message: "Continue to do the revision",
    no_files_selected_caption: "No files selected",
    no_files_selected_message: "First add or select the files you want to practise and then hit the start button"
};

var loc_string_de = {
    revision_start_caption: "Bravo",
    revision_start_message: "Du hast alle Vokabeln gelernt. Jetzt geht's an die Wiederholung",
    revision_end_caption: "Fertig",
    revision_end_message: "Du hast die Wiederholung abgeschlossen. Lerne jetzt die Vokabel, die du nicht wußtest",
    revision_restart_caption: "Wiederholungsphase",
    revision_restart_message: "Setze die Wiederholung fort",
    no_files_selected_caption: "Keine Dateien ausgewählt",
    no_files_selected_message: "Wähle erst die Dateien aus, die du lernen willst. Danach drücke den grünen Start Knopf"
}

var loc_string = loc_string_eng;

ViewMaster = {
    currentView: "",
    views: {},
    viewStack: [],
    registerView: function(name, htmlClass, jsClass, overlay) {
	window.console.log("Registering view " + name);
	if (overlay === undefined) {
	    overlay=false;
	}
	this.views[name] = {
	    htmlClass: htmlClass,
	    jsClass: jsClass,
	    overlay: overlay,
	};
	if (jsClass.init !== undefined) {
	    jsClass.init();
	}
    },
    hideAll: function() {
	var viewName;
	for (viewName in this.views) {
	    this.hide(viewName);
	}
    },
    hide: function(viewName) {
	'use strict';
	
        var divs = document.getElementsByClassName(this.views[viewName].htmlClass),
            div;
        for (div = 0; div < divs.length; div = div + 1) {
            divs[div].style.visibility = "hidden";
        }
    },
    show: function(viewName,push) {
	'use strict';

	if (push === undefined) push=true;

	if (this.views[viewName] === undefined) {
	    window.alert("Error:\nTrying to open an undefined view: " + viewName);
	}
	
	var divs = document.getElementsByClassName(this.views[viewName].htmlClass),
            div;
	
	if (this.currentView !== "") {
	    if (push) {
		this.viewStack.push(this.currentView);
	    }
	}
	this.currentView = viewName;

	if (!this.views[viewName].overlay) {
	    this.hideAll();
	}

        for (div = 0; div < divs.length; div = div + 1) {
            divs[div].style.visibility = "visible";
        }
	if (this.views[viewName].jsClass.show !== undefined) {
	    window.console.log("Calling show on current View: " + viewName);
	    this.views[viewName].jsClass.show();
	}
    },
    closeCurrent: function() {
	var last= this.currentView;
	if ( (this.currentView === "") || (this.viewStack.length === 0) ) {
	    return navigator.app.exitApp();
	}
	
	if (this.views[last].jsClass !== undefined) {
	    if (this.views[last].jsClass.close !== undefined) {
		window.console.log("Calling close on current view");
		this.views[last].jsClass.close();
	    }
	}

	this.hide(this.currentView);
	this.currentView=this.viewStack.pop();
	if (!this.views[last].overlay) {
	    window.console.log("showing view through ViewMaster");
	    this.show(this.currentView,false);
	} else {
	    if (this.views[this.currentView].show !== undefined) {
		window.console.log("showing view by itself");
		this.views[this.currentView].show();
	    }
	}
    },
    pause: function() {
	if (this.views[this.currentView] === undefined) return;
	if (this.views[this.currentView].jsClass === undefined) return;
	if (this.views[this.currentView].jsClass.pause !== undefined) {
	    this.views[this.currentView].jsClass.pause();
	}
    }
}

app = {
    words: [[], [], [], [], [], []],
    currentBox: 0,
    currentWord: {},
    lastBox: 0,

    revisionMode: false,

    fileNames: [],
    loadingFileIndex: 0,

    reverse: false,
    vowels: true,

    // Application Constructor
    initialize: function () {
        'use strict';

	if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
            document.addEventListener("deviceready", app.onDeviceReady, false);
	} else {
            window.addEventListener("load",app.onDeviceReady,false);
	}
    },

    // deviceready Event Handler
    //
    onDeviceReady: function () {
        'use strict';

	// listen to Android events
        document.addEventListener("backbutton", app.backButton_onClick);
        document.addEventListener("pause", app.onPause);
        window.addEventListener("orientationchange", app.onRotate);
	
	document.addEventListener("volumedownbutton", function() {app.decFontSize() });
	document.addEventListener("volumeupbutton", function() {app.incFontSize() });
	app.incFontSize("10px");

	listAPI.init();
	
	// load saved values
        if (localStorage.getItem('reverse') !== null) {
	    app.reverse = localStorage.getItem('reverse');
	}
	
	// initialise List view
	ViewMaster.registerView("menu","Menu",menu);
	ViewMaster.registerView("training","Training",trainingView);
	ViewMaster.registerView("details","Details",dialog, true);
	ViewMaster.registerView("edit","edit",editDialog, true);
	ViewMaster.registerView("message","MessageBox",messageBox, true);
	ViewMaster.show("menu");
    },
    resetWords: function () {
        'use strict';
        app.words = [[], [], [], [], [], []];
        app.revisionMode = false;
        app.currentWord = {};
        app.waitingList.init();
    },
    loadTest: function () {
        'use strict';
        listAPI.add("test", false);
	menu.updatePreview(0,false);
	menu.show();
    },
    incFontSize: function(size) {
	var elements = document.getElementsByClassName("fontResize"),
	    i;
	for (i = 0; i<elements.length; i++) {
	    app.incFontSizeOne(elements[i],size);
	}
    },
    incFontSizeOne: function(element,size) {
	if (size === undefined) {
	    size = element.style.fontSize;
	}
	size = parseInt(size);
	element.style.fontSize=(size + 2) + "px";
    },
    decFontSize: function(size) {
	var elements = document.getElementsByClassName("fontResize"),
	    i;
	for (i = 0; i<elements.length; i++) {
	    app.decFontSizeOne(elements[i],size);
	}
    },
    decFontSizeOne: function(element,size) {
	if (size === undefined) {
	    size = element.style.fontSize;
	}
	size = parseInt(size);

	element.style.fontSize=(size - 2) + "px";
    },
    waitingList: (function () {
        'use strict';
        
        var list = [];

        return {
            length: 0,
            lastInsert: 6,
            init: function () {
                list = [];
            },
            push: function (word, dest) {
                word.dest = dest;
                if (list.length >= 4) {
                    this.pop();
                }
                list.push(word);
                this.length = list.length;
            },
	    undo: function() {
		if (list.length === 0) return undefined;
		return list.pop();
	    },
            pop: function () {
                var poped;

                if (list.length === 0) {
                    return 6;
                }
                poped = list[0];
                list.splice(0, 1);
                this.lastInsert = poped.dest;
                this.length = list.length;
                app.words[poped.dest].push(poped);

                return poped.dest;
            },
            popAll: function () {
                while (list.length !== 0) {
                    this.pop();
                }
                this.length = 0;
            },
            simulatePopAll: function (boxes) {
                var i,
                    word;

                for (i = 0; i < list.length; i = i + 1) {
                    word = list[i];
                    boxes[word.dest] = boxes[word.dest] + 1;
                }
            },
            sortInto: function (files) {
                var i,
                    word;

                for (i = 0; i < list.length; i += 1) {
                    word = list[i];
                    if (files[word.file] === undefined) {
                        files[word.file] = [[], [], [], [], [], []];
                    }
                    files[word.file][word.dest].push(word);
                }
            },
        };
    }()),
    boxIsSuitable: function (index) {
        'use strict';
        
        if ((app.lastInsert === index) && (app.words[index].length === 1)) {
            return false;
        }
        if (app.words[index].length === 0) {
            return false;
        }
        
        return true;
    },
    findNextBox: function () {
        'use strict';
        var found = false,
            next = 0;
        
        while ((next < 5) && !app.boxIsSuitable(next)) {
            next = next + 1;
        }

        if (next < 5) {
            app.currentBox = next;
        } else {
            if ((app.currentBox = app.waitingList.pop()) === 6) {
		//i.e. no word popped
                window.console.log("No words found");
		ViewMaster.closeCurrent();  //Close the Training
            }
        }
    },
    needNewBox: function () {
        'use strict';
        if (app.revisionMode) {
            window.console.log("Testing revision condition: " + app.words[5].length);
            if (app.words[5].length === 0) {
                window.console.log("Revision is over");
                // Revision is over
                app.deactivateRevision();
		messageBox.show(loc_string.revision_end_caption,loc_string.revision_end_message);
		window.setTimeout(function(){trainigView.hideUndo();},3);
		
                return true;
            } else {
                return false;
            }
        }
        // Outside revision mode recently asked words are managed via Waitinglist
        return true;
    },
    
    removeVowels: function(word) {
	'use strict';
	var i,
	    back = '';
	for ( i = 0; i < word.length; i++) {
	    if (word.charCodeAt(i) === 1614) continue; //fatha
	    if (word.charCodeAt(i) === 1615) continue; //damma
	    if (word.charCodeAt(i) === 1616) continue; //kasra

	    back += word[i];
	}

	return back;
    },
    findNextWord: function () {
        'use strict';

        var question,
            wordID,
	    box;

	if (app.revisionReady()) {
	    app.activateRevision();
	}
	
        if (app.needNewBox()) {
            app.findNextBox();
        }
        window.console.log("Getting new word");

	box = app.words[app.currentBox];

	
        wordID = Math.floor(Math.random() * box.length);
        app.currentWord = box[wordID];
        box.splice(wordID, 1);

        trainingView.hideAnswer();
        trainingView.updateBoxes();
        trainingView.updateWord();
    },
    onRotate: function () {
        'use strict';
        setTimeout(function () {
            var i;

            app.matchFont("question");
            app.matchFont("answer");
            for (i = 0; i < 5; i = i + 1) {
                app.matchFont("Box" + i);
            }
            app.matchFont("prev_question");
            app.matchFont("prev_answer");
            app.matchFont("cover");
        }, 100);
    },
    matchFont: function (divID) {
        'use strict';
        var div,
            fs_width,
            fs_height;
        
        window.console.log("Matching Font: " + divID);

        div = document.getElementById(divID);
        if (div.innerHTML === "") {
            return;
        }
        div.style.fontSize = "100%";

        fs_width  = 100 * div.parentElement.offsetWidth  / div.offsetWidth;
        fs_height = 100 * div.parentElement.parentElement.offsetHeight / div.offsetHeight;

        window.console.log(div.parentElement.parentElement.paddingBottom);

        div.style.fontSize = Math.min(fs_width, fs_height) * 0.8 + "%";
    },
    moveCorrect: function () {
        'use strict';

        var dest;
        
        if (app.revisionMode) {
	    app.words[4].push(app.currentWord);
	    app.lastBox = 4;
        } else {
            dest = (app.currentBox < 4)
                ? app.currentBox + 1
                : 4;
            app.waitingList.push(app.currentWord, dest);
	    app.lastBox = app.currentBox;
        }
	app.currentWord = {};
        app.findNextWord();
    },
    moveWrong: function () {
        'use strict';
        var dest;
        
        if (app.revisionMode) {
            app.words[0].push(app.currentWord);
	    app.lastBox = 0;
        } else {
            dest = (app.currentBox > 0)
                ? app.currentBox - 1
                : 0;
            app.waitingList.push(app.currentWord, dest);
	    app.lastBox = app.currentBox;
        }
	app.currentWord = {};
        app.findNextWord();
    },
    activateRevision: function () {
        'use strict';

        window.console.log("Activating Revision");
        app.revisionMode = true;
	app.currentBox = 5; //This is revision
        app.waitingList.popAll();

	app.words[5] = app.words[5].concat(app.words[4]);
	app.words[4] = [];
	trainigView.updateBoxes();

	messageBox.show(loc_string.revision_start_caption,loc_string.revision_start_message);
	window.setTimeout(function(){trainigView.hideUndo();},3);
    },
    reactivateRevision: function () {
        'use strict';

        window.console.log("Reactivating Revision");
	app.revisionMode = true;
	app.currentBox = 5; //This is revision
	trainingView.updateBoxes();
	messageBox.show(loc_string.revision_restart_caption,loc_string.revision_restart_message);
    },
    deactivateRevision: function () {
        'use strict';
        var i;
        
        window.console.log("Deactivating Revision");
        app.revisionMode = false;
        app.words[4] = app.words[4].concat(app.words[5]);
        app.words[5] = [];
        for (i = 1; i <= 3; i = i + 1) {
            document.getElementById("Box" + i + "Div").style.backgroundColor = "";
        }
	app.currentBox = 0;
	trainingView.updateBoxes();
	trainingView.hideUndo();
    },
    revisionReady: function() {
	var box = app.count();
	if ((!app.revisionMode) && (box[0] + box[1] + box[2] + box[3] === 0)) {
            return true;
	}
	return false;
    },
    count: function () {
	var box = [],
            i;
        // count the boxes
        for (i = 0; i <= 5; i = i + 1) {
            box[i] = app.words[i].length;
        }
	// count the waitingList
        app.waitingList.simulatePopAll(box);

	// count the current word
	if (app.currentWord.word !== undefined) {
	    box[app.currentBox] += 1;
        }

	return box;
    },
    writeBoxes: function () {
        'use strict';
        // write back Waiting List
        app.waitingList.popAll();

        // Write back current Word
	if (app.currentWord.word !== undefined) {
            app.words[app.currentBox].push(app.currentWord);
	    app.currentWord = {};
	}
    },
    loadLession: function (fileName) {
        'use strict';
        var processFile = function (boxes) {
            var j;
	    if ( (boxes[0].length + boxes[1].length + boxes[2].length + boxes[3].length + boxes[5].length) === 0 ) {
		boxes[5] = boxes[4];
		boxes[4] = [];
	    }
            for (j = 0; j < 6; j += 1) {
                app.words[j] = app.words[j].concat(boxes[j]);
            }
	    if (boxes[1].length + boxes[2].length + boxes[3].length !== 0) {
		app.revisionMode = false;
	    }
	    if ( (boxes[0].length !== 0) && (boxes[5].length === 0) ) {
		app.revisionMode = false;
	    }
            app.processed += 1;
            if (app.processed >= app.fileNames.length) {
                app.startSession();
            }
        };
        listAPI.withParsed(fileName, processFile);
        listAPI.touch(fileName);
    },
    startSession: function () {
        'use strict';
	app.currentWord = {};
	ViewMaster.show("training");

	if (!app.revisionMode) {
	    app.deactivateRevision();
	} else if ( (app.words[5].length === 0) || (app.words[0].length + app.words[1].length + app.words[2].length + app.words[3].length + app.words[4].length === 0)) {
	    app.activateRevision();
	} else {
	    app.reactivateRevision();
	}
        app.findNextWord();
    },
    /* sorts all words from the Boxes, the revision box and the current words into files
     * returns: dictionary with one entry per file name containing a 5+1 Box array each
     */
    sortBoxes: function () {
        'use strict';

        var files = {},
            i,
            j,
            word;

        
        //Boxes
        for (i = 0; i <= 5; i += 1) {
            for (j = 0; j < app.words[i].length; j += 1) {
                word = app.words[i][j];
                if (files[word.file] === undefined) {
                    files[word.file] = [[], [], [], [], [], []];
                }
                files[word.file][i].push(word);
            }
        }
	//waitinglist
        app.waitingList.sortInto(files);
        //CurrentWord
        if (app.currentWord.file !== undefined) {
            word = app.currentWord;
            if (files[word.file] === undefined) {
                files[word.file] = [[], [], [], [], [], []];
            }
	    files[word.file][app.currentBox].push(word);
	}

        return files;
    },
    store_back: function () {
        'use strict';
        var files = app.sortBoxes(),
            keys = Object.keys(files),
            i;
        for (i = 0; i < keys.length; i += 1) {
            if (keys[i] !== undefined) {
                listAPI.writeParsed(keys[i], files[keys[i]]);
            }
        }
        //	app.loadingFileIndex = 0;
        //	app.writeNextFile();
    },
    backButton_onClick: function (event) {
        'use strict';
	ViewMaster.closeCurrent();
    },
    onPause: function (event) {
	ViewMaster.pause();
    }
};

messageBox = {
    shown: false,
    init: function () {
	this.shown = false;
	document.getElementById("MessageBox").addEventListener("click",messageBox.hide);
    },
    hide: function () {
	document.getElementById("MessageBox").style.visibility = "hidden";
	this.shown = false;
    },
    show: function (caption,body) {
	if (caption !== undefined) {
	    document.getElementById("MessageCaption").innerHTML = caption;
	}
	if (body !== undefined) {
	    document.getElementById("MessageBody").innerHTML = body;
	}
	document.getElementById("MessageBox").style.visibility = "visible";
	this.shown = true;
    }
};

editDialog = {
    init: function () {
        'use strict';
	editDialog.activateLongpress(document.getElementById("questionDiv"));
    },
    show: function () {
        'use strict';
        var answer;

        trainingView.revealAnswer();
	ViewMaster.show("edit");
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
        traningView.updateWord();
	editDialog.close();
    },
    close: function () {
	ViewMaster.closeCurrent();
	app.matchFont("answer");
	app.matchFont("question");
    },
    longpress: false,
    presstimer: null,
    longtarget: null,
    activateLongpress: function (node) {
        'use strict';
        node.addEventListener("touchstart", editDialog.start);
        node.addEventListener("click", editDialog.click);
        node.addEventListener("touchend", editDialog.cancel);
        node.addEventListener("touchleave", editDialog.cancel);
        node.addEventListener("touchcancel", editDialog.cancel);
    },
    start: function (e) {
        'use strict';
        
        if (e.type === "click" && e.button !== 0) {
            return;
        }
        editDialog.longpress = false;
        document.getElementById("app").classList.add("greyedOut");

        editDialog.presstimer = setTimeout(function () {
            editDialog.presstimer = null;
            editDialog.show();
            editDialog.longpress = true;
        }, 1200);
        return false;
    },
    click:  function (e) {
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
    cancel: function (e) {
        'use strict';
        if (editDialog.presstimer !== null) {
            clearTimeout(editDialog.presstimer);
            editDialog.presstimer = null;
        }
        document.getElementById("app").classList.remove("greyedOut");
    }
};

app.initialize();
