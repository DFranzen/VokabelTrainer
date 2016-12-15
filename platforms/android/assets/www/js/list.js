var listAPI =
    {
	elements : [],
	data: {},
	parsed: {},
	divider: {},
	lastClicked: "",
	init: function()
	{
	    listAPI.untoggleAll();
	    listAPI.show();
	},
	getSelected: function()
	{
	    var back = [];
	    var i=0;
	    for (;i<this.elements.length;i++)
	    {
		if (this.elements[i].selected)
		{
		    back.push(this.elements[i].value);
		}
	    }
	    return back;
	},
	getSelectedToString: function()
	{
	    var i=0;
	    var back = "";
	    for (;i<this.elements.length;i++)
	    {
		if (this.elements[i].selected)
		{
		    back+=this.elements[i].caption+",";
		}
	    }
	    return back;
	},
	getFirstSelected: function()
	{
	    var i=0;
	    for (;i<this.elements.length;i++)
	    {
		if (this.elements[i].selected) return i;
	    }
	    return 0;
	},
	getAdded: function(element)
	{
	    var id = this.getId(element);
	    if(id<0) return "Not available";
	    
	    if (this.elements[id].added == undefined) return "Not available";
	    var d = new Date(this.elements[id].added);
	    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
	},
	getUsed: function(element)
	{
	    var id = this.getId(element);
	    if(id<0) return "Not available";
	    
	    if (this.elements[id].used == undefined) return "Not available";
	    var d = new Date(this.elements[id].used);
	    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
	},
	revert: function(boxes)
	{
	    var result = [[],[],[],[],[]]
	    var i=0;
	    for (;i<5;i++)
	    {
		var j=0;
		for (;j<boxes[i].length;j++)
		{
		    var word=boxes[i][j];
		    result[i].push({word:word.translation,translation:word.word,file:word.file});
		}
	    }
	    return result;
	},
	reset: function(boxes)
	{
	    var result = [[],[],[],[],[]]
	    var i=0;
	    for (;i<5;i++)
	    {
		var j=0;
		for (;j<boxes[i].length;j++)
		{
		    var word=boxes[i][j];
		    result[0].push(word);
		}
	    }
	    return result;
	},
	parseWord: function(line)
	{
	    var pair=line.split(app.divider);
	    if (pair.length == 2)
	    {
		console.log("Read: word:" + pair[0]+",translation:"+pair[1]);
		return {word:pair[0].trim(),translation:pair[1].trim()};
	    } else {
		console.log("Read error processing preview " + line);
		return {};
	    }
	},
	parseFile: function(fileName,data)
	{
	    var box = 0;
	    var back = [ [],[],[],[],[] ];
	    var i;

	    var lines = data.split("\n");
	    
	    for (i=0;i<lines.length;i++)
	    {
		if (lines[i].trim() == "-")
		{
		    box=(box>=4)?4:box+1;
		} else {
		    var newWord = listAPI.parseWord(lines[i]);
		    newWord.file = fileName;
		    if (newWord.word != undefined)
		    {
			back[box].push(newWord);
		    }
		}
	    }
	    return back;
	},
	ensureParsed: function(fileName,ready)
	{
	    if (listAPI.parsed[fileName] == undefined)
	    {
		var ready_data = function(data)
		{
		    listAPI.parsed[fileName] = listAPI.parseFile(fileName,data);
		    listAPI.divider[fileName] = ";";
		    ready(listAPI.parsed[fileName]);
		}
		listAPI.withData(fileName,ready_data);
	    } else {
		ready(listAPI.parsed[fileName]);
	    }
	},
	ensureData: function(fileName,ready)
	{
	    if (this.data[fileName] == undefined)
	    {
		this.load(fileName,ready)
	    } else {
		ready(this.data[fileName]);
	    }
	},
	withData: function(id,ready)
	{
	    var fileName = id;
	    if (typeof(fileName)=="number")
	    {
		fileName = listAPI.elements[fileName].value;
	    }
	    this.ensureData(fileName,ready);
	},
	withPreview: function(fileName,ready)
	{
	    if (typeof(fileName)=="number") fileName = listAPI.elements[fileName].value;
	    var selectPreview = function(data)
	    {
		var i = 0;
		lines = data.split("\n");
		while (lines[i].trim() == "-") i++;
		ready(lines[i]);
	    }
	    this.ensureData(fileName,selectPreview);
	},
	withParsed: function(id,ready)
	{
	    var fileName = id;
	    if (typeof(fileName) == "number") fileName = listAPI.elements[fileName].value;

	    this.ensureParsed(fileName,ready);
	},
	load: function(fileName,ready)
	{
	    if (fileName == "test")
	    {
		listAPI.data[fileName]= "عين / عيون"+app.divider+"Auge" + "\n-\n" + "كلمة" + app.divider + "word\n"
		    + "حُمّى"+app.divider+"Fieber\nبوْل"+app.divider+"Urin\nعمود فقري"+app.divider+"Wirbelsäule\nصدر / صدور"+app.divider+"Brust\nعضو / أعضاء"+app.divider+"Körperteil, Organ\nشفه / شفاه"+app.divider+"Lippe\nعُنُق / أعناق"+app.divider+"Hals";
;
		ready(listAPI.data[fileName]);
		return;
	    }	
	    var loadFile = function(file)
	    {
		var reader = new FileReader();
		reader.onloadend = function(evt)
		{
		    listAPI.data[fileName]=evt.target.result;
		    ready(listAPI.data[fileName]);
		};
		reader.readAsText(file);
	    }
	    var loadFileEntry = function (fileEntry)
	    {
		fileEntry.file(loadFile,function(){alert("Failed reading FileEntry")})		
	    };
	    window.resolveLocalFileSystemURI
	    (
		  "file://"+fileName
		, loadFileEntry
		, function(){alert("Failed to access FileSystem")}
	    );
	},
	forceReload: function(element)
	{
	    delete listAPI.data[element];
	    delete listAPI.parsed[element];
	    listAPI.show();
	},
	boxToString: function(box,divider)
	{
	    var i=0;
	    result = "";
	    for (;i<box.length;i++)
	    {
		result += box[i].word + divider + box[i].translation + "\n";
	    }
	    return result;
	},
	boxesToString: function(boxes,divider)
	{
	    var result=listAPI.boxToString(boxes[0],divider);
	    var i=1;
	    for(;i<boxes.length;i++)
	    {
		result = result + "-\n" + listAPI.boxToString(boxes[i],divider);
	    }
	    return result;
	},
	writeParsed: function(fileName,boxes)
	{
	    listAPI.parsed[fileName] = boxes;

	    var data = listAPI.boxesToString(boxes,listAPI.divider[fileName]);
	    listAPI.writeData(fileName,data);
	},
	writeData: function(fileName,data)
	{
	    listAPI.data[fileName] = data;
	    if (fileName == "test") return;

	    var writeFileEntry = function (fileEntry)
	    {
		fileEntry.createWriter(function(writer){writer.write(data);});
	    }

	    window.resolveLocalFileSystemURI
	    (
		"file://"+fileName
		,writeFileEntry
		,function(){alert("Failed writing file, Progress might get lost")}
	    );
	    listAPI.show();
	},
	getId : function(element)
	{
	    if (typeof(element) == "number") return element;
	    var i=0;
	    while (i<this.elements.length)
	    {
		if (this.elements[i].value == element) return i;
		i++;
	    }
	    return -1;
	},	
	add : function(caption,value,selected)
	{
	    var added = Date.now();
	    var used = Date.now();
	    var i=0;
	    for(;i<this.elements.length;i++)
	    {
		if (this.elements[i].value == value) {
		    added = this.elements[i].added;
		    used = this.elements[i].used;
		    this.remove(i);
		}
	    }
	    this.elements.unshift({caption:caption,value:value,selected:selected,added:added,used:used});
	    localStorage.setItem("recentFiles",JSON.stringify(listAPI.elements));
	    this.show();
	},
	touch: function(element)
	{
	    var id = listAPI.getId(element);
	    if (id<0) return;
	    
	    listAPI.elements[id].used=Date.now();
	    listAPI.moveToTop(id);
	    localStorage.setItem("recentFiles",JSON.stringify(listAPI.elements));
	},
	remove: function(element)
	{
	    var id = listAPI.getId(element);
	    if (id < 0) return;
	    
	    this.elements.splice(id,1);
	    localStorage.setItem("recentFiles",JSON.stringify(listAPI.elements));
	    this.show();
	},
	moveToTop: function(element)
	{
	    var id = this.getId(element);
	    if (id<0) return;
	    
	    this.elements.splice(0,0,this.elements.splice(id,1)[0]);
	    localStorage.setItem("recentFiles",JSON.stringify(listAPI.elements));
	    this.show();
	},
	toggle: function(element)
	{
	    var id = this.getId(element);
	    if (id < 0) return;
	    this.elements[id].selected = !(this.elements[id].selected);
	},
	untoggleAll: function()
	{
	    var i=0;
	    for (;i<listAPI.elements.length;i++)
	    {
		listAPI.elements[i].selected = false;
	    }
	},
	show: function()
	{
	    document.getElementById("listRecent").innerHTML = "";
	    this.elements.forEach(this.htmlAdd);
	},
	htmlAdd: function(element,id)
	{
	    var listElement = document.createElement("div");
	    var caption = document.createElement("div");
	    var status  = document.createElement("div");
	    var statusPercent = document.createElement("div");

	    caption.innerHTML = element.caption;
	    caption.className = "listCaption";

	    status.className = "listStatusIcon";
	    statusPercent.className = "listStatusPercent";

	    listElement.appendChild(status);
	    listElement.appendChild(statusPercent);
	    listElement.appendChild(caption);
	    
	    var classname = "listElement";
	    if ((id%2) == 1) classname += " listElementEven";
	    if (element.selected)
	    {
		if (id%2 == 1) classname+= " listElementSelected"
	        else classname += " listElementEvenSelected"
	    }
	    listElement.className = classname;
	    listElement.onclick = function(){listAPI.clickHandler(id)};//

	    activateLongpress(listElement,id);
//	    listElement.addEventListener("dblclick",function(){listAPI.onlongclick(id)});
	    
	    document.getElementById("listRecent").appendChild(listElement);

	    listAPI.withParsed(element.value,function(boxes){listAPI.showProgress(boxes,status,statusPercent)});
	},
	showProgress: function(boxes,iconNode,percentNode)
	{
	    iconNode.innerHTML = "";
	    var i=0;
	    var color=["#e0a8a8","#e0c4a8","#e0dfa8","#cde0a8","#b7e0a8"];
	    var progress = 0;
	    var total = 0;
	    
	    for (;i<5;i++)
	    {
		var div = document.createElement("div");
		div.className = "listStatusLayer";
		div.style.backgroundColor = color[i];
		div.style.flexGrow = boxes[i].length;

		iconNode.appendChild(div);

		progress += boxes[i].length * i * 25;
		total += boxes[i].length;
	    }

	    percentNode.innerHTML = Math.floor(progress/total) + "%";
//	    node.innerHTML = boxes[0].length;
//	    node.style.backgroundColor = color[0];
	},
	showCount: function(boxes,node)
	{
	    node.innerHTML = boxes[0].length+boxes[1].length+boxes[2].length+boxes[3].length+boxes[4].length
	},
	clickHandler: function(id)
	{
	    listAPI.toggle(id);
	    listAPI.show();

	    listAPI.onclick(id,listAPI.elements[listAPI.getId(id)].selected);
	},
	showDialog: function(id)
	{
	    
	},
	onclick: function(id)
	{
	},
	onlongclick: function(id)
	{
	    dialog.show(id);
	},
    }

