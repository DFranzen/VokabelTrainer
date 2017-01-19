var app;
var FileReader;
var listAPI;
var dialog;


var longpress = false;
var presstimer = null;
var longtarget = null;

var cancel = function (e) {
    'use strict';
    if (presstimer !== null) {
        clearTimeout(presstimer);
        presstimer = null;
    }

    this.classList.remove("longpress");
};

var click = function (e) {
    'use strict';
    if (presstimer !== null) {
        clearTimeout(presstimer);
        presstimer = null;
    }

    this.classList.remove("longpress");

    if (longpress) {
        return false;
    }
};

var start = function (id) {
    'use strict';
    return function (e) {
        window.console.log(e);

        if (e.type === "click" && e.button !== 0) {
            return;
        }

        longpress = false;

        this.classList.add("longpress");

        presstimer = setTimeout(function () {
            presstimer = null;
            listAPI.onlongclick(id);
            longpress = true;
        }, 700);

        return false;
    };
};


function activateLongpress(node, id) {
    'use strict';
    //    node.addEventListener("mousedown", start(id));
    node.addEventListener("touchstart", start(id));
    node.addEventListener("click", click);
    //    node.addEventListener("mouseout", cancel);
    node.addEventListener("touchend", cancel);
    node.addEventListener("touchleave", cancel);
    node.addEventListener("touchcancel", cancel);
}

