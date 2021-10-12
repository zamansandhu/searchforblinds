var focuskey = [];
focuskey[0]= {name:"search",  "element":document.getElementById('search'),  "active":true};
focuskey[1]= {name:"page",    "element":document.getElementById('page'),    "active":false};
focuskey[2]= {name:"content", "element":document.getElementById('content'), "active":false};
var focuscontrol=0;
celem=focuskey[focuscontrol];
celem['element'].style.border = "2px solid black";
celem['element'].style.borderColor = "black";
celem['element'].style.backgroundColor = "rgba(0,0,0,0.1)";



document.onkeydown=function(e){
  console.log(e);
  switch (e.keyCode) {

    case 32 && !e.ctrlKey: //space
        var amISpeaking = window.speechSynthesis.speaking;
        if(amISpeaking){
            window.speechSynthesis.cancel();
        }else{
            window.speechSynthesis.cancel();
            speechSynthesisInstance.text=document.getElementById('contentpara').innerHTML;
            window.speechSynthesis.speak(speechSynthesisInstance);
        }
        
        break;
    case 45: //insert
        if(e.ctrlKey == false){
            focuscontrol = focuscontrol + 1;
            if(focuscontrol >= focuskey.length){
            focuscontrol=0;
            }
        }else{
            focuscontrol = focuscontrol - 1;
            if(focuscontrol < 0){
            focuscontrol=focuskey.length-1;
            }
        }
        for(i=0;i<focuskey.length;i++){
            f=focuskey[i];
            f['element'].style.borderWidth = "0px";
            f['element'].style.borderColor = "white";
            f['element'].style.backgroundColor = "rgba(0,0,0,0)";
        }
        celem=focuskey[focuscontrol];
        celem['element'].style.border = "2px solid black";
        celem['element'].style.borderColor = "black";
        celem['element'].style.backgroundColor = "rgba(0,0,0,0.1)";
        if (celem['name']== "search")   { document.getElementById('txtSearch').focus(); }
        else                            { celem['element'].focus(); }
    // console.log('insert pressed');
    break;
    case 37: //left
      if(mystack.length > 0){
          data.ref.click();
          if(data.child[cv] != undefined){
            data.child[cv].ref.style.color = "#337ab7";
          }
          data = mystack.pop();
          cv=0;
          data.child[cv].ref.style.color = "red";
        }
    break;
    case 39: //right
        if (Object.keys(data).length == 0){
            return;
        }
        if(data.child.length > 0 && (data.type == "node" || data.type == "root" )){
            data.child[cv].ref.style.color = "#337ab7";
            mystack.push(data);
            console.log(data);
            data= data.child[cv];
            cv=0;
            if(data.child.length > 0){
                data.child[cv].ref.style.color = "red";
                data.ref.click();
            }
        }else{
            data.child[cv].ref.click();
        }
        break;
    case 38: //up
        if(data.ref != undefined){
            if(cv > 0){
                data.child[cv].ref.style.color = "#337ab7";
                cv-=1;
                data.child[cv].ref.style.color = "red";
            }
        }
        break;
    case 40: //down
        if(data.ref != undefined){ 
            if(cv < (data.child.length-1)){
                data.child[cv].ref.style.color = "#337ab7";
                cv+=1;
                data.child[cv].ref.style.color = "red";
            }
        }
        break;
  }
}


speechSynthesisInstance = new SpeechSynthesisUtterance();
window.speechSynthesis.cancel();
navigator.mediaDevices.getUserMedia({audio:true}).then(stream => {handlerFunction(stream)})
function handlerFunction(stream) {
  rec = new MediaRecorder(stream);
  console.log("recording object created");
  rec.ondataavailable = e => {
    console.log(e)
    audioChunks.push(e.data);
    if (rec.state == "inactive"){
      let blob = new Blob(audioChunks,{type:'audio/wav'});
      console.log(blob);
      recordedAudio.src = URL.createObjectURL(blob);
      recordedAudio.controls=true;
      recordedAudio.autoplay=true;
      document.getElementById('output').innerHTML='audio sent searching for relevent document...';
      sendData(blob);
    }
  }
}
document.querySelector('#txtSearch').addEventListener('keypress', function (e) {
    var key = e.which || e.keyCode;
    if (key === 13) { // 13 is enter
      // code for enter
      text=document.getElementById('txtSearch').value;
      if(text ==''){
        document.getElementById('output').innerHTML='No input';
      }else{
        document.getElementById('output').innerHTML='searching...';
        // console.log(text);
        document.getElementById('txtSearch').value="";
        textsearch(text);
      }
    }
});
jsonresponse=null;
function recursivesearch(text){
  document.getElementById('output').innerHTML="Loading Article" +text;
  textsearch(text);
}