var dialog=
    {
	init: function()
	{
	    document.getElementById("InfoChooser").onclick=function(){dialog.showTab("InfoContent","InfoChooser")};
	    document.getElementById("OptionChooser").onclick=function(){dialog.showTab("OptionContent","OptionChooser")};
	},
	showTab: function(id,chooserId)
	{
	    var divs = document.getElementsByClassName("DialogTab");
	    var i=0;
	    for (;i<divs.length;i++)
	    {
		divs[i].style.visibility = "hidden";
		divs[i].style.overflow = "hidden";
	    }
	    
	    var divs = document.getElementsByClassName("DialogChooser");
	    var i=0;
	    for (;i<divs.length;i++)
	    {
		divs[i].classList.remove("DialogChooserSelected");
	    }
	    
	    if (id == "") return;
	    
	    document.getElementById(id).style.visibility = "inherit";
	    document.getElementById(id).style.overflow = "auto";
	    document.getElementById(chooserId).classList.add("DialogChooserSelected");
	},
	hide: function()
	{
	    dialog.showTab("","");
	    var divs = document.getElementsByClassName("Details")
	    
	    var i=0;
	    for(;i<divs.length;i++) divs[i].style.visibility="hidden";
	    
	},
	show: function(id)
	{
	    document.getElementById("dialogHeader").innerHTML = listAPI.elements[id].caption;
	    var fontSize = 200;
	    document.getElementById("dialogHeader").style.lineHeight = "2em";
	    document.getElementById("dialogHeader").style.fontSize = "200%";
	    while (document.getElementById("dialogHeader").scrollHeight > document.getElementById("dialogHeader").offsetHeight)
	    {
		fontSize -= 10;
		document.getElementById("dialogHeader").style.fontSize = fontSize + "%";
	    }
	    document.getElementById("dialogHeader").style.lineHeight = 2/fontSize * 200 + "em";

	    
	    document.getElementById("dialogFullPath").innerHTML= listAPI.elements[id].value;
	    document.getElementById("dialogAdded").innerHTML= listAPI.getAdded(id);
	    document.getElementById("dialogUsed").innerHTML= listAPI.getUsed(id);
	    listAPI.withParsed(listAPI.elements[id].value,function(boxes){listAPI.showProgress(boxes,document.getElementById("dialogProgress"),document.getElementById("dialogProgressPercent"))});
	    listAPI.withParsed(listAPI.elements[id].value,function(boxes){listAPI.showCount(boxes,document.getElementById("dialogCount"))});
	    
	    document.getElementById("dialogBack").onclick = dialog.hide;
	    document.getElementById("veil").onclick = dialog.hide;
	    document.getElementById("dialog").onclick = function(event) {event.stopPropagation()}
	    
	    document.getElementById("dialogRemove").onclick = function()
	    {
		if (window.confirm("Do you really want to remove the file " + listAPI.elements[id].caption + " from the list of word-files?\nThe file itself and the progress will remain on the storage and can be re-added later."))
		{
		    dialog.hide();
		    listAPI.remove(id);
		}
	    }
	    document.getElementById("dialogRevert").onclick = function()
	    {
		if (window.confirm ("Do you really want to swap all words with their translation in the file " + listAPI.elements[id].caption + "?"))
		{
		    listAPI.withParsed(listAPI.elements[id].value,function(boxes)
				       {
					   listAPI.writeParsed(listAPI.elements[id].value,listAPI.revert(boxes));
					   app.updatePreview(id,listAPI.elements[id].selected);
				       }
				      );
		}
		
	    }
	    document.getElementById("dialogReset").onclick = function()
	    {
		if (window.confirm("Do you really want to reset the progress in the file " + listAPI.elements[id].caption + " to 0% ?"))
		{
		    listAPI.withParsed(listAPI.elements[id].value,function(boxes)
				       {
					   listAPI.writeParsed(listAPI.elements[id].value,listAPI.reset(boxes));
					   listAPI.show();
				       }
				      );
		}
	    }

	    var divs = document.getElementsByClassName("Details");
	    var i=0;
	    for (;i<divs.length;i++) divs[i].style.visibility="inherit";
	    dialog.showTab("InfoContent","InfoChooser");
	},
	
    }

var longpress = false;
var presstimer = null;
var longtarget = null;

var cancel = function(e) {
    if (presstimer !== null) {
        clearTimeout(presstimer);
        presstimer = null;
    }
    
    this.classList.remove("longpress");
};

var click = function(e) {
    if (presstimer !== null) {
        clearTimeout(presstimer);
        presstimer = null;
    }
    
    this.classList.remove("longpress");
    
    if (longpress) {
        return false;
    }
};

var start = function(id)
{
    return function(e)
    {
	console.log(e);
	
	if (e.type === "click" && e.button !== 0) {
            return;
	}
	
	longpress = false;
    
	this.classList.add("longpress");
	
	presstimer = setTimeout(function() {
	    presstimer = null;
	    listAPI.onlongclick(id);
            longpress = true;
	}, 700);
    
	return false;
    }
};

function activateLongpress(node,id)
{
//    node.addEventListener("mousedown", start(id));
    node.addEventListener("touchstart", start(id));
    node.addEventListener("click", click);
//    node.addEventListener("mouseout", cancel);
    node.addEventListener("touchend", cancel);
    node.addEventListener("touchleave", cancel);
    node.addEventListener("touchcancel", cancel);
}