var listAPI = {
    elements: [],
    data: {},
    parsed: {},
    divider: {},
    lastClicked: "",
    /* Initialises the API */
    init: function () {
        'use strict';
        listAPI.untoggleAll();
        listAPI.show();
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
            result = [[], [], [], [], []],
            word;
        for (i = 0; i < 5; i += 1) {
            for (j = 0; j < boxes[i].length; j += 1) {
                word = boxes[i][j];
                result[i].push({word: word.translation, translation: word.word, file: word.file});
            }
        }
        return result;
    },
    /* resets all words to level 0 in the fiven boxes */
    reset: function (boxes) {
        'use strict';
        var i, j,
            result = [[], [], [], [], []],
            word;
        for (i = 0; i < 5; i += 1) {
            for (j = 0; j < boxes[i].length; j += 1) {
                word = boxes[i][j];
                result[0].push(word);
            }
        }
        return result;
    },
    /* converts a String line into a word object */
    parseWord: function (line) {
        'use strict';
        var pair = line.split(app.divider);
        if (pair.length === 2) {
            window.console.log("Read: word: " + pair[0] + ",translation: " + pair[1]);
            return {word: pair[0].trim(), translation: pair[1].trim()};
        } else {
            window.console.log("Read error processing preview " + line);
            return {};
        }
    },
    /* converts the contents of a file into boxes
     *  data: contents of the file
     *  fileName: fileName to be added to all parsed words
     *  returns: array of boxes
     */
    parseFile: function (fileName, data) {
        'use strict';
        var back = [ [], [], [], [], [] ],
            box = 0,
            i,
            lines = data.split("\n"),
            newWord;

        for (i = 0; i < lines.length; i += 1) {
            if (lines[i].trim() === "-") {
                box = (box >= 4)
                    ? 4
                    : box + 1;
            } else {
                newWord = listAPI.parseWord(lines[i]);
                newWord.file = fileName;
                if (newWord.word !== undefined) {
                    back[box].push(newWord);
                }
            }
        }
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
    /* passes one line containing a word from an element to the callback function, loads the file if necessary
     *   id: id of the element to be previewed, might be uri or index of the element
     *   ready: callback to be passed the preview line
     *          ready: function (line)
     *   return: None
     */
    withPreview: function (fileName, ready) {
        'use strict';

        var selectPreview = function (data) {
            var i = 0,
                lines = data.split("\n");
            while (lines[i].trim() === "-") {
                i += 1;
            }
            ready(lines[i]);
        };
        this.withData(fileName, selectPreview);
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
            ready_data;
        if (typeof fileName === "number") {
            fileName = listAPI.elements[fileName].value;
        }

        if (listAPI.parsed[fileName] === undefined) {
            ready_data = function (data) {
                listAPI.parsed[fileName] = listAPI.parseFile(fileName, data);
                listAPI.divider[fileName] = ";";
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
            listAPI.data[fileName] = "عين / عيون" + app.divider + "Auge" + "\n-\n" + "كلمة" + app.divider + "word\n"
                + "حُمّى" + app.divider + "Fieber\nبوْل" + app.divider + "Urin\nعمود فقري" + app.divider + "Wirbelsäule\nصدر / صدور" + app.divider + "Brust\nعضو / أعضاء" + app.divider + "Körperteil, Organ\nشفه / شفاه" + app.divider + "Lippe\nعُنُق / أعناق" + app.divider + "Hals";
            ready(listAPI.data[fileName]);
        } else {
            window.fileChooser.readFromUri(function (data) {
                listAPI.data[fileName] = data;
                ready(listAPI.data[fileName]);
            }, function (error) {
                window.alert("Error while reading file: " + error);
            }, fileName);
        }
        return;
    },
    /* forces all data for an element to be reloaded */
    forceReload: function (element) {
        'use strict';
        delete listAPI.data[element];
        delete listAPI.parsed[element];
        listAPI.show();
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

        window.fileChooser.writeToUri(function () {}, function (error) {window.alert("Error while writing to file, Progress might get lost"); }, fileName, data);
        
        listAPI.show();
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
            caption = (uri === "test")
                ? "test 123456789"
                : this.getFileName(uri),
            i,
            used = Date.now();

        for (i = 0; i < this.elements.length; i += 1) {
            if (this.elements[i].value === uri) {
                added = this.elements[i].added;
                used = this.elements[i].used;
                this.remove(i);
            }
        }
        this.elements.unshift({caption: caption, value: uri, selected: selected, added: added, used: used});
        localStorage.setItem("recentFiles", JSON.stringify(listAPI.elements));
        this.show();
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
        this.show();
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
    show: function () {
        'use strict';
        document.getElementById("listRecent").innerHTML = "";
        this.elements.forEach(this.htmlAdd);
    },
    htmlAdd: function (element, id) {
        'use strict';
        var caption = document.createElement("div"),
            classname,
            listElement = document.createElement("div"),
            status  = document.createElement("div"),
            statusPercent = document.createElement("div");

        caption.innerHTML = element.caption;
        caption.className = "listCaption";

        status.className = "listStatusIcon";
        statusPercent.className = "listStatusPercent";

        listElement.appendChild(status);
        listElement.appendChild(statusPercent);
        listElement.appendChild(caption);

        classname = "listElement";
        if ((id % 2) === 1) {
            classname += " listElementEven";
        }
        if (element.selected) {
            if (id % 2 === 1) {
                classname += " listElementSelected";
            } else {
                classname += " listElementEvenSelected";
            }
        }
        listElement.className = classname;
        listElement.onclick = function () {
            listAPI.clickHandler(id);
        };

        activateLongpress(listElement, id);
        listElement.addEventListener("dblclick", function () {
            listAPI.onlongclick(id);
        });

        document.getElementById("listRecent").appendChild(listElement);

        listAPI.withParsed(element.value, function (boxes) {
            listAPI.showProgress(boxes, status, statusPercent);
        });
    },
    showProgress: function (boxes, iconNode, percentNode) {
        'use strict';
        iconNode.innerHTML = "";
        var color = ["#e0a8a8", "#e0c4a8", "#e0dfa8", "#cde0a8", "#b7e0a8"],
            div,
            i,
            progress = 0,
            total = 0;

        for (i = 0; i < 5; i += 1) {
            div = document.createElement("div");
            div.className = "listStatusLayer";
            div.style.backgroundColor = color[i];
            div.style.flexGrow = boxes[i].length;

            iconNode.appendChild(div);

            progress += boxes[i].length * i * 25;
            total += boxes[i].length;
        }

        percentNode.innerHTML = Math.floor(progress / total) + "%";
        //	    node.innerHTML = boxes[0].length;
        //	    node.style.backgroundColor = color[0];
    },
    showCount: function (boxes, node) {
        'use strict';
        node.innerHTML = boxes[0].length + boxes[1].length + boxes[2].length + boxes[3].length + boxes[4].length;
    },
    clickHandler: function (id) {
        'use strict';
        listAPI.toggle(id);
        listAPI.show();

        listAPI.onclick(id, listAPI.elements[listAPI.getId(id)].selected);
    },
    showDialog: function (id) {
        'use strict';

    },
    onclick: function (id) {
        'use strict';

    },
    onlongclick: function (id) {
        'use strict';
        dialog.show(id);
    }
};
	

dialog = {
    init: function () {
        'use strict';
        document.getElementById("InfoChooser").onclick = function () {
            dialog.showTab("InfoContent", "InfoChooser");
        };
        document.getElementById("OptionChooser").onclick = function () {
            dialog.showTab("OptionContent", "OptionChooser");
        };
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
    show: function (id) {
        'use strict';

        var divs,
            fontSize = 200,
            i;

        document.getElementById("dialogHeader").innerHTML = listAPI.elements[id].caption;
        document.getElementById("dialogHeader").style.lineHeight = "2em";
        document.getElementById("dialogHeader").style.fontSize = "200%";
        while (document.getElementById("dialogHeader").scrollHeight > document.getElementById("dialogHeader").offsetHeight) {
            fontSize -= 10;
            document.getElementById("dialogHeader").style.fontSize = fontSize + "%";
        }
        document.getElementById("dialogHeader").style.lineHeight = 2 / fontSize * 200 + "em";


        document.getElementById("dialogFullPath").innerHTML = listAPI.elements[id].value;
        document.getElementById("dialogAdded").innerHTML = listAPI.getAdded(id);
        document.getElementById("dialogUsed").innerHTML = listAPI.getUsed(id);
        listAPI.withParsed(listAPI.elements[id].value, function (boxes) {
            listAPI.showProgress(
                boxes,
                document.getElementById("dialogProgress"),
                document.getElementById("dialogProgressPercent")
            );
        });
        listAPI.withParsed(listAPI.elements[id].value, function (boxes) {
            listAPI.showCount(boxes, document.getElementById("dialogCount"));
        });

        document.getElementById("dialogBack").onclick = dialog.hide;
        document.getElementById("veil").onclick = dialog.hide;
        document.getElementById("dialog").onclick = function (event) {
            event.stopPropagation();
        };

        document.getElementById("dialogRemove").onclick = function () {
            var confText,
                response;
            confText = "Do you really want to remove the file " + listAPI.elements[id].caption + " from the list of word-files?\nThe file itself and the progress will remain on the storage and can be re-added later.";
            response = window.confirm(confText);

            if (response) {
                dialog.hide();
                listAPI.remove(id);
            }
        };
        document.getElementById("dialogRevert").onclick = function () {
            var confText,
                response;

            confText = "Do you really want to swap all words with their translation in the file " + listAPI.elements[id].caption + "?";
            response = window.conirm(confText);
            if (response) {
                listAPI.withParsed(listAPI.elements[id].value, function (boxes) {
                    listAPI.writeParsed(listAPI.elements[id].value, listAPI.revert(boxes));
                    app.updatePreview(id, listAPI.elements[id].selected);
                });
            }
        };
        document.getElementById("dialogReset").onclick = function () {
            var confText,
                response;
            confText = "Do you really want to reset the progress in the file " + listAPI.elements[id].caption + " to 0% ?";
            response = window.confirm(confText);
            if (response) {
                listAPI.withParsed(listAPI.elements[id].value, function (boxes) {
                    listAPI.writeParsed(listAPI.elements[id].value, listAPI.reset(boxes));
                    listAPI.show();
                });
            }
        };

        divs = document.getElementsByClassName("Details");
        for (i = 0; i < divs.length; i += 1) {
            divs[i].style.visibility = "inherit";
        }
        dialog.showTab("InfoContent", "InfoChooser");
    }
};