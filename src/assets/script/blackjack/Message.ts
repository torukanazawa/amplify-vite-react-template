/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Item {
  str: string;
  charItr?: IterableIterator<string>,
  callback?: any;
}
export class Message {
  private messageArea:HTMLElement;
  private messages:Item[];
  private message:Item | undefined;
  private currentMessageIndex:number;
  private typeSpeed:number;
  private typeInterval;
  
  constructor() {
    this.messageArea = document.getElementById("message-area") as HTMLElement;
    console.log(this.messageArea);
    
    this.messages=[];
    this.currentMessageIndex=0;
    this.typeSpeed=20;
    this.typeInterval=null;
  }
  public addMessage(item:Item){
    this.messageArea = document.getElementById("message-area") as HTMLElement;
    this.messages.push(item)
    if(this.typeInterval===null)this.startMessaging()
  }
  public clearMessage(){
    if(this.typeInterval!==null)clearInterval(this.typeInterval)
    this.typeInterval=null;
    this.messages=[];
    this.messageArea.textContent ="";
    this.currentMessageIndex=0;
  }
  private startMessaging(){
    if(this.currentMessageIndex!==0){
      this.messageArea.textContent +="\n"
    }

    this.message = this.messages[this.currentMessageIndex];
    console.log(this.message,this.currentMessageIndex);
    
    this.message.charItr=this.message.str[Symbol.iterator]()
    this.typeInterval = setInterval(this.typing.bind(this), this.typeSpeed);
  }
  private typing(){
    if(!this.message||!this.message.charItr){
      if(this.typeInterval!==null)clearInterval(this.typeInterval)
      this.typeInterval=null;
      return;
    }
    const nextChar = this.message.charItr.next()
    if (nextChar.done) {
      this.doneMessaging()
    }else{
      this.messageArea.textContent += nextChar.value;
      this.scroll()
    }
  }
  private scroll(){
    this.messageArea.scrollBy({top:100})
  }
  private doneMessaging(){
    if(this.typeInterval!==null)clearInterval(this.typeInterval);
    this.typeInterval=null;
    if(this.message?.callback){
      this.message.callback()
    }
    this.currentMessageIndex++;
    if(this.currentMessageIndex<this.messages.length){
      this.startMessaging()
    }
  }
}
