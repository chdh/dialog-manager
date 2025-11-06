import * as DialogMgr from "dialog-manager";

function log (msg: string) {
   document.getElementById("log")!.textContent += msg + "\n"; }

function init2() {
   // Progress info
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
   // showMsg()
   document.getElementById("testShow1")!.addEventListener("click", async () => {
      await DialogMgr.showMsg({msgText: "Message text...", titleText: "Title text"});
      log("Dialog closed."); });
   document.getElementById("testShow2")!.addEventListener("click", () => {
      void DialogMgr.showMsg({msgText: "Line one\nLine two\nLine three..."}); });
   document.getElementById("testShow3")!.addEventListener("click", () => {
      void DialogMgr.showMsg({msgText: "Blah blah blah blah. ".repeat(99)}); });
   document.getElementById("testShow4")!.addEventListener("click", () => {
      void DialogMgr.showMsg({msgText: "Blah blah blah blah. ".repeat(999)}); });
   document.getElementById("testShow5")!.addEventListener("click", () => {
      void DialogMgr.showMsg({msgText: "Blah blah blah blah. ".repeat(999), titleText: "Title text"}); });
   document.getElementById("testShow6")!.addEventListener("click", () => {
      void DialogMgr.showMsg({msgHtml: "<b>bold</b> <i>italic</i>"}); });
   document.getElementById("testShow7")!.addEventListener("click", () => {
      const div = document.createElement("div");
      div.innerHTML = "Text of <b>div</b> element.";
      void DialogMgr.showMsg({msgNode: div}); });
   document.getElementById("testShow8")!.addEventListener("click", () => {
      const fragment = document.createRange().createContextualFragment("Text of <b>fragment</b>.");
      void DialogMgr.showMsg({msgNode: fragment}); });
   // promptConfirmation()
   document.getElementById("testConfirmationDialog1")!.addEventListener("click", async () => {
      const result = await DialogMgr.promptConfirmation({msgText: "Question text?", titleText: "Title text"});
      log("Dialog result: " + result); });
   // promptInput()
   document.getElementById("testPromptInput1")!.addEventListener("click", async () => {
      const result = await DialogMgr.promptInput({promptText: "Enter product ID:", titleText: "Input Prompt Test"});
      log("Input result: \"" + result + "\""); });
   document.getElementById("testPromptInput2")!.addEventListener("click", async () => {
      const result = await DialogMgr.promptInput({promptText: "Enter product ID:", defaultValue: "The default value"});
      log("Input result: \"" + result + "\""); });
   document.getElementById("testPromptInput3")!.addEventListener("click", async () => {
      const result = await DialogMgr.promptInput({promptText: "Enter a large text:", rows: 5, defaultValue: "Blah blah blah blah. ".repeat(99)});
      log("Input result: \"" + result + "\""); });
   // Fatal error
   document.getElementById("testFatalError")!.addEventListener("click", () => {
      DialogMgr.showFatalError({msgText: "Fatal error msg."}); });
   document.getElementById("testProgressFatal1")!.addEventListener("click", () => {
      DialogMgr.showProgressInfo({msgText: "Progress Info..."});
      setTimeout(() => DialogMgr.showFatalError({msgText: "Fatal ending after Progress Info."}), 2000); });
   // Toast
   let toastCtr = 1;
   document.getElementById("testToast1")!.addEventListener("click", () => {
      DialogMgr.showToast({msgText: "This is toast message " + toastCtr++ + "."}); });
   }

function init() {
   document.addEventListener("DOMContentLoaded", init2); }

init();
