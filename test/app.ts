import * as DialogMgr from "dialog-manager";
import * as PromisePolyfill from "es6-promise";

//--- Polyfills ----------------------------------------------------------------

function stringRepeatPolyfill (this: string, count: number) {
    var s = '';
    for (var i = 0; i < count; i++) {
      s += this; }
    return s; }

function reportValidityPolyfill (this: HTMLFormElement) : boolean {
   let isValid = false;
   const button = createInvisibleSubmitButton();
   this.appendChild(button);
   this.addEventListener("submit", submitEventHandler);
   button.click();
   this.removeEventListener("submit", submitEventHandler);
   this.removeChild(button);
   return isValid;
   function createInvisibleSubmitButton() {
      const button = <HTMLButtonElement>document.createElement("button");
      button.type = "submit";
      button.style.display = "none";
      return button; }
   function submitEventHandler (event: Event) {
      event.preventDefault();
      isValid = true; }}

function installPolyfills() {
   if (!String.prototype.repeat) {
      String.prototype.repeat = stringRepeatPolyfill; }
   if (!HTMLFormElement.prototype.reportValidity) {
      HTMLFormElement.prototype.reportValidity = reportValidityPolyfill; }
   if (!(<any>window).Promise) {
      PromisePolyfill.polyfill(); }}

//------------------------------------------------------------------------------

function log (msg: string) {
   document.getElementById("log")!.textContent += msg + "\n"; }

function init2() {
   //
   document.getElementById("testProgressInfo1")!.addEventListener("click", () => {
      DialogMgr.showProgressInfo({msgText: "Progress Info Text...\nblah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah!"});
      setTimeout(() => DialogMgr.showProgressInfo({msgText: '1 second'}), 1000);
      setTimeout(() => DialogMgr.closeProgressInfo(), 2000); });
   document.getElementById("testProgressInfo2")!.addEventListener("click", () => {
      DialogMgr.showProgressInfo({msgText: "1s delayed...", titleText: "Test", delayTime: 1000});
      setTimeout(() => DialogMgr.closeProgressInfo(), 2000); });
   document.getElementById("testProgressInfo3")!.addEventListener("click", () => {
      DialogMgr.showProgressInfo({msgText: "1s delayed...", titleText: "Test", delayTime: 2000});
      setTimeout(() => DialogMgr.closeProgressInfo(), 1000); });
   //
   document.getElementById("testShow1")!.addEventListener("click", async () => {
      await DialogMgr.showMsg({msgText: "Message text...", titleText: "Title text"});
      log("Dialog closed."); });
   document.getElementById("testShow2")!.addEventListener("click", () => {
      DialogMgr.showMsg({msgText: "Line one\nLine two\nLine three..."}); });
   document.getElementById("testShow3")!.addEventListener("click", () => {
      DialogMgr.showMsg({msgText: "Blah blah blah blah. ".repeat(99)}); });
   document.getElementById("testShow4")!.addEventListener("click", () => {
      DialogMgr.showMsg({msgText: "Blah blah blah blah. ".repeat(999)}); });
   document.getElementById("testShow5")!.addEventListener("click", () => {
      DialogMgr.showMsg({msgText: "Blah blah blah blah. ".repeat(999), titleText: "Title text"}); });
   document.getElementById("testShow6")!.addEventListener("click", () => {
      DialogMgr.showMsg({msgHtml: "<b>bold</b> <i>italic</i>"}); });
   document.getElementById("testShow7")!.addEventListener("click", () => {
      const div = document.createElement("div");
      div.innerHTML = "Text of <b>div</b> element.";
      DialogMgr.showMsg({msgNode: div}); });
   document.getElementById("testShow8")!.addEventListener("click", () => {
      const fragment = document.createRange().createContextualFragment("Text of <b>fragment</b>.");
      DialogMgr.showMsg({msgNode: fragment}); });
   //
   document.getElementById("testConfirmationDialog1")!.addEventListener("click", async () => {
      let result = await DialogMgr.promptConfirmation({msgText: "Question text?", titleText: "Title text"});
      log("Dialog result: " + result); });
   //
   document.getElementById("testPromptInput1")!.addEventListener("click", async () => {
      let result = await DialogMgr.promptInput({promptText: "Enter product ID:", titleText: "Input Prompt Test"});
      log("Input result: \"" + result + "\""); });
   //
   document.getElementById("testFatalError")!.addEventListener("click", () => {
      DialogMgr.showFatalError({msgText: "Fatal error msg."}); });
   document.getElementById("testProgressFatal1")!.addEventListener("click", () => {
      DialogMgr.showProgressInfo({msgText: "Progress Info..."});
      setTimeout(() => DialogMgr.showFatalError({msgText: "Fatal ending after Progress Info."}), 2000); });
   //
   let toastCtr = 1;
   document.getElementById("testToast1")!.addEventListener("click", () => {
      DialogMgr.showToast({msgText: "This is toast message " + toastCtr++ + "."}); });
   }

function init() {
   installPolyfills();
   document.addEventListener("DOMContentLoaded", init2); }

init();
