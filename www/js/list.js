var app;
var FileReader;
var listAPI;
var dialog;
var menu;

menu = {
    preview: {},
    previewCount: 0,
    count:0,
    sort: "",
    init: function() {
    	document.getElementById("InputSearch"). addEventListener("keyup",menu.InputSearch_onKeyUp);
	document.getElementById("ButtonSearch").addEventListener("click",menu.ButtonSearch_onClick);
	document.getElementById("ButtonVowel"). addEventListener("click",menu.ButtonVowel_onClick);
	document.getElementById("ButtonSort").  addEventListener("click",menu.ButtonSort_onClick);
    },
    show: function () {
        'use strict';
        document.getElementById("listRecent").innerHTML = "";
	menu.count=0;
	this.showSortButton();
        listAPI.elements.forEach(this.htmlAdd);
	this.htmlBGColor();
	this.previewCount = 0;
	listAPI.elements.forEach(this.countWords);
	this.showPreview();
    },
    /* Event handler for the + Button in the List view*/
    ButtonLoad_onClick: function () {
        'use strict';
        window.fileStorage.open(function (uri) {
            window.listAPI.add(uri, true);
	    menu.updatePreview(0,false);
	    menu.show();
        }, function (error) {
	    if (error !== 0) {
		window.alert("Error Opening file: " + error);
	    }
        });
            
    },
    preview_onClick: function () {
        'use strict';
        app.reverse = !app.reverse;
        localStorage.setItem('reverse',app.reverse);	
        menu.showPreview();
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
    ButtonSort_onClick: function() {
	menu.toggleSort();
	event.stopPropagation();
    },
    ButtonVowel_onClick: function() {
	menu.toggleVowel();
	event.stopPropagation();
    },
    ButtonSearch_onClick: function() {
	menu.toggleSearch();
	//document.getElementById("InputSearch").style.visibility = "visible";
    },
    InputSearch_onKeyUp: function() {
	window.console.log("Keyup on searchbar");
	menu.show();
    },
    /* updates the Preview window after an entry in the list has been toggled
     * id: id of the toggled list entry
     * toggled: true if toggled to on, false if toggled to off
     */
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
                    menu.preview = boxes[i][0];
                }
                menu.showPreview();
            }
        );
    },
    showPreview: function () {
        'use strict';
        
        var answer,
            question;
        
        if (this.preview.word === undefined) {
            return;
        }
        if (this.preview.translation === undefined) {
            return;
        }

        question = (app.reverse)
            ? menu.preview.translation
            : menu.preview.word;
	if (!app.vowels) question = app.removeVowels(question);
        document.getElementById("prev_question").innerHTML = question;
        app.matchFont("prev_question");

        answer = (app.reverse)
            ? menu.preview.word
            : menu.preview.translation;
	if (!app.vowels) answer = app.removeVowels(answer);
        document.getElementById("prev_answer").innerHTML = answer;
        app.matchFont("prev_answer");
	document.getElementById("NumWords").innerHTML = menu.previewCount;
    },
    countWords: function(element,id) {
	console.log("counting: " + element.value );
	if (element.selected) {
	    listAPI.withParsed(
		id,
		function(boxes) {
		    var i;
		    for (i=0;i<boxes.length;i++) {
			menu.previewCount += boxes[i].length;
		    }
		}
	    );
	}
    },
    toggleSearch: function() {
	var inputSearch = document.getElementById("InputSearch");
	if (inputSearch.style.visibility === "inherit") {
	    inputSearch.style.visibility = "hidden";
	} else {
	    inputSearch.style.visibility = "inherit";
	    inputSearch.select();
	}
    },
    htmlBGColor: function() {
	var list = document.getElementById("listRecent").children,
	    i;

	for (i = 0; i < list.length; i++) {
	    if ((i % 2) === 1) {
		list[i].classList.add("listElementEven");
	    }
	}
    },
    htmlAdd: function (element, id) {
        'use strict';
        var caption = document.createElement("div"),
            classname,
            listElement = document.createElement("div"),
            status  = document.createElement("div"),
            statusPercent = document.createElement("div"),
	    fileName,
	    list,
	    childid,
	    childbefore;


	fileName = element.value;

        caption.innerHTML = element.caption;
        caption.className = "listCaption";
	if (listAPI.notAvail[fileName]) {
	    caption.classList.add("listCaptionNA");
	}

        status.className = "listStatusIcon";
        statusPercent.className = "listStatusPercent";

        listElement.appendChild(status);
        listElement.appendChild(statusPercent);
        listElement.appendChild(caption);

        classname = "listElement";
	if (element.selected) {
            classname += " listElementSelected";
	}
        listElement.className = classname;
	listElement.id="listElement"+menu.count;
	menu.count ++;
        listElement.onclick = function () {
            menu.clickHandler(id);
        };

        dialog.activateLongpress(listElement, id);
	if (!navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
	    window.console.log("Setting dblClick for " + id + ": " + listElement.innerHTML);
            listElement.addEventListener("dblclick", function (e) {
		menu.onlongclick(id,listElement);
            });
	}
	listElement.addEventListener("longclick", function () {  //Just to be able to trigger it programmatically
	    menu.onlongclick(id,listElement);
        });
	    

	list = document.getElementById("listRecent");

	childid = list.children.length; // default is to insert at the end

	if (menu.sort === "alphanum") {
	    childid = 0;
	    while ( (childid < list.children.length) &&
		    (list.children[childid].children[2].innerHTML.toLowerCase() < element.caption.toLowerCase()) ) {
		childid ++
	    }
	} else if (menu.sort ==="munahpla") {
	    childid = 0;
	    while ( (childid < list.children.length) &&
		    (list.children[childid].children[2].innerHTML >= element.caption) ) {
		childid ++
	    }
	}
	
	if ( childid < list.children.length ) {
	    list.insertBefore(listElement,list.children[childid]);
	} else {
	    list.appendChild(listElement);
	}

        listAPI.withParsed(element.value, function (boxes) {
            menu.showProgress(boxes, status, statusPercent);
        });
	
	listAPI.withParsed(element.value, function(boxes) {
	    var inputSearch = document.getElementById("InputSearch");
	    var searchTerm = inputSearch.value;
	    if (inputSearch.value !== "") {
		if (!listAPI.findInOne(boxes,searchTerm)) {
		    listElement.classList.add("listElementDisabled");
		}
	    }
	});
    },

    showSortButton: function() {
	if (menu.sort === "alphanum") {
	    document.getElementById("ButtonSort").src="res/a2z.png";
	} else if (menu.sort === "munahpla") {
	    document.getElementById("ButtonSort").src="res/z2a.png";
	} else {
	    document.getElementById("ButtonSort").src="res/recent.png";
	}
    },
    toggleSort: function() {
	if (menu.sort === "alphanum") {
	    menu.sort = "munahpla";
	} else if (menu.sort === "munahpla") {
	    menu.sort = "recent";
	} else {
	    menu.sort = "alphanum";
	}
	menu.show();
    },
    toggleVowel: function() {
	'use strict';
	var src;
	
	app.vowels = !app.vowels;
	src = (app.vowels) ? "res/vowels.png" : "res/novowels.png";
	document.getElementById("ButtonVowel").src = src;
	menu.showPreview();
    },
    showProgress: function (boxes, iconNode, percentNode) {
        'use strict';
        iconNode.innerHTML = "";
        var color = ["#e0a8a8", "#e0c4a8", "#e0dfa8", "#cde0a8", "#b7e0a8", "#b7e0a8"],
            div,
            i,
            progress = 0,
            total = 0;

        for (i = 0; i <= 5; i += 1) {
            div = document.createElement("div");
            div.className = "listStatusLayer";
            div.style.backgroundColor = color[i];
            div.style.flexGrow = boxes[i].length;

            iconNode.appendChild(div);

            progress += boxes[i].length * Math.min(i,4) * 25;
            total += boxes[i].length;
        }

	if (total !== 0) {
            percentNode.innerHTML = Math.floor(progress / total) + "%";
	    percentNode.classList.remove("listStatusPercentWarn");
	} else {
	    percentNode.innerHTML = "!";
	    percentNode.classList.add("listStatusPercentWarn");
	    percentNode.parentNode.style.color = "grey";
	}
    },
    clickHandler: function (id) {
        'use strict';
        listAPI.toggle(id);
        menu.show();

	menu.updatePreview(id, listAPI.elements[listAPI.getId(id)].selected);
    },
    onlongclick: function (id,htmlElement) {
        'use strict';
	window.console.log("Executing longclick for " + id + ": " + htmlElement.innerHTML);

        dialog.show(id,htmlElement);
    },

}

