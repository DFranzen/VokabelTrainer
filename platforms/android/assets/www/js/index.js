/* Todo-list
 *  - Autodetect separator
 * *** Ideas
 *  - Edit vokabelListen
 *  - picture vokabelListen
 *  - localise
 */

var Dragend = window.Dragend;
var listAPI = window.listAPI;
var dialog = window.dialog;
var cordova = window.cordova;
var editDialog;

var app = {
    swipe: null,
    currentView: "",

    words: [[], [], [], [], []],
    currentBox: 0,
    currentWord: {},

    revisionMode: false,
    revisionBox: [],

    fileNames: [],
    loadingFileIndex: 0,
    divider: ";",

    reverse: false,
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
        document.addEventListener('deviceready', app.onDeviceReady, false);
        
    },

    // deviceready Event Handler
    //
    onDeviceReady: function () {
        'use strict';
        app.activateMenu();
        //get recent files
        // localStorage.
        app.swipe = new Dragend(document.getElementById("swipeArea"), {
            pageClass: "dragend-page",
            direction: "horizontal",
            onSwipeEnd: app.moveSwipe
        });

        document.addEventListener("backbutton", app.backButton_onClick);
        document.addEventListener("pause", app.onPause);
        //orientationchange
        window.addEventListener("orientationchange", app.onRotate);
        document.getElementById("ImageMenu").addEventListener("click", app.ButtonMenu_onClick);

        if (localStorage.getItem('recentFiles') !== null) {
            listAPI.elements = JSON.parse(localStorage.getItem('recentFiles'));
        }
        listAPI.onclick = app.updatePreview;
        listAPI.init();
        
        dialog.init();
        editDialog.init();
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
                while (boxes[i].length === 0 && i < 5) {
                    i = i + 1;
                }
                if (i < 5) {
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
        document.getElementById("prev_question").innerHTML = question;
        app.matchFont("prev_question");

        answer = (app.reverse)
            ? app.preview.word
            : app.preview.translation;
        document.getElementById("prev_answer").innerHTML = answer;
        app.matchFont("prev_answer");
    },
    resetWords: function () {
        'use strict';
        app.words = [[], [], [], [], []];
        app.revisionMode = false;
        app.currentWord = {};
        app.waitingList.init();
        app.revisionBox = [];
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
            lastInsert: 5,
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
            pop: function () {
                var poped;

                if (list.length === 0) {
                    return 5;
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
                        files[word.file] = [[], [], [], [], []];
                    }
                    files[word.file][word.dest].push(word);
                }
            },
            boxToString: function (fileName, boxIndex) {
                var i,
                    result,
                    word;
                
                for (i = 0; i < list.length; i += 1) {
                    word = list[i];
                    if ((word.file === fileName) && (word.dest === i)) {
                        result += word.word + app.divider + word.translation + "\n";
                    }
                }
            }
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
            if ((app.currentBox = app.waitingList.pop()) === 5) {
                window.console.log("No Variables awailable");
                app.activateMenu();
            }
        }
    },
    needNewBox: function () {
        'use strict';
        if (app.revisionMode) {
            window.console.log("Testing revision condition: " + app.words[4].length);
            if (app.words[4].length === 0) {
                window.console.log("Revision is over");
                // Revision is over
                app.deactivateRevision();

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
        var answer;
        
        answer = (app.reverse)
            ? app.currentWord.word
            : app.currentWord.translation;
        document.getElementById("coverDiv").style.visibility = "hidden";
        document.getElementById("answer").innerHTML = answer.replace(",", "<br>");
        document.getElementById("answer").style.color = "#000000";
        document.getElementById("swipeArea").style.overflow = "visible";
        app.matchFont("answer");
        app.swipe.preventScroll = false;
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
        if (document.getElementById("coverDiv").style.visibility === "hidden") {
            app.revealAnswer();
        }
        var question = (!app.reverse)
            ? app.currentWord.word
            : app.currentWord.translation;
        document.getElementById("question").innerHTML = question;
        app.matchFont("question");
            
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
            wordID;
        
        if (app.needNewBox()) {
            app.findNextBox();
        }

        window.console.log("Getting new word");

        wordID = Math.floor(Math.random() * app.words[app.currentBox].length);
        app.currentWord = app.words[app.currentBox][wordID];
        app.words[app.currentBox].splice(wordID, 1);

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
            app.revisionBox.push(app.currentWord);
        } else {
            dest = (app.currentBox < 4)
                ? app.currentBox + 1
                : 4;
            app.waitingList.push(app.currentWord, dest);
        }
        app.findNextWord();
    },
    moveWrong: function () {
        'use strict';
        var dest;
        
        if (app.revisionMode) {
            app.words[0].push(app.currentWord);
        } else {
            dest = (app.currentBox > 0)
                ? app.currentBox - 1
                : 0;
            app.waitingList.push(app.currentWord, dest);
        }
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
    activateMenu: function () {
        'use strict';
        app.activateView("Menu");
    },
    activateRevision: function () {
        'use strict';
        var i;
        window.console.log("Activating Revision");
        app.revisionMode = true;
        app.waitingList.popAll();

        for (i = 1; i <= 3; i = i + 1) {
            document.getElementById("Box" + i + "Div").style.backgroundColor = "#a0a0a0";
        }
    },
    deactivateRevision: function () {
        'use strict';
        var i;
        
        window.console.log("Deactivating Revision");
        app.revisionMode = false;
        app.words[4] = app.words[4].concat(app.revisionBox);
        app.revisionBox = [];
        for (i = 1; i <= 3; i = i + 1) {
            document.getElementById("Box" + i + "Div").style.backgroundColor = "";
        }
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
    updateBoxes: function () {
        'use strict';

        var box = [],
            i;
        
        for (i = 0; i < 5; i = i + 1) {
            box[i] = app.words[i].length;
        }
        app.waitingList.simulatePopAll(box);
        
        if (app.currentWord.word) {
            box[app.currentBox] += 1;
        }

        box[4] += app.revisionBox.length;

        for (i = 0; i < 5; i += 1) {
            document.getElementById("Box" + i).innerHTML = box[i];
            document.getElementById("Box" + i).style.fontWeight = "normal";
            document.getElementById("Box" + i + "Div").style.backgroundColor = "";
            app.matchFont("Box" + i);
        }
        if (app.revisionMode) {
            for (i = 1; i <= 3; i += 1) {
                document.getElementById("Box" + i + "Div").style.backgroundColor = "#a0a0a0";
            }
        }
        document.getElementById("Box" + app.currentBox).style.fontWeight = "bold";
        document.getElementById("Box" + app.currentBox + "Div").style.backgroundColor = "#fcff66";

        if ((!app.revisionMode) && (box[0] + box[1] + box[2] + box[3] === 0)) {
            app.activateRevision();
        }
    },
    writeBoxes: function () {
        'use strict';
        // write back Waiting List
        app.waitingList.popAll();

        // Write back current Word
        app.words[app.currentBox].push(app.currentWord);
        app.currentWord = {};

        app.words[4] = app.words[4].concat(app.revisionBox);
        app.revisionBox = [];
    },
    boxesToString: function (fileName) {
        'use strict';
        var i,
            result = "";
        for (i = 0; i < 4; i += 1) {
            result += app.boxToString(fileName, i);
            result += "-\n";
        }
        result += app.boxToString(fileName, 4);

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

        word = app.currentWord;
        if ((app.currentBox === i) && (word.file === fileName)) {
            result += word.word + app.divider + word.translation + "\n";
        }
        if (i === 4) {
            for (j = 0; j < app.revisionBox.length; j += 1) {
                word = app.revisionBox[j];
                if (word.file === fileName) {
                    result += word.word + app.divider + word.translation + "\n";
                }
            }
        }

        return result;
    },
    loadLection: function (fileName) {
        'use strict';
        var processFile = function (boxes) {
            var j;
            for (j = 0; j < 5; j += 1) {
                app.words[j] = app.words[j].concat(boxes[j]);
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
            window.alert("No files selected");
            return;
        }

        app.processed = 0;
        for (i = 0; i < app.fileNames.length; i += 1) {
            app.loadLection(app.fileNames[i]);
        }

        document.getElementById("LectionID").innerHTML = listAPI.getSelectedToString();
    },
    startSession: function () {
        'use strict';

        app.findNextWord();
        app.activateTraining();
    },
    /* Event handler for the + Button in the List view*/
    ButtonLoad_onClick: function () {
        'use strict';
        window.fileStorage.open(function (uri) {
            window.listAPI.add(uri, true);
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
    sortBoxes: function () {
        'use strict';

        var files = {},
            i,
            j,
            word;

        
        //Boxes
        for (i = 0; i < 5; i += 1) {
            for (j = 0; j < app.words[i].length; j += 1) {
                word = app.words[i][j];
                if (files[word.file] === undefined) {
                    files[word.file] = [[], [], [], [], []];
                }
                files[word.file][i].push(word);
            }
        }
        app.waitingList.sortInto(files);
        //revisionBox
        for (j = 0; j < app.revisionBox.length; j += 1) {
            word = app.revisionBox[j];
            if (files[word.file] === undefined) {
                files[word.file] = [[], [], [], [], []];
            }
            files[word.file][4].push(word);
        }
        //CurrentWord
        if (app.currentWord.file !== undefined) {
            word = app.currentWord;
            if (files[word.file] === undefined) {
                files[word.file] = [[], [], [], [], []];
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
    close: function () {
        'use strict';

	var question = document.getElementById("editQuestionField").value;
	var answer = document.getElementById("editAnswerField").value;
	
        app.currentWord.word = app.reverse ? answer : question;
        app.currentWord.translation = app.reverse ? question : answer;
        app.updateWord();
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
