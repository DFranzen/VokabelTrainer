
/* Todo-list
 * *** Features
 *  - Demo Workthrough / Hilfe
 *  - Lektionen umbennen / duplizieren / erstellen
 *  - Wörter hinzufügen
 *  - Wörter editieren in List view
 *  - Blättern zum nächsten File in List view
 *  - mark / unmark alle files im file view
 *  - #(words) auf der Vorschau
 *  - Optionales Zeitlimit im Wiederholungsmodus
 * *** Bugs
 *  - Message Dialog does not close on back
 *  - Message Dialog shows during startup
 *  - Message Dialog says continue if #(6) = all
 *  - Double click fires sometimes with multiple clicks or swipes
 *  - Font-size after edit
 *  - Check file availability after wake
 *  - Delete leftovers of deleted files to enable readd of broken files
 *  - 
 * *** Ideas
 *  - picture vokabelListen
 *  - localise
 *  - change font-size in file view with volumne rocker
 */

var Dragend = window.Dragend;
var listAPI = window.listAPI;
var dialog = window.dialog;
var cordova = window.cordova;
var editDialog;

var loc_string = {
    revision_start_caption: "Congratulation",
    revision_start_message: "You have learned all your words. Now we start repetition mode",
    revision_end_caption: "Complete",
    revision_end_message: "You have finished your revision. Now practise the words you did not know",
    revision_restart_caption: "Continue Revision",
    revision_restart_message: "Continue to do the revision",
    no_files_selected_caption: "No files selected",
    no_files_selected_message: "First add or select the files you want to practise and then hit the start button"
};

