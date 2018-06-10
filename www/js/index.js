
/* Todo-list
 * *** Features
 *  - Demo Workthrough / Hilfe
 *  - Lektionen umbennen / duplizieren / erstellen
 *  - Wörter hinzufügen
 *  - Wörter editieren in List view
 *  - mark / unmark alle files im file view
 *  - Optionales Zeitlimit im Wiederholungsmodus
 *  - Blättern mit swipe im File view
 *  - css icons zum blättern im Detail dialog
 * *** Bugs
 *  - Check file availability after wake
 *  - Delete leftovers of deleted files to enable readd of broken files
 *  - Change outer margins of table in Detail list view 
 *  - icons for new sorting modes
 * *** Ideas
 *  - picture vokabelListen
 *  - localise
 * *** Progress since last commit
 *  - BUG: editDialog with ViewMaster
 *  - BUG: round progress bar having artefacts
 *  - BUG: Save / Cancel button in Editdialog not FontMatched
 *  - reworked Search result to display words emmidiately instead of files
 *  - Font-size über app-neustart speichern
 *  - minimum font of 10pt in list view
 *  - Remodel sorting system to make it extendable
 *  - Added anti-recent, progress and anti-progress as sort modes
 */

var Dragend = window.Dragend,
    listAPI = window.listAPI,
    dialog = window.dialog,
    cordova = window.cordova,
    trainigView = window.trainingView,
    ViewMaster,
    FirstUse,
    messageBox,
    menu = window.menu,
    editDialog,
    app,
    loc_string;

/*
View have at least the following properties:
close: function to be executed when the view is no longer shown
show: function to be executed when the view is activated
[optional]
init: function to be executed when the view is registered to the ViewMaster
pause: function to be executed when the app is paused within this view
*/

ViewMaster = {
    currentView: "",
    views: {},
    viewStack: [],
    bgView: "",
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
	    window.console.log("Initializing " + name);
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

	var oldView = this.currentView;
	
	if (push === undefined) push=true;

	if (this.views[viewName] === undefined) {
	    window.alert("Error:\nTrying to open an undefined view: " + viewName);
	}
	
	
	if (oldView !== "") {
	    if (push) {
		this.viewStack.push(oldView);
	    }
	}
	this.currentView = viewName;

	if (!this.views[viewName].overlay) {
	    this.hideAll();
	} else {
	    this.bgView = oldView;
	}
	this.makeVisible(viewName);
	if (this.views[viewName].jsClass.show !== undefined) {
	    window.console.log("Calling show on current View: " + viewName);
	    this.views[viewName].jsClass.show();
	}
    },
    makeVisible: function(viewName) {
	var divs = document.getElementsByClassName(this.views[viewName].htmlClass),
            div;
	for (div = 0; div < divs.length; div = div + 1) {
            divs[div].style.visibility = "visible";
        }   
    },
    closeCurrent: function() {
	var last= this.currentView,
	    i,j;
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
	window.console.log("showing view through ViewMaster");
	i=this.viewStack.length-1;
	while (i>=0) {
	    if (this.views[this.viewStack[i]].overlay) {
		i = i-1;
	    } else {
		break;
	    }
	}
	for (j = i; j < this.viewStack.length; j++ ) {
	    this.show(this.viewStack[j],false);
	}
	this.currentView=this.viewStack.pop();
    },
    pause: function() {
	if (this.views[this.currentView] === undefined) return;
	if (this.views[this.currentView].jsClass === undefined) return;
	if (this.views[this.currentView].jsClass.pause !== undefined) {
	    this.views[this.currentView].jsClass.pause();
	}
    },
    setBgView: function(viewName) {
	if (this.views[viewName] === undefined) {
	    window.alert("Error:\nTrying to open an undefined view in background: " + viewName);
	}
	
	if (!this.views[viewName].overlay) {
	    this.hideAll();
	    this.makeVisible(this.currentView);
	}

	this.makeVisible(viewName);
	if (this.views[viewName].jsClass.show !== undefined) {
	    window.console.log("Calling show on background View: " + viewName);
	    this.views[viewName].jsClass.show();
	}
	this.bgView = viewName;
    },
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
	ViewMaster.registerView("firstuse","FirstUse",FirstUse, true);
	ViewMaster.show("menu");

	app.setFontSize();

	/* document.addEventListener("mousemove",
            function(event) {
                document.getElementById("WelcomeVeil").style.top=event.y+"px";
		document.getElementById("WelcomeVeil").style.left=event.x+"px";
	    }
        ); */
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
	localStorage.setItem("fontReSize", elements[0].style.fontSize);
    },
    incFontSizeOne: function(element,size) {
	if (size === undefined) {
	    size = element.style.fontSize;
	}
	size = parseInt(size);
	newsize = (size + 2);
	console.log("setting to fontsize " + newsize);

	element.style.fontSize=newsize + "px";
    },
    decFontSize: function(size) {
	var elements = document.getElementsByClassName("fontResize"),
	    i;
	for (i = 0; i<elements.length; i++) {
	    app.decFontSizeOne(elements[i],size);
	}
	localStorage.setItem("fontReSize", elements[0].style.fontSize);
    },
    setFontSize: function() {
	var elements = document.getElementsByClassName("fontResize"),
	    i,
	    size = localStorage.getItem("fontReSize");
	if (!size) {
	    size="12px";
	}
	for (i = 0; i<elements.length; i++) {
	    console.log("setting fontSize for " + elements[i].id + " to " + size);
	    elements[i].style.fontSize = size;
	}
    },
    decFontSizeOne: function(element,size) {
	if (size === undefined) {
	    size = element.style.fontSize;
	}
	size = parseInt(size);

	newsize = (size - 2);
	if (newsize < 10) {
	    newsize = 10;
	}
	
	element.style.fontSize = newsize + "px";
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
	window.console.log("Number of words: " + app.words[5].length);
	trainingView.updateBoxes();

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
	window.console.log("Starting Session");
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


FirstUse = {
    state: "welcome",
    backgroundView: {
	welcome: "menu",
    },
    init: function() {
	document.getElementById("WelcomeSkip").innherHTML = loc_string.welcome_skip_caption;
    },
    show: function() {
	state: "welcome";
	FirstUse.showState();
    },
    showState: function() {
	document.getElementById("WelcomeMessage").innerHTML = loc_string.welcome_text[FirstUse.state];
	if (ViewMaster.bgView !== FirstUse.backgroundView[FirstUse.state]) {
	    ViewMaster.setBgView(FirstUse.backgroundView[FirstUse.state]);
	}
    },
    nextState: function() {
	switch (FirstUse.state) {
	case "welcomeMessage": FirstUse.state="ListViewExplain"; break;
	default: FirstUse.state="welcome"; break;
	}
	FirstUse.showState();
    }
};

app.initialize();