listAPI = {
    elements: [],
    data: {},
    parsed: {},
    divider: {},
    notAvail: {},

    /* Initialises the API */
    init: function () {
        'use strict';
	if (localStorage.getItem('recentFiles') !== null) {
            listAPI.elements =  JSON.parse(localStorage.getItem('recentFiles'));
        } else {
	    this.elements = [];
	}
	
        listAPI.untoggleAll();
	listAPI.notAvail = {};
    },
    /* Returns array of all Selected URIs */
    getSelected: function () {
        'use strict';
        var back = [],
            i;
        for (i = 0; i < this.elements.length; i += 1) {
            if (this.elements[i].selected) {
                back.push(this.elements[i].value);
            }
        }
        return back;
    },
    /* Returns a String containing all selected Lection captions*/
    getSelectedToString: function () {
        'use strict';
        var back = "",
            i;
        for (i = 0; i < this.elements.length; i += 1) {
            if (this.elements[i].selected) {
                back += this.elements[i].caption + ",";
            }
        }
        return back;
    },
    /* Returns index of top-most selected element */
    getFirstSelected: function () {
        'use strict';
        var i;
        for (i = 0; i < this.elements.length; i += 1) {
            if (this.elements[i].selected) {
                return i;
            }
        }
        return 0;
    },
    /* returns a String containing the Date and Time this element was added to the list */
    getAdded: function (element) {
        'use strict';
        var d,
            id = this.getId(element);
        if (id < 0) {
            return "Not available";
        }

        if (this.elements[id].added === undefined) {
            return "Not available";
        }
        d = new Date(this.elements[id].added);
        return d.toLocaleDateString() + " " + d.toLocaleTimeString();
    },
    /* returns a String containing the Date and Time this element was last used */
    getUsed: function (element) {
        'use strict';
        var d,
            id = this.getId(element);
        if (id < 0) {
            return "Not available";
        }

        if (this.elements[id].used === undefined) {
            return "Not available";
        }
        d = new Date(this.elements[id].used);
        return d.toLocaleDateString() + " " + d.toLocaleTimeString();
    },
    /* swapps the answer and question for all words in the given boxes */
    revert: function (boxes) {
        'use strict';
        var i, j,
            result = [[], [], [], [], [], []],
            word;
        for (i = 0; i <= 5; i += 1) {
            for (j = 0; j < boxes[i].length; j += 1) {
                word = boxes[i][j];
                result[i].push({word: word.translation, translation: word.word, file: word.file});
            }
        }
        return result;
    },
    /* resets all words to level 0 in the given boxes */
    reset: function (boxes) {
        'use strict';
        var i, j,
            result = [[], [], [], [], [],[]],
            word;
        for (i = 0; i <= 5; i += 1) {
            for (j = 0; j < boxes[i].length; j += 1) {
                word = boxes[i][j];
                result[0].push(word);
            }
        }
        return result;
    },
    /* converts a String line into a word object */
    parseWord: function (line,divider) {
        'use strict';
        var pair = line.split(divider);
        if (pair.length === 2) {
            window.console.log("Read: word: " + pair[0] + ",translation: " + pair[1]);
            return {word: pair[0].trim(), translation: pair[1].trim()};
        } else {
            window.console.log("Read error processing preview " + line);
            return {};
        }
    },
    getDivider: function (lines) {
	'use strict';
	var candidates = [],
	    word = "",
	    letters = [],
	    letter,
	    i,j,
	    init = true,
	    length,min,
	    divider = ";"; //default

	for (i = 0; i<lines.length; i += 1) {
	    word = lines[i];
	    //window.alert("searching in " + word);
	    letters = [];
	    if ( (word.length <=2) ) continue;
	    for (j = 0; j<word.length; j += 1) {
		letter = word[j];
		if (letter === "\r") continue;
		if (letter === " ") continue;
		if (letter === "\n") continue;
		letters[letter] = (letters[letter] | 0) + 1;
	    }
	    if (init) {
		candidates = letters;
		init = false;
		continue;
	    }
	    length = 0;
	    for (var cand in candidates) {
		//window.alert("considering " + JSON.stringify(cand));
		if (candidates.hasOwnProperty(cand)) {
		    if (letters.hasOwnProperty(cand)) {
			length += 1;
			divider = cand;
			candidates[cand] += letters[cand];
		    } else {
			delete candidates[cand];
		    }
		}
	    }
	    if (length === 1) {
//		window.alert("divider found early " + divider);
		return divider;
	    } else if (length === 0) {
//		window.alert("Just considered " + word);
//		window.alert("No divider found, using " + divider);
		return divider; //from last round
	    }
	}
	min = 0;
	for (var cand in candidates) {
	    if ( (min === 0) || (min > candidates[cand])) {
		min = candidates[cand];
		divider = cand;
	    }
	}
//	window.alert("Found divider" + divider);
	return divider;
    },
    /* converts the contents of a file into boxes
     *  data: contents of the file
     *  fileName: fileName to be added to all parsed words
     *  returns: array of boxes
     */
    parseFile: function (fileName, data) {
        'use strict';
        var back = [ [], [], [], [], [], [] ],
            box = 0,
            i,
            lines = data.split("\n"),
            newWord,
	    divider;

	divider = listAPI.getDivider(lines); 
	
        for (i = 0; i < lines.length; i += 1) {
            if (lines[i].trim() === "-") {
                box = (box >= 5)
                    ? 5
                    : box + 1;
            } else {
                newWord = listAPI.parseWord(lines[i],divider);
                newWord.file = fileName;
		if (newWord.word === undefined) continue;
		if (newWord.word === "") continue;
		if (newWord.translation === undefined) continue;
		if (newWord.translation === "") continue;
		
                back[box].push(newWord);
            }
        }
	back["divider"] = divider;
        return back;
    },
    /* extracts the fileName from a full URL */
    getFileName: function (uri) {
        'use strict';
        var back = window.unescape(uri),
            index = Math.max(back.lastIndexOf(":"), back.lastIndexOf("/"));
            
        back = back.substring(index + 1, back.length);
        
        return back;
    },
    /* passes the raw string loaded from an element to the given callback function, reads file if necessary.
     *   id: id of the element to be read, might be uri or index of element
     *   ready: callback to be passed the raw string
     *          ready: function (string) 
     *   return: None
     */
    withData: function (id, ready) {
        'use strict';
        var fileName = id;
        if (typeof fileName === "number") {
            fileName = listAPI.elements[fileName].value;
        }
        
        if (this.data[fileName] === undefined) {
            this.load(fileName, ready);
        } else {
            ready(this.data[fileName]);
        }
        return;
    },
    /* passes the parsed content from an element to the given callback function. Starts parser if necessary.
     *   id: id of the element to be parsed, mightBe uri or index of element
     *   ready: callback function to be passed the parsed data.
     *          ready: function (array of boxes)
     *   returns: None
     */
    withParsed: function (id, ready) {
        'use strict';
        var fileName = id,
	    parsed,
            ready_data;
        if (typeof fileName === "number") {
            fileName = listAPI.elements[fileName].value;
        }

        if (listAPI.parsed[fileName] === undefined) {
            ready_data = function (data) {
		
		parsed = listAPI.parseFile(fileName, data);
                listAPI.divider[fileName] = parsed["divider"];
		delete parsed["divider"];
		listAPI.parsed[fileName] = parsed;
                ready(listAPI.parsed[fileName]);
            };
            listAPI.withData(fileName, ready_data);
        } else {
            ready(listAPI.parsed[fileName]);
        }
        return;
    },
    /* reads in a file and passes it to the callback function
     *   fileName: uri of a fileName in the list
     *             if this is "test" a test set is passed to the callback function instead
     *   ready: callback function to be passed the raw data after reading
     *          ready: function (multiple line string)
     *   return: None
     */
    load: function (fileName, ready) {
        'use strict';
        var loadFile, loadFileEntry;

        if (fileName === "test") {
            listAPI.data[fileName] = "عين / عيون;Auge" + "\n-\n" +
		"كلمة;word\nحُمّى;Fieber\nبوْل;Urin\nعمود فقري;Wirbelsäule\nصدر / صدور;Brust\nعضو / أعضا" + 
		"ء;Körperteil, Organ\nشفه / شفاه;Lippe\nعُنُق / أعناق;Hals";
            ready(listAPI.data[fileName]);
        } else {
	    if (listAPI.notAvail[fileName] === true) {
		ready("");
	    }
            window.fileStorage.readFromUri(function (data) {
                listAPI.data[fileName] = data;
                ready(listAPI.data[fileName]);
            }, function (error) {
		if (error.includes("ENOENT") || error.includes("Missing file") ) {
		    //window.alert("File " + fileName + "could not be found");
		    listAPI.notAvail[fileName] = true;
		    listAPI.data[fileName] = "";
		    ready("");
		} else {
                    window.alert("Error while reading file: " + error);
		}
            }, fileName);
        }
        return;
    },
    /* forces all data for an element to be reloaded */
    forceReload: function (element) {
        'use strict';
        delete listAPI.data[element];
        delete listAPI.parsed[element];
	delete listAPI.notAvail[element];
    },
    /* convert a box of words into a string, ready to be written to the file
     *   box: array of word objects to be written
     *   divider: character used to seperate question from answer in each line
     *   return: string to be written into file, containing multiple lines
     */
    boxToString: function (box, divider) {
        'use strict';
        var i,
            result = "";
        for (i = 0; i < box.length; i += 1) {
            result += box[i].word + divider + box[i].translation + "\n";
        }
        return result;
    },
    /* convert an array of boxes of words into a string, ready to be written to the file
     *   boxes: array of boxes to be written
     *   divider: character used to seperate question from answer in each line
     *   return: string to be written into file, containing multiple lines
     */
    boxesToString: function (boxes, divider) {
        'use strict';
        var i,
            result = listAPI.boxToString(boxes[0], divider);
        for (i = 1; i < boxes.length; i += 1) {
            result = result + "-\n" + listAPI.boxToString(boxes[i], divider);
        }
        return result;
    },
    writeParsed: function (fileName, boxes) {
        'use strict';
        var data;
        listAPI.parsed[fileName] = boxes;

        data = listAPI.boxesToString(boxes, listAPI.divider[fileName]);
        listAPI.writeData(fileName, data);
    },
    writeData: function (fileName, data) {
        'use strict';

        listAPI.data[fileName] = data;
        if (fileName === "test") {
            return;
        }

        window.fileStorage.writeToUri(function () {}, function (error) {
	    window.alert("Error while writing to file, Progress might get lost");
	}, fileName, data);
    },
    getId: function (element) {
        'use strict';
        var i;
        if (typeof element  === "number") {
            return element;
        }
        i = 0;
        while (i < this.elements.length) {
            if (this.elements[i].value === element) {
                return i;
            }
            i += 1;
        }
        return -1;
    },
    add: function (uri, selected) {
        'use strict';
        var added = Date.now(),
            i,
	    add_helper,
            used = Date.now();

	// Check for re-add!
        for (i = 0; i < this.elements.length; i += 1) {
            if ( (uri !== "test") &&
		 (this.elements[i].value === uri) ) {
                added = this.elements[i].added;
                used = this.elements[i].used;
                this.remove(i);
            }
        }
	
	add_helper = function(name) {
	    listAPI.elements.unshift({caption: name, value: uri, selected: selected, added: added, used: used});
	    localStorage.setItem("recentFiles", JSON.stringify(listAPI.elements));
	}

	
	if (uri === "test") {
	    add_helper("test" + listAPI.elements.length);
	} else {
	    window.fileStorage.getNameFromUri(
		add_helper,
		function(err) {
		    var caption=listAPI.getFileName(uri);
		    window.alert("Error accessing FileName: " + caption);
		    add_helper(caption);
		},
		uri
	    );
	}
    },
    touch: function (element) {
        'use strict';
        var id = listAPI.getId(element);
        if (id < 0) {
            return;
        }

        listAPI.elements[id].used = Date.now();
        listAPI.moveToTop(id);
        localStorage.setItem("recentFiles", JSON.stringify(listAPI.elements));
    },
    remove: function (element) {
        'use strict';
        var id = listAPI.getId(element);
        if (id < 0) {
            return;
        }

        this.elements.splice(id, 1);
        localStorage.setItem("recentFiles", JSON.stringify(listAPI.elements));
        this.forceReload(element);
    },
    moveToTop: function (element) {
        'use strict';
        var id = this.getId(element);
        if (id < 0) {
            return;
        }

        this.elements.splice(0, 0, this.elements.splice(id, 1)[0]);
        localStorage.setItem("recentFiles", JSON.stringify(listAPI.elements));
    },
    toggle: function (element) {
        'use strict';
        var id = this.getId(element);
        if (id < 0) {
            return;
        }
        this.elements[id].selected = !(this.elements[id].selected);
    },
    untoggleAll: function () {
        'use strict';
        var i;
        for (i = 0; i < listAPI.elements.length; i += 1) {
            listAPI.elements[i].selected = false;
        }
    },
    findInOne: function(boxes,searchTerm) {
	var i,j, word, tans;
	searchTerm = app.removeVowels(searchTerm.toLowerCase());
	for (i=0;i<boxes.length;i++) {
	    for (j=0;j<boxes[i].length;j++) {
		word = app.removeVowels(boxes[i][j].word.toLowerCase());
		trans = app.removeVowels(boxes[i][j].translation.toLowerCase());
		if (word.indexOf(searchTerm) != -1) {
		    return true;
		}
		if (trans.indexOf(searchTerm) != -1) {
		    return true;
		}
	    }
	}
	return false;
    },
};
	

