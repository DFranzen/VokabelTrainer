/* Todo-list
 *  - Autodetect separator 
 * *** Ideas
 *  - Edit vokabelListen
 *  - picture vokabelListen
 *  - localise
 */

var app = {
    words: [[],[],[],[],[]],
    currentBox:0,
    currentWord:{},
    waitingList: [],
    revisionMode: false,
    revisionBox:[],
    lastInsert: 5,

    fileNames: [],
    loadingFileIndex: 0,
    divider: ";",
    
    reverse: false,
    preview: {},
    
    currentView: "",

    fonts: ["Arial","serif","sans-serif","Times New Roman","Verdana","Comic sans MS","WildWest","Bedrock","helvetica","Helvetica",'HelveticaNeue-Light','HelveticaNeue',"Times","Geeza Pro", "Nadeem", "Al Bayan", "DecoType Naskh", "DejaVu Serif", "STFangsong", "STHeiti", "STKaiti", "STSong", "AB AlBayan", "AB Geeza", "AB Kufi", "DecoType Naskh", "Aldhabi", "Andalus", "Sakkal Majalla", "Simplified Arabic", "Traditional Arabic", "Arabic Typesetting", "Urdu Typesetting", "Droid Naskh", "Droid Kufi", "Roboto", "Tahoma"],
    currentFont: -1,
    
    
    // Application Constructor
    initialize: function() {
	document.addEventListener('deviceready', app.onDeviceReady, false);
    },

    // deviceready Event Handler
    //
    onDeviceReady: function() {
	app.activateMenu();
	//get recent files
	// localStorage.
	swipe = new Dragend(document.getElementById("swipeArea"),{pageClass:"dragend-page", direction:"horizontal", onSwipeEnd:app.moveSwipe})

	document.addEventListener("backbutton",app.backButton_onClick);
	document.addEventListener("pause",app.onPause);
	//orientationchange
	window.addEventListener("orientationchange", app.onRotate);
	document.getElementById("ImageMenu").addEventListener("click",app.ButtonMenu_onClick);

	if (localStorage.getItem('recentFiles') != null)
	    listAPI.elements = JSON.parse(localStorage.getItem('recentFiles'));
	listAPI.onclick = app.updatePreview;
	listAPI.init();

	dialog.init();
    },
    updatePreview: function(id,toggled)
    {
	var showID;
	if (toggled)
	{
	    showID = id;
	} else {
	    showID = listAPI.getFirstSelected();
	}
	listAPI.withParsed
	(
	    showID
	    ,function(boxes)
	    {
		var i=0;
		while (boxes[i].length == 0 && i<5) i++
		if (i<5) app.preview=boxes[i][0]
		app.showPreview();
	    }
	)

    },
    showPreview: function()
    {
	if (app.preview.word==undefined) return;
	if (app.preview.translation==undefined) return;

	var question = (app.reverse)?app.preview.translation:app.preview.word;
	document.getElementById("prev_question").innerHTML = question;
	app.matchFont("prev_question");
	
	var answer = (app.reverse)?app.preview.word:app.preview.translation;
	document.getElementById("prev_answer").innerHTML = answer;
	app.matchFont("prev_answer");
    },
    resetWords: function()
    {
	app.words = [[],[],[],[],[]];
	app.revisionMode = false;
	app.currentWord = {};
	app.waitingList = [];
	app.revisionBox = [];
    },
    loadTest: function()
    {
	listAPI.add("test 123456789123456789123456789","test",false);
    },
    fontTest: function()
    {
	alert("Next Font: " + app.fonts[app.currentFont]);
	app.currentFont++;
	if (app.currentFont >= app.fonts.length) app.currentFont = 0;
	document.getElementById("body").style.fontFamily = app.fonts[app.currentFont];
    },
    pushToWait: function(word,dest)
    {
	word.dest = dest; 
	if (app.waitingList.length>=4) app.popFromWait();
	app.waitingList.push(word);
    },
    popFromWait: function()
    {
	if (app.waitingList.length == 0) return 5;
	var poped=app.waitingList[0];
	app.waitingList.splice(0,1);
	app.lastInsert = poped.dest;
	app.words[poped.dest].push(poped);

	return poped.dest;
    },
    findNextBox: function()
    {
	var i=0;
	for (;i<5;i++)
	{
	    if((app.lastInsert == i) && (app.words[i].length==1)) continue;
	    if (app.words[i].length==0) continue;
	    break;
	}
	if (i<5)
	{
	    app.currentBox = i;
	} else {
	    if ((app.currentBox = app.popFromWait()) == 5)
	    {
		console.log("No Variables awailable");
		activateMenu();
	    }
	}
    },
    needNewBox: function()
    {
	if (app.revisionMode)
	{
	    console.log("Testing revision condition: " + app.words[4].length);
	    if (app.words[4].length==0)
	    {
		console.log("Revision is over");
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
    revealAnswer: function()
    {
	var answer=(app.reverse)?app.currentWord.word:app.currentWord.translation;
	document.getElementById("coverDiv").style.visibility="hidden";
	document.getElementById("answer").innerHTML = answer.replace(",","<br>");
	document.getElementById("answer").style.color = "#000000";
	document.getElementById("swipeArea").style.overflow = "visible";
	app.matchFont("answer");
	swipe.preventScroll=false;
	app.activateButtonCorrect();
	app.activateButtonWrong();
    },
    hideAnswer: function()
    {
	document.getElementById("answer").innerHTML = "";
	document.getElementById("swipeArea").style.overflow = "hidden";
	document.getElementById("cover").innerHTML = "?";
	app.matchFont("cover");
	document.getElementById("cover").style.color = "#a0a0a0";
	document.getElementById("coverDiv").style.visibility = "visible";
	swipe.jumpToPage(2);
	swipe.preventScroll=true;
	app.deactivateButtonCorrect();
	app.deactivateButtonWrong();
    },
    activateButtonCorrect: function()
    {
	document.getElementById("ButtonCorrect").disabled=false;
	document.getElementById("ButtonCorrect").style.backgroundColor="";
	document.getElementById("ImageCorrect").src="res/tick.png";
    },
    deactivateButtonCorrect: function()
    {
	document.getElementById("ButtonCorrect").disabled=true;
	document.getElementById("ButtonCorrect").style.backgroundColor="#a0a0a0";
	document.getElementById("ImageCorrect").src="res/tickDeact.png";
    },
    activateButtonWrong: function()
    {
	document.getElementById("ButtonWrong").disabled=false;
	document.getElementById("ButtonWrong").style.backgroundColor="";
	document.getElementById("ImageWrong").src="res/cross.png";
    },
    deactivateButtonWrong: function()
    {
	document.getElementById("ButtonWrong").disabled=true;
	document.getElementById("ButtonWrong").style.backgroundColor="#a0a0a0";
	document.getElementById("ImageWrong").src="res/crossDeact.png";
    },
    findNextWord: function()
    {
	if (app.needNewBox()) app.findNextBox();

	console.log("Getting new word");

	var wordID = Math.floor(Math.random()*app.words[app.currentBox].length);
	app.currentWord = app.words[app.currentBox][wordID];
	app.words[app.currentBox].splice(wordID,1);

	app.updateBoxes();

	var question=(!app.reverse)?app.currentWord.word:app.currentWord.translation;
	document.getElementById("question").innerHTML = question;
	app.matchFont("question");

	app.hideAnswer();
    },
    onRotate: function()
    {
	setTimeout(function()
		   {
		       app.matchFont("question");
		       app.matchFont("answer");
		       var i=0;
		       for (;i<5;i++)
		       {
			   app.matchFont("Box" + i);
		       }
		       app.matchFont("prev_question");
		       app.matchFont("prev_answer");
		       app.matchFont("cover");
		   },100)
    },
    matchFont: function(divID)
    {
	console.log("Matching Font: " +divID);
	
	var div = document.getElementById(divID);
	if (div.innerHTML == "") return;
	div.style.fontSize="100%";
	
	var fs_width  = 100 * div.parentElement.offsetWidth  / div.offsetWidth;
	var fs_height = 100 * div.parentElement.parentElement.offsetHeight / div.offsetHeight;

	console.log(div.parentElement.parentElement.paddingBottom);
	
	div.style.fontSize=Math.min(fs_width,fs_height)*0.8+"%";
    },
    moveCorrect: function()
    {
	if (app.revisionMode)
	{
	    app.revisionBox.push(app.currentWord);
	} else {
	    var dest = (app.currentBox <4)?app.currentBox+1:4
	    app.pushToWait(app.currentWord,dest);
	}
	app.findNextWord();
    },
    moveWrong: function() {
	if (app.revisionMode)
	{
	    app.words[0].push(app.currentWord);
	} else {
	    var dest = (app.currentBox >0)?app.currentBox-1:0;
	    app.pushToWait(app.currentWord,dest);
	}
	app.findNextWord();
    },
    moveSwipe: function()
    {
	if (swipe.page == 2) app.moveWrong();
	else if(swipe.page == 0) app.moveCorrect();
    },
    activateMenu: function()
    {
	app.activateView("Menu");
    },
    activateRevision: function()
    {
	console.log("Activating Revision");
	app.revisionMode = true;
	while (app.popFromWait() != 5);
	var i=1;
	for (;i<=3;i++) document.getElementById("Box"+i+"Div").style.backgroundColor = "#a0a0a0";
    },
    deactivateRevision: function()
    {
	console.log("Deactivating Revision");
	app.revisionMode = false;
	app.words[4] = app.words[4].concat(app.revisionBox);
	app.revisionBox= [];
	var i=1;
	for (;i<=3;i++) document.getElementById("Box"+i+"Div").style.backgroundColor = "";
    },
    showView: function(view)
    {
	var divs=document.getElementsByClassName(view);
	var div;
	for (div=0;div<divs.length;div++)
	{
	    divs[div].style.visibility="visible";
	}
    },
    hideView: function(view)
    {
	var divs=document.getElementsByClassName(view);
	var div;
	for (div=0;div<divs.length;div++)
	{
	    divs[div].style.visibility="hidden";
	}
    },
    activateView: function(view)
    {
	app.hideView("Training");
	app.hideView("Menu");

	app.showView(view);
	app.currentView=view;
    },
    activateTraining: function()
    {
	app.activateView("Training");
	swipe.jumpToPage(2);
    },
    updateBoxes: function()
    {
	var i;
	var box = []
	for (i=0;i<5;i++) box[i] = app.words[i].length;
	for (i=0;i<app.waitingList.length;i++)
	{
	    var word = app.waitingList[i];
	    box[word.dest] ++;
	}
	console.log(app.currentWord);
	if (app.currentWord.word)
	    box[app.currentBox] ++;

	box[4] += app.revisionBox.length;
	
	for (i=0;i<5;i++)
	{
	    document.getElementById("Box"+i).innerHTML = box[i];
	    document.getElementById("Box"+i).style.fontWeight = "normal";
	    document.getElementById("Box"+i+"Div").style.backgroundColor = "";
	    app.matchFont("Box" + i);
	}
	if (app.revisionMode)
	{
	    var i=1;
	    for (;i<=3;i++) document.getElementById("Box"+i+"Div").style.backgroundColor = "#a0a0a0";
	}
	document.getElementById("Box"+app.currentBox).style.fontWeight="bold";
	document.getElementById("Box"+app.currentBox+"Div").style.backgroundColor = "#fcff66";

	if ((!app.revisionMode) && (box[0] + box[1] + box[2] + box[3] == 0)) app.activateRevision();
    },
    writeBoxes: function()
    {
	// write back Waiting List
	while (app.popFromWait()!=5) ;
	// Write back current Word
	app.words[app.currentBox].push(app.currentWord);
	app.currentWord = {};
	
	app.words[4] = app.words[4].concat(app.revisionBox);
	app.revisionBox= [];
    },
    boxesToString: function(fileName)
    {
	var i=0;
	var result = "";
	for (;i<4;i++)
	{
	    result+=app.boxToString(fileName,i);
	    result+= "-\n";
	}
	result+=app.boxToString(fileName,4);

	return result;
    },
    boxToString: function(fileName,i)
    {
	var j=0;
	var word;
	var result = "";
	for (;j<app.words[i].length;j++)
	{
	    word = app.words[i][j];
	    if (word.file == fileName)
	    {
		result+=word.word + app.divider + word.translation + "\n";
	    }
	}
	j=0;
	for (;j<app.waitingList.length;j++)
	{
	    word = app.waitingList[j];
	    if ( (word.file == fileName)
		 && (word.dest == i) )
	    {
		result+=word.word + app.divider + word.translation + "\n";
	    }
	}
	word = app.currentWord;
	if ( (app.currentBox == i)
	     && (word.file == fileName) )
	{
	    result += word.word + app.divider + word.translation + "\n";
	}
	if ( i == 4)
	{
	    for (j=0;j<app.revisionBox.length;j++)
	    {
		word = app.revisionBox[j]; 
		if (word.file == fileName)
		{
		    result += word.word + app.divider + word.translation + "\n";
		}
	    }
	}
	
	return result;
    },
    ButtonStart_onClick: function()
    {
	var i=0;
	app.fileNames = listAPI.getSelected();
	app.resetWords();

	if (app.fileNames.length == 0)
	{
	    alert("No files selected");
	    return;
	}

	app.processed = 0;
	for (;i<app.fileNames.length;i++)
	{
	    (function() {
		var fileName = app.fileNames[i];
		var processFile = function(boxes)
		{
		    var j=0;
		    for(;j<5;j++) app.words[j] = app.words[j].concat(boxes[j]);
		    app.processed++;
		    if (app.processed >= app.fileNames.length) app.startSession();
		}
		listAPI.withParsed(fileName,processFile);
		listAPI.touch(fileName);
	    })();
	}

	document.getElementById("LectionID").innerHTML = listAPI.getSelectedToString();
    },
    startSession: function()
    {
	app.findNextWord();
	app.activateTraining();
    },
    ButtonLoad_onClick: function()
    {
	fileChooser.open
	(
	    function(uri)
	    {
		var filePath = uri.filepath
		var fileName = filePath.substr(filePath.lastIndexOf('/')+1);
		listAPI.add(fileName,filePath,true);
		//app.fileNames = [uri.filepath];
	    }
	);
    },
    sortBoxes: function()
    {
	var files = {};
	//Boxes
	var i = 0;
	for (;i<5;i++)
	{
	    var j=0;
	    for (;j<app.words[i].length;j++)
	    {
		var word = app.words[i][j];
		if (files[word.file] == undefined) files[word.file]=[[],[],[],[],[]];
		files[word.file][i].push(word);
	    }
	}
	//WaitingList
	for (j=0;j<app.waitingList.length;j++)
	{
	    word = app.waitingList[j];
	    if (files[word.file] == undefined) files[word.file]=[[],[],[],[],[]];
	    files[word.file][word.dest].push(word);	    
	}
	//revisionBox
	for (j=0;j<app.revisionBox.length;j++)
	{
	    word = app.revisionBox[j];
	    if (files[word.file] == undefined) files[word.file]=[[],[],[],[],[]];
	    files[word.file][4].push(word);	    
	}
	//CurrentWord
	if (app.currentWord.file != undefined)
	{
	    word=app.currentWord;
	    if (files[word.file] == undefined) files[word.file]=[[],[],[],[],[]];
	    files[word.file][app.currentBox].push(word);
	}

	return files;
    },
    store_back: function()
    {
	var files = app.sortBoxes();

	var keys = Object.keys(files);
	var i=0;
	for (;i<keys.length;i++)
	{
	    if (keys[i] != undefined) listAPI.writeParsed(keys[i],files[keys[i]]);
	}
//	app.loadingFileIndex = 0;
//	app.writeNextFile();
    },
    ButtonCorrect_onClick: function()
    {
	app.moveCorrect();
    },
    ButtonWrong_onClick: function()
    {
	app.moveWrong();
    },
    ButtonMenu_onClick: function(event)
    {
	app.writeBoxes();
	app.store_back();
	listAPI.show();   
	app.activateMenu();
	event.stopPropagation();
    },
    preview_onClick: function()
    {
	app.reverse=!app.reverse;
	app.showPreview();
    },
    backButton_onClick: function()
    {
	switch(app.currentView)
	{
	    case "Training":
   	      app.ButtonMenu_onClick();
	      break;
	    case "Menu":
	      navigator.app.exitApp();
	      break;
	    default: alert("No back behaviour defined for view " + app.currentView);
	}
    },
    onPause: function()
    {
	switch(app.currentView)
	{
	    case "Training":
	      app.ButtonMenu_onClick();
   	      break;
	    case "Menu":
	      break;
	    default: alert("No pause behaviour defined for view " + app.currentView);
	}
    },
};

app.initialize();