function textsearch(text) {
  let csrftoken = getCookie('csrftoken');
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      jsonresponse=JSON.parse(this.responseText);
      showdata(jsonresponse);
      
    }
  };
  xhttp.open("POST", "/text_request");
  xhttp.setRequestHeader('X-CSRFToken', csrftoken);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhttp.send(text);
}
var data={};
var mystack=[];
var cv=0;
function showdata(content){
  window.speechSynthesis.cancel();
  document.getElementById('output').innerHTML=jsonresponse.numpages +" pages found";
  document.getElementById('contentpara').innerHTML="";
  window.speechSynthesis.cancel();
  pagesparent=document.getElementById('pageslist');
  pagesparent.innerHTML="";
  showdatarecursively(jsonresponse,pagesparent,data);
  if(data.ref != undefined){
    data.ref.click();
    if(data.child.length>0){
      data.child[cv].ref.style.color = "red";
    }
  }
}


function showdatarecursively(root,element,data){
  if(root.length == undefined){

    if(root.type=="root"){
      mainlist = document.createElement("LI");
      mainlist.classList.add('list-group-item');
      mainlist.classList.add('title');
      mainlist.classList.add('root');
      titleanchor=document.createElement('a');
      titleanchor.classList.add('anchor');
      titleanchor.innerHTML=root.name;
      data['type']=root.type;
      data['ref']=titleanchor;
      data['child']=[];
      // data['datadiv']=[];
      // data.push(titleanchor);
      mainlist.appendChild(titleanchor);
      datadiv = document.createElement("div");
      datadiv.classList.add('collapse');
      datadiv.style.display="block";
      // titleanchor.addEventListener("click", toggleshow.bind(this, datadiv), false);
      mainlist.appendChild(datadiv);
      element.appendChild(mainlist);
      if(root.child.length > 0){
        console.log("calling recusrion from root");
        showdatarecursively(root.child,datadiv,data['child']);
      }
    }
  }else{
    var mainlist = document.createElement("UL");
    mainlist.classList.add('list-group');
    mainlist.classList.add('title');
    for(var i=0;i<root.length;i++){
      // console.log("adding node ")
      // console.log(i);
      // console.log(root[i].name);
      if(root[i].type== "node"){
        var listitem = document.createElement("LI");
        listitem.classList.add('list-group-item');
        var titleanchor=document.createElement('a');
        titleanchor.classList.add('anchor');
        titleanchor.classList.add('node');
       
        titleanchor.innerHTML=root[i].name;
        console.log(root[i].name);
        listitem.appendChild(titleanchor);
        var datadiv = document.createElement("div");
        datadiv.classList.add('collapse');
        titleanchor.addEventListener("click", toggleshow.bind(this, datadiv), false);
        listitem.appendChild(datadiv);
        mainlist.appendChild(listitem);
        newdata={}
        newdata['ref']=titleanchor
        newdata['type']="root"
        newdata['child']=[]
        data.push(newdata);
        if(root[i].child.length > 0){
          console.log("calling recusrion from node");
          showdatarecursively(root[i].child,datadiv,newdata['child']);
        }
      }else{
        var listitem = document.createElement("LI");
        listitem.classList.add('list-group-item');
        titleanchor=document.createElement('a');
        titleanchor.classList.add('anchor');
        titleanchor.classList.add('pagehead');
        titleanchor.innerHTML=root[i].name;
        listitem.appendChild(titleanchor);
        var datadiv = document.createElement("div");
        datadiv.classList.add('collapse');
        titleanchor.addEventListener("click", toggleshow.bind(this, datadiv), false);
        listitem.appendChild(datadiv);
        mainlist.appendChild(listitem);
        newdata={}
        newdata['ref']=titleanchor
        newdata['type']="node"
        newdata['child']=[]
        newdata['datadiv']=[]
        data.push(newdata);
        newdata['datadiv'].push(datadiv);
        if(root[i].child.length > 0){
          console.log("calling recusrion from page");
          showpages(root[i].child,datadiv,newdata['child']);
        }
      }
    }
    element.appendChild(mainlist);
  }
}
function showpages(root,element,data){
  for(var i=0;i<root.length;i++){
    var currentpage=root[i];
    var mainlist = document.createElement("LI");
    mainlist.classList.add('list-group-item');
    mainlist.classList.add('title');
    titleanchor=document.createElement('a');
    titleanchor.classList.add('anchor');
    titleanchor.classList.add('pagetitle');
    titleanchor.innerHTML=currentpage.title;
    mainlist.appendChild(titleanchor);
    console.log("Title anchore",titleanchor);
    var categorylist = document.createElement("ul");
    categorylist.classList.add('list-group');
    var datadiv = document.createElement("div");
    datadiv.classList.add('collapse');
    datadiv.appendChild(categorylist);
    console.log(categorylist);
    titleanchor.addEventListener("click", toggleshow.bind(this, datadiv), false);
    mainlist.appendChild(datadiv);
    newdata={};
    newdata['ref']=titleanchor;
    newdata['type']="page";
    newdata['child']=[];
    data.push(newdata);
    check={};
    for(j=0;j<currentpage.categories.length;j++){
        var innerlistelement = document.createElement("LI");
        innerlistelement.classList.add("indent");
        var inneranchor=document.createElement("a");
        inneranchor.classList.add('category');
        inneranchor.innerHTML=(j+1)+' - '+currentpage.categories[j].heading;
        categories={};
        categories['ref']=inneranchor;
        categories['type']="category";
        newdata['child'].push(categories);
        if(currentpage.title=="Related Articles"){
          inneranchor.addEventListener("click", recursivesearch.bind(this, currentpage.categories[j].heading), false);

        }else{
          inneranchor.addEventListener("click", showcontent.bind(this, currentpage.categories[j].content), false);

        }
        innerlistelement.classList.add("anchor");
        innerlistelement.appendChild(inneranchor);
        categorylist.appendChild(innerlistelement);
    }
    element.appendChild(mainlist);
  }
}
function toggleshow(datadiv){
  datadiv.style.display = datadiv.style.display === 'block' ? '' : 'block';
}
function showcontent(content){
  document.getElementById('contentpara').innerHTML=content;
  window.speechSynthesis.cancel();
  speechSynthesisInstance.text=content;
  window.speechSynthesis.speak(speechSynthesisInstance);
        
}
stopspeech.onclick = e => {
  window.speechSynthesis.cancel();
}
function sendData(data) {
  let csrftoken = getCookie('csrftoken');
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      jsonresponse=JSON.parse(this.responseText);
      console.log(jsonresponse['pages']);
      showdata(jsonresponse);
    }
  };
  xhttp.open("POST", "/voice_request");
  xhttp.setRequestHeader('X-CSRFToken', csrftoken);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhttp.send(data);
}
recording=false;
record.onclick = e => {
  if(recording == false){
    
    recording=true;
    record.style.borderColor = "black";
    audioChunks = [];
    if (typeof rec == "undefined"){
        return;
    }else{
        rec.start();
        console.log('recording starts');
    }
  }else{
    recording=false;
    record.style.borderColor = "red";
    if (typeof rec == "undefined"){
        return;
    }else{
        rec.stop();
        console.log('recording stops');
    }
  }
}
// https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
document.getElementById('txtSearch').focus();

if (typeof rec == "undefined"){

    console.log('No Mic Found');
    document.getElementById('record').disabled=true;
    document.getElementById('msg').innerHTML="Mic Not Available";

}