var app = {
    swipe: null,
    currentView: "",

    words: [[], [], [], [], [], []],
    currentBox: 0,
    currentWord: {},
    lastBox: 0,

    revisionMode: false,
//    revisionBox: [],

    fileNames: [],
    loadingFileIndex: 0,
    divider: ";",

    reverse: false,
    vowels: true,
    preview: {},

    fonts: [
        "Arial",
        "serif",
        "sans-serif",
        "Times New Roman",
        "Verdana",
        "Comic sans MS",
        "WildWest",
        "Bedrock",
        "helvetica",
        "Helvetica",
        'HelveticaNeue-Light',
        'HelveticaNeue',
        "Times",
        "Geeza Pro",
        "Nadeem",
        "Al Bayan",
        "DecoType Naskh",
        "DejaVu Serif",
        "STFangsong",
        "STHeiti",
        "STKaiti",
        "STSong",
        "AB AlBayan",
        "AB Geeza",
        "AB Kufi",
        "DecoType Naskh",
        "Aldhabi",
        "Andalus",
        "Sakkal Majalla",
        "Simplified Arabic",
        "Traditional Arabic",
        "Arabic Typesetting",
        "Urdu Typesetting",
        "Droid Naskh",
        "Droid Kufi",
        "Roboto",
        "Tahoma"
    ],
    currentFont: -1,


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

	var elements = [];
	// app starts in ListView
        app.activateMenu();

	// initialise Swipe
        app.swipe = new Dragend(document.getElementById("swipeArea"), {
            pageClass: "dragend-page",
            direction: "horizontal",
            onSwipeEnd: app.moveSwipe
        });

	// listen to Android events
        document.addEventListener("backbutton", app.backButton_onClick);
        document.addEventListener("pause", app.onPause);
        window.addEventListener("orientationchange", app.onRotate);

	// load saved values
        if (localStorage.getItem('recentFiles') !== null) {
            elements =  JSON.parse(localStorage.getItem('recentFiles'));
        }
	if (localStorage.getItem('reverse') !== null) {
	    app.reverse = localStorage.getItem('reverse');
	}
	
	// initialise List view
        listAPI.onclick = app.updatePreview;
        listAPI.init(elements);

	//initialise Dialogs
        dialog.init();
        editDialog.init();
	messageBox.init();
    },
    updatePreview: function (id, toggled) {
        'use strict';
        var showID;
        if (toggled) {
            showID = id;
        } else {
            showID = listAPI.getFirstSelected();
        }
        listAPI.withParsed(
            showID,
            function (boxes) {
                var i = 0;
                while (boxes[i].length === 0 && i < 6) {
                    i = i + 1;
                }
                if (i < 6) {
                    app.preview = boxes[i][0];
                }
                app.showPreview();
            }
        );
    },
    showPreview: function () {
        'use strict';
        
        var answer,
            question;
        
        if (app.preview.word === undefined) {
            return;
        }
        if (app.preview.translation === undefined) {
            return;
        }

        question = (app.reverse)
            ? app.preview.translation
            : app.preview.word;
	if (!app.vowels) question = app.removeVowels(question);
        document.getElementById("prev_question").innerHTML = question;
        app.matchFont("prev_question");

        answer = (app.reverse)
            ? app.preview.word
            : app.preview.translation;
	if (!app.vowels) answer = app.removeVowels(answer);
        document.getElementById("prev_answer").innerHTML = answer;
        app.matchFont("prev_answer");
    },
    resetWords: function () {
        'use strict';
        app.words = [[], [], [], [], [], []];
        app.revisionMode = false;
        app.currentWord = {};
        app.waitingList.init();
//        app.revisionBox = [];
    },
    loadTest: function () {
        'use strict';
        listAPI.add("test", false);
    },
    fontTest: function () {
        'use strict';
        window.alert("Next Font: " + app.fonts[app.currentFont]);
        app.currentFont = app.currentFont + 1;
        if (app.currentFont >= app.fonts.length) {
            app.currentFont = 0;
        }
        document.getElementById("body").style.fontFamily = app.fonts[app.currentFont];
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
             /*boxToString: function (fileName, boxIndex) {
                var i,
                    result,
                    word;
                
                for (i = 0; i < list.length; i += 1) {
                    word = list[i];
                    if ((word.file === fileName) && (word.dest === i)) {
                        result += word.word + app.divider + word.translation + "\n";
                    }
                }
            }*/
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
                app.activateMenu();
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
		window.setTimeout(function(){app.hideUndo();},3);
		
                return true;
            } else {
                return false;
            }
        }
        // Outside revision mode recently asked words are managed via Waitinglist
        return true;
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
        app.swipe.preventScroll = false;
	app.hideUndo();
        app.activateButtonCorrect();
        app.activateButtonWrong();
    },
    hideAnswer: function () {
        'use strict';
        document.getElementById("answer").innerHTML = "";
        document.getElementById("swipeArea").style.overflow = "hidden";
        document.getElementById("cover").innerHTML = "?";
        app.matchFont("cover");
        document.getElementById("cover").style.color = "#a0a0a0";
        document.getElementById("coverDiv").style.visibility = "visible";
        app.swipe.jumpToPage(2);
        app.swipe.preventScroll = true;
        app.deactivateButtonCorrect();
        app.deactivateButtonWrong();
    },
    /* update the displays for the word and its translation (if already revealed)
     */
    updateWord: function () {
        'use strict';
	if (app.currentWord.word === undefined) return;
        if (document.getElementById("coverDiv").style.visibility === "hidden") {
            app.revealAnswer();
        }
        var question = (!app.reverse)
            ? app.currentWord.word
            : app.currentWord.translation;
	if (!app.vowels) question = app.removeVowels(question);
        document.getElementById("question").innerHTML = question;
        app.matchFont("question");
            
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
    activateButtonCorrect: function () {
        'use strict';
        document.getElementById("ButtonCorrect").disabled = false;
        document.getElementById("ButtonCorrect").style.backgroundColor = "";
        document.getElementById("ImageCorrect").src = "res/tick.png";
    },
    deactivateButtonCorrect: function () {
        'use strict';
        document.getElementById("ButtonCorrect").disabled = true;
        document.getElementById("ButtonCorrect").style.backgroundColor = "#a0a0a0";
        document.getElementById("ImageCorrect").src = "res/tickDeact.png";
    },
    activateButtonWrong: function () {
        'use strict';
        document.getElementById("ButtonWrong").disabled = false;
        document.getElementById("ButtonWrong").style.backgroundColor = "";
        document.getElementById("ImageWrong").src = "res/cross.png";
    },
    deactivateButtonWrong: function () {
        'use strict';
        document.getElementById("ButtonWrong").disabled = true;
        document.getElementById("ButtonWrong").style.backgroundColor = "#a0a0a0";
        document.getElementById("ImageWrong").src = "res/crossDeact.png";
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

        app.hideAnswer();
        app.updateBoxes();
        app.updateWord();
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
	app.showUndoCorrect();
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
	app.showUndoWrong();
        app.findNextWord();
    },
    moveSwipe: function () {
        'use strict';
        if (app.swipe.page === 2) {
            app.moveWrong();
        } else if (app.swipe.page === 0) {
            app.moveCorrect();
        }
    },
    showUndoWrong: function() {
	var wrapper = document.getElementById("UndoDiv");
	wrapper.style.right="auto";
	wrapper.style.left="0px";
	wrapper.style.display = "none";
	wrapper.style.visibility = "visible";
	window.setTimeout(function(){wrapper.style.display="block"},1);
    },
    showUndoCorrect: function () {
	var wrapper = document.getElementById("UndoDiv");
	wrapper.style.left="auto";
	wrapper.style.right="0px";
	wrapper.style.display = "none";
	wrapper.style.visibility = "visible";
	window.setTimeout(function(){wrapper.style.display="block"},1);
    },
    hideUndo: function() {
	document.getElementById("UndoDiv").style.display="none";	
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
	app.revealAnswer();
	app.updateWord();
	app.updateBoxes();
	app.hideUndo();
    },
    activateMenu: function () {
        'use strict';
        app.activateView("Menu");
    },
    activateRevision: function () {
        'use strict';

        window.console.log("Activating Revision");
        app.revisionMode = true;
	app.currentBox = 5; //This is revision
        app.waitingList.popAll();

	app.words[5] = app.words[5].concat(app.words[4]);
	app.words[4] = [];
	app.updateBoxes();

	messageBox.show(loc_string.revision_start_caption,loc_string.revision_start_message);
	window.setTimeout(function(){app.hideUndo();},3);
    },
    reactivateRevision: function () {
        'use strict';

        window.console.log("Reactivating Revision");
	app.revisionMode = true;
	app.currentBox = 5; //This is revision
	app.updateBoxes();
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
	app.updateBoxes();
	app.hideUndo();
    },
    showView: function (view) {
        'use strict';

        var divs = document.getElementsByClassName(view),
            div;
        for (div = 0; div < divs.length; div = div + 1) {
            divs[div].style.visibility = "visible";
        }
    },
    hideView: function (view) {
        'use strict';

        var divs = document.getElementsByClassName(view),
            div;
        for (div = 0; div < divs.length; div = div + 1) {
            divs[div].style.visibility = "hidden";
        }
    },
    activateView: function (view) {
        'use strict';

        app.hideView("Training");
        app.hideView("Menu");
        app.hideView("edit");

        app.showView(view);
        app.currentView = view;
    },
    activateTraining: function () {
        'use strict';
        app.activateView("Training");
        app.swipe.jumpToPage(2);
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
    writeBoxes: function () {
        'use strict';
        // write back Waiting List
        app.waitingList.popAll();

        // Write back current Word
	if (app.currentWord.word !== undefined) {
            app.words[app.currentBox].push(app.currentWord);
	    app.currentWord = {};
	}

        //app.words[4] = app.words[4].concat(app.revisionBox);
        //app.revisionBox = [];
    },
    /*boxesToString: function (fileName) {
        'use strict';
        var i,
            result = "";
	//11235
        for (i = 0; i <= 4; i += 1) {
            result += app.boxToString(fileName, i);
            result += "-\n";
        }
        result += app.boxToString(fileName,5);

        return result;
    },
    boxToString: function (fileName, i) {
        'use strict';

        var j,
            word,
            result = "";
        for (j = 0; j < app.words[i].length; j += 1) {
            word = app.words[i][j];
            if (word.file === fileName) {
                result += word.word + app.divider + word.translation + "\n";
            }
        }
        result += app.waitingList.boxToString(fileName, i);

	if (app.currentWord.word !== undefined) {
            word = app.currentWord;
            if ((app.currentBox === i) && (word.file === fileName)) {
		result += word.word + app.divider + word.translation + "\n";
            }
	}

        return result;
    },*/
    loadLession: function (fileName) {
        'use strict';
        var processFile = function (boxes) {
            var j;
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
    ButtonStart_onClick: function () {
        'use strict';
        var i;
        
        app.fileNames = listAPI.getSelected();
        app.resetWords();

        if (app.fileNames.length === 0) {
	    messageBox.show(loc_string.no_files_selected_caption,loc_string.no_files_selected_message);
            return;
        }

	app.revisionMode = true; //assume revision mode, correct, if one of the files cannot be in revision Mode
	
        app.processed = 0;
        for (i = 0; i < app.fileNames.length; i += 1) {
            app.loadLession(app.fileNames[i]);
        }

        document.getElementById("LectionID").innerHTML = listAPI.getSelectedToString();
    },
    startSession: function () {
        'use strict';
	app.currentWord = {};
	app.activateTraining();

	if (!app.revisionMode) {
	    app.deactivateRevision();
	} else if (app.words[5].length === 0) {
	    app.activateRevision();
	} else {
	    app.reactivateRevision();
	}
        app.findNextWord();
    },
    /* Event handler for the + Button in the List view*/
    ButtonLoad_onClick: function () {
        'use strict';
        window.fileStorage.open(function (uri) {
            window.listAPI.add(uri, true);
	    app.updatePreview(0,false);
        }, function (error) {
	    if (error !== 0) {
		window.alert("Error Opening file: " + error);
	    }
        });
            
        /*    var filePath = uri.filepath,
                fileName = filePath.substr(filePath.lastIndexOf('/') + 1);
            listAPI.add(fileName, filePath, true);
            //app.fileNames = [uri.filepath];
        });*/
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
    ButtonCorrect_onClick: function () {
        'use strict';
        app.moveCorrect();
    },
    ButtonWrong_onClick: function () {
        'use strict';
        app.moveWrong();
    },
    ButtonMenu_onClick: function (event) {
        'use strict';
        app.writeBoxes();
        app.store_back();
        listAPI.show();
        app.activateMenu();
        event.stopPropagation();
    },
    preview_onClick: function () {
        'use strict';
        app.reverse = !app.reverse;
        localStorage.setItem('reverse',app.reverse);	
        app.showPreview();
    },
    backButton_onClick: function () {
        'use strict';
        switch (app.currentView) {
        case "Training":
            app.ButtonMenu_onClick();
            break;
        case "Menu":
            navigator.app.exitApp();
            break;
        default:
            window.alert("No back behaviour defined for view " + app.currentView);
        }
    },
    onPause: function () {
        'use strict';
        switch (app.currentView) {
        case "Training":
            app.ButtonMenu_onClick();
            break;
        case "Menu":
            break;
        default:
            window.alert("No pause behaviour defined for view " + app.currentView);
        }
    }
};

messageBox = {
    init: function () {
	messageBox.hide();
	document.getElementById("MessageBox").addEventListener("click",messageBox.hide);
    },
    hide: function () {
	document.getElementById("MessageBox").style.visibility = "hidden";
    },
    show: function (caption,body) {
	if (caption !== undefined) {
	    document.getElementById("MessageCaption").innerHTML = caption;
	}
	if (body !== undefined) {
	    document.getElementById("MessageBody").innerHTML = body;
	}
	document.getElementById("MessageBox").style.visibility = "visible";
    }
}

editDialog = {
    init: function () {
        'use strict';
        editDialog.activateLongpress(document.getElementById("questionDiv"));
        document.getElementById("questionDiv").addEventListener("dblclick", function () {
            editDialog.show();
        });
    },
    show: function () {
        'use strict';
        var answer;

        app.revealAnswer();
        app.showView("edit");
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
        app.updateWord();
	editDialog.close();
    },
    close: function () {
	app.hideView("edit");
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
