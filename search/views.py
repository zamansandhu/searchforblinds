from django.shortcuts import render,HttpResponse
from django.middleware import csrf
import speech_recognition as sr
import os
import wikipedia
import json
import wikipediaapi
from django.http import JsonResponse
from collections import Counter
import string
wiki_wiki = wikipediaapi.Wikipedia('en')
import spacy
print('spaCy Version: %s' % (spacy.__version__))
spacy_nlp = spacy.load('en_core_web_sm')
table = str.maketrans('', '', string.punctuation)

# Create your views here.
def index(request):
    csrf_token=csrf.get_token(request)
    context={"csrf_token":csrf_token}
    return render(request,'index.html',context)
def voice_request(request):
    with open('myfile.webm', mode='wb') as f:
        f.write(request.body)
    try:
        os.remove('file.wav')
    except:
        pass
    cmd='ffmpeg -i myfile.webm -ac 1 -f wav file.wav'
    os.system(cmd)
    print('got the request')
    r = sr.Recognizer()
    harvard = sr.AudioFile('file.wav')
    with harvard as source:
        audio = r.record(source)
    try:
        text=r.recognize_google(audio)
    except:
        text='None'
    
    if(text == 'None'):
        newresponse={"name":text,"type":"root","child":[],"numpages":0}
        return JsonResponse(response)
    else:
        result=wikipedia.search(text, results=7)
        print(result)
        
        for r in result:
            page_py = wiki_wiki.page(r)
            page={"title":page_py.title,"categories":[]}
            for s in page_py.sections:
                section={"heading":s.title,"content":s.text}
                page["categories"].append(section)
            response["pages"].append(page)
    return JsonResponse(response)
class MyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (bytes, bytearray)):
            return obj.decode("ASCII") # <- or any other encoding of your choice
        # Let the base class default method raise the TypeError
        return json.JSONEncoder.default(self, obj)
def text_request(request):
    
    rootquery=request.body
    result=wikipedia.search(rootquery, results=10)
    print(result)
    response={"pages":[]}
    for r in result:
        page_py = wiki_wiki.page(r)
        page={"title":page_py.title,"categories":[],"tokens":None}
        wholetext=""
        for s in page_py.sections:
            section={"heading":s.title,"content":s.text}
            wholetext+=s.text
            page["categories"].append(section)
        doc = spacy_nlp(wholetext)
        words = [token.lemma_ for token in doc if not token.is_stop]
        words = [w.translate(table) for w in words]
        words = [word.lower() for word in words if word != '' and word != '\n']
        page["tokens"]=words
        response["pages"].append(page)
    newresponse={"name":rootquery,"type":"root","child":[],"numpages":len(result)}
    titles=[]
    group1,group2,title1,title2=partition(response["pages"],titles)
    titles.append(title1)
    titles.append(title2)
    newresponse=heirarchy(group1,group2,title1,title2,titles,newresponse,0)
    x=json.dumps(newresponse, cls=MyEncoder )
    json_object = json.loads(x)
    # json_formatted_str = json.dumps(json_object, indent=2)
    # print(json_formatted_str)
    
    
    # if(len(result)>0):
    #     page={"title":"Related Articles","categories":[]}
    #     for s in wikipedia.page(result[0]).categories:
    #         section={"heading":s,"content":""}
    #         page["categories"].append(section)
    #     response["pages"].append(page)
    return JsonResponse(json_object)
def heirarchy(group1,group2,title1,title2,titles,myjson,count):
    count=count+1
    if(count>=4):
        # print("final count")
        # g1=[x["title"] for x in group1]
        # print(g1)
        # g1=[x["title"] for x in group2]
        # print(g1)
        
        if(len(group1)>0):
            h1={"name":title1,"type":"page","child":group1}
            myjson["child"].append(h1)
        if(len(group2)>0):
            h1={"name":title2,"type":"page","child":group2}
            myjson["child"].append(h1)
        return myjson
    if(len(group1)>=2):
        h1={"name":title1,"type":"node","child":[]}
        group1_1,group2_1,title1_1,title2_1=partition(group1,titles)
        titles.append(title1_1)
        titles.append(title2_1)
        h1=heirarchy(group1_1,group2_1,title1_1,title2_1,titles,h1,count)
    elif(len(group1) != 0 and len(group1)<2):
        h1={"name":title1,"type":"page","child":group1}
    myjson["child"].append(h1)
    if(len(group2)>=2):
        h2={"name":title2,"type":"node","child":[]}
        group1_1,group2_1,title1_1,title2_1=partition(group2,titles)
        titles.append(title1_1)
        titles.append(title2_1)
        h2=heirarchy(group1_1,group2_1,title1_1,title2_1,titles,h2,count)
    elif(len(group2) != 0 and len(group2)<2):
        h2={"name":title2,"type":"page","child":group2}
    myjson["child"].append(h2)
    return myjson
def partition(pages,titles):
    group1=[]
    group2=[]
    if(len(pages)==0):
        return group1,group2
    selectedword=pages[0]["tokens"]
    similarities=[]
    for i in range(1,len(pages)):
        currentword=pages[i]["tokens"]
        similarities.append(jaccard_similarity(selectedword,currentword))
    average=sum(similarities)/len(similarities)
    group1=[pages[i+1] for i in range(0,len(similarities)) if (similarities[i] <= average)]            
    group2=[pages[i+1] for i in range(0,len(similarities)) if (similarities[i] >  average)]
    group2.append(pages[0])
    t1=[]
    t2=[]
    for g in group1:
        t1=t1+g["tokens"]
    for g in group2:
        t2=t2+g["tokens"]
    t1=[i for i in t1 if i not in titles]
    t1 = Counter(t1).most_common(5)[0]
    t1=t1[0]
    titles.append(t1)
    t2=[i for i in t2 if i not in titles]
    t2 = Counter(t2).most_common(10)[0]
    t2=t2[0]
    return group1,group2,t1,t2
        
def jaccard_similarity(list1, list2):
    s1 = set(list1)
    s2 = set(list2)
    return len(s1.intersection(s2)) / len(s1.union(s2))