dialog = {
    currentTab: "",
    currentTabChooser: "",
    currentShownId: "",
    nextTab: "",
    nextTabChooser: "",
    init: function () {
        'use strict';
        document.getElementById("InfoChooser").onclick = function () {
            dialog.showTab("InfoContent", "InfoChooser");
        };
        document.getElementById("ListChooser").onclick = function () {
            dialog.showTab("ListContent", "ListChooser");
        };
        document.getElementById("OptionChooser").onclick = function () {
            dialog.showTab("OptionContent", "OptionChooser");
        };

	
	
	dialog.hide();
    },
    showTab: function (id, chooserId) {
        'use strict';
        var divs = document.getElementsByClassName("DialogTab"),
            i;
        for (i = 0; i < divs.length; i += 1) {
            divs[i].style.visibility = "hidden";
            divs[i].style.overflow = "hidden";
        }

        divs = document.getElementsByClassName("DialogChooser");
        for (i = 0; i < divs.length; i += 1) {
            divs[i].classList.remove("DialogChooserSelected");
        }

        if (id === "") {
            return;
        }

        document.getElementById(id).style.visibility = "inherit";
        document.getElementById(id).style.overflow = "auto";
        document.getElementById(chooserId).classList.add("DialogChooserSelected");
	dialog.currentTab = id;
	dialog.currentTabChooser = chooserId;
    },
    showNext: function (e) {
	var next = document.getElementById(dialog.currentShownId).nextSibling;
	window.console.log("trying sibling: " + next);	
	
	while ( (next !== null) && (next.classList.contains("listElementDisabled")) ) {
	    next=next.nextSibling;
	    window.console.log("trying sibling: " + next);
	}
	window.console.log("Showing details for " + next);

	if (next !== null) {
	    dialog.nextTab = dialog.currentTab;
	    dialog.nextTabChooser = dialog.currentTabChooser;
	    dialog.hide();
	    next.dispatchEvent(new Event("longclick"));
	}
	e.stopPropagation();
	    
    },
    showPrev: function (e) {
	var next = document.getElementById(dialog.currentShownId).previousSibling;
	
	while ( (next !== null) && (next.classList.contains("listElementDisabled")) ) {
	    window.console.log("trying sibling: " + next);
	    next=next.previousSibling;
	}
	window.console.log("Showing details for " + next);

	if (next !== null) {
	    dialog.nextTab = dialog.currentTab;
	    dialog.nextTabChooser = dialog.currentTabChooser;
	    dialog.hide();
	    next.dispatchEvent(new Event("longclick"));
	}
	e.stopPropagation();
	
    },
    hide: function () {
        'use strict';
        var divs,
            i;
        dialog.showTab("", "");
        divs = document.getElementsByClassName("Details");

        for (i = 0; i < divs.length; i += 1) {
            divs[i].style.visibility = "hidden";
        }
    },
    show: function (id, htmlElement) {
        'use strict';

	window.console.log("Display Details for " + id + ": " + htmlElement.innerHTML);

        var divs,
            fontSize = 200,
            i;

	dialog.currentShownId = htmlElement.id;
	window.console.log("Shown Element has id " + dialog.currentShownId);
	
        document.getElementById("dialogHeader").innerHTML = listAPI.elements[id].caption;
        document.getElementById("dialogHeader").style.lineHeight = "2em";
        document.getElementById("dialogHeader").style.fontSize = "200%";
        while (document.getElementById("dialogHeader").scrollHeight > document.getElementById("dialogHeader").offsetHeight) {
            fontSize -= 10;
            document.getElementById("dialogHeader").style.fontSize = fontSize + "%";
        }
        document.getElementById("dialogHeader").style.lineHeight = 2 / fontSize * 200 + "em";


	var fileName = listAPI.elements[id].value;
        document.getElementById("dialogFullPath").innerHTML = fileName;
	if (listAPI.notAvail[fileName]) {
	    var fileNameMessage = fileName + "<br><p style='color:red'>This file is not available, please add it again</p>";
	    document.getElementById("dialogFullPath").innerHTML = fileNameMessage;
	}
	
        document.getElementById("dialogAdded").innerHTML = listAPI.getAdded(id);
        document.getElementById("dialogUsed").innerHTML = listAPI.getUsed(id);
        listAPI.withParsed(listAPI.elements[id].value, function (boxes) {
            menu.showProgress(
                boxes,
                document.getElementById("dialogProgress"),
                document.getElementById("dialogProgressPercent")
            );
        });
        listAPI.withParsed(listAPI.elements[id].value, function (boxes) {
            dialog.showCount(boxes, document.getElementById("dialogCount"));
        });
	
	listAPI.withParsed(listAPI.elements[id].value, function (boxes) {
	    dialog.showList(boxes, document.getElementById("dialogListDiv"));
	});

        document.getElementById("dialogBack").onclick = dialog.hide;
        document.getElementById("dialogVeil").onclick = dialog.hide;
        document.getElementById("dialog").onclick = function (event) {
            event.stopPropagation();
        };

        document.getElementById("dialogRemove").onclick = function () {
            dialog.hide();
            listAPI.remove(id);
	    menu.show();
        };
        document.getElementById("dialogRevert").onclick = function () {
            listAPI.withParsed(listAPI.elements[id].value, function (boxes) {
                listAPI.writeParsed(listAPI.elements[id].value, listAPI.revert(boxes));
                menu.updatePreview(id, listAPI.elements[id].selected);
            });
        };
        document.getElementById("dialogReset").onclick = function () {
            listAPI.withParsed(listAPI.elements[id].value, function (boxes) {
                listAPI.writeParsed(listAPI.elements[id].value, listAPI.reset(boxes));
                menu.show();
            });
        };

        divs = document.getElementsByClassName("Details");
        for (i = 0; i < divs.length; i += 1) {
            divs[i].style.visibility = "inherit";
        }
	if (dialog.nextTab === "") {
	    dialog.nextTab = "InfoContent";
	    dialog.nextTabChooser = "InfoChooser";
	}
        dialog.showTab(dialog.nextTab, dialog.nextTabChooser);
	dialog.nextTab = "";
	dialog.nextTabChooser = "";
	
	    
    },

    showCount: function (boxes, node) {
        'use strict';
	var i,c = 0;
	for (i = 0; i < boxes.length; i++) {
	    c += boxes[i].length;
	}
        node.innerHTML = c;
    },
    showList: function (boxes, node) {
	'use strict';
	var i,j,count=0,
	    tr,tdw,tdt,
	    bgClass,
	    searchTerm;
	node.innerHTML = "";
	for (i = 0; i < boxes.length; i++) {
	    for (j = 0; j < boxes[i].length; j++) {
		tr = document.createElement("tr");
		tdw = document.createElement("td");
		tdw.innerHTML = boxes[i][j].word;
		tdt = document.createElement("td");
		tdt.innerHTML = boxes[i][j].translation;
		tdw.classList.add("tdRightBorder");
		tdt.classList.add("tdLeftBorder");
		bgClass = ((count % 2) === 0) ? "trEven" : "trOdd";
		tr.classList.add(bgClass);
		searchTerm = app.removeVowels(document.getElementById("InputSearch").value.toLowerCase());
		if ( (searchTerm !== "") &&
		     ( (app.removeVowels(boxes[i][j].word).toLowerCase().indexOf(searchTerm) !== -1) ||
		       (app.removeVowels(boxes[i][j].translation).toLowerCase().indexOf(searchTerm) !== -1)
		     )
		   ) {
		    tr.classList.add("trFound");
		}
		tr.appendChild(tdw);
		tr.appendChild(tdt);
		node.appendChild(tr);
		count++;
	    }
	}
    },

    
    longpress: false,
    presstimer: null,
    longtarget: null,
    longpressCords: null,

    cancel: function (e) {
        'use strict';
        if (dialog.presstimer !== null) {
            clearTimeout(dialog.presstimer);
	    dialog.presstimer = null;
        }

        this.classList.remove("longpress");
    },

    click: function (e) {
        'use strict';
        if (dialog.presstimer !== null) {
            clearTimeout(dialog.presstimer);
            dialog.presstimer = null;
        }

        this.classList.remove("longpress");

        if (dialog.longpress) {
            return false;
        }
    },

    start: function (id,htmlElement) {
        'use strict';
        return function (e) {
            window.console.log(e);
	    window.console.log(htmlElement);

            if (e.type === "click" && e.button !== 0) {
                return;
            }

            dialog.longpress = false;

            this.classList.add("longpress");

            dialog.presstimer = setTimeout(function () {
                dialog.presstimer = null;
                menu.onlongclick(id,htmlElement);
                dialog.longpress = true;
            }, 700);

            return false;
        };
    },

    activateLongpress: function (node, id) {
        'use strict';
	window.console.log("Activating longpress for: " + node);
        node.addEventListener("mousedown", dialog.start(id,node));
        node.addEventListener("touchstart", dialog.start(id,node));
        node.addEventListener("click", dialog.click);
        node.addEventListener("mouseout", dialog.cancel);
        node.addEventListener("touchend", dialog.cancel);
        node.addEventListener("touchleave", dialog.cancel);
        node.addEventListener("touchcancel", dialog.cancel);
	node.addEventListener("touchmove", dialog.cancel);
    }

};
