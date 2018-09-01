// Dialog manager for modal popup dialogs and toast messages.

const enum DialogType { prompt, progressInfo, fatalError }
const enum DisplayState { none, fadeIn, fadeOut, transparentOverlay }

var activeDialogType:        DialogType  | undefined;      // undefined = no dialog is active
var activeDialogParms:       DialogParms | undefined;
var dialogResult:            any;
var displayState:            DisplayState;
var animationSupported:      boolean;
var initDone:                boolean = false;

var rootElement:             HTMLElement;
var frameElement:            HTMLElement;
var headerElement:           HTMLElement;
var contentElement:          HTMLElement;
var footerElement:           HTMLElement;
var okButton:                HTMLElement;
var cancelButton:            HTMLElement;
var toastRootElement:        HTMLElement;
var toastBoxElement:         HTMLElement;

// Can be thrown within a FormInputProcessor to stop further processing.
export class FormInputProcessorException extends Error {
   // (This class is currently only used internally, but in the future it could be part of the public API.)
   public isFormInputProcessorException = true; }          // for detecting class with IE5

interface DialogParms {
   dialogType:               DialogType;
   content:                  Node;
   wide?:                    boolean;
   titleText?:               string;
   closeEnabled?:            boolean;
   okButton?:                boolean;
   cancelButton?:            boolean;
   focusElement?:            HTMLElement;
   defaultDialogResult?:     any;
   formInputProcessor?:      () => any;                    // returns the dialogResult and can throw a FormInputProcessorException
   onClose?:                 (result: any) => void; }

function init() {
   if (initDone) {
      return; }
   //
   const styleElement = document.createElement("style");
   styleElement.textContent = cssTemplate;
   document.head.insertAdjacentElement("afterbegin", styleElement);
   document.body.insertAdjacentHTML("beforeend", htmlTemplate);
   //
   rootElement      = <HTMLElement>document.querySelector(".dialogMgr_root");
   frameElement     = <HTMLElement>rootElement.querySelector(".dialogMgr_frame");
   headerElement    = <HTMLElement>frameElement.querySelector(".dialogMgr_header")!;
   contentElement   = <HTMLElement>frameElement.querySelector(".dialogMgr_content")!;
   footerElement    = <HTMLElement>frameElement.querySelector(".dialogMgr_footer")!;
   okButton         = <HTMLElement>frameElement.querySelector(".dialogMgr_okButton")!;
   cancelButton     = <HTMLElement>frameElement.querySelector(".dialogMgr_cancelButton")!;
   toastRootElement = <HTMLElement>document.querySelector(".dialogMgr_toastRoot")!;
   toastBoxElement  = <HTMLElement>toastRootElement.querySelector(".dialogMgr_toastBox")!;
   //
   rootElement.addEventListener("animationend", animationEndEventHandler);
   rootElement.addEventListener("click", rootElementClickEventHandler);
   okButton.addEventListener("click", okButtonClickEventHandler);
   cancelButton.addEventListener("click", cancelButtonClickEventHandler);
   document.addEventListener("keydown", documentKeyDownEventHandler);
   toastRootElement.addEventListener("animationend", toastAnimationEndEventHandler);
   //
   animationSupported = rootElement.style.animationName !== undefined;
   displayState = DisplayState.none;
   initDone = true; }

function setDisplayState (newDisplayState: DisplayState) {
   if (!initDone || displayState == newDisplayState) {
      return; }
   displayState = newDisplayState;
   setClass(rootElement, "dialogMgr_fadeIn", displayState == DisplayState.fadeIn);
      // The fadeIn style is added even if animation is not supported.
   setClass(rootElement, "dialogMgr_fadeOut", displayState == DisplayState.fadeOut && animationSupported);
      // The fadeOut style is only added when animation is supported.
   setClass(rootElement, "dialogMgr_transparentOverlay", displayState == DisplayState.transparentOverlay); }

function setWaitCursor (enabled: boolean) {
   setClass(rootElement, "dialogMgr_waitCursor", enabled); }

function getAutoFocusElement() : HTMLElement {
   const dp = activeDialogParms;
   return (
      !dp ? frameElement :
      dp.focusElement ? dp.focusElement :
      dp.cancelButton ? cancelButton :
      dp.okButton ? okButton :
      frameElement); }

function closeDialog (fade: boolean = false) {
   if (!initDone || activeDialogType == undefined) {
      return; }
   activeDialogType = undefined;
   setDisplayState(fade ? DisplayState.fadeOut : DisplayState.none);
   stopFocusJail();
   if (activeDialogParms && activeDialogParms.onClose) {
      activeDialogParms.onClose(dialogResult); }}

function updateDialog (dp: DialogParms) {
   headerElement.style.display = (dp.titleText) ? "" : "none";
   headerElement.textContent = dp.titleText || "";
   contentElement.innerHTML = "";                          // removes all child elements
   contentElement.appendChild(dp.content);
   nextTick(() => {                                        // element must be visible for scrollTop/Left to work (and in Firefox even rendered by the browser)
      contentElement.scrollTop = 0;
      contentElement.scrollLeft = 0; });
   setClass(frameElement, "dialogMgr_wide", !!dp.wide);
   footerElement.style.display = (dp.okButton || dp.cancelButton) ? "" : "none";
   okButton.style.display = dp.okButton ? "" : "none";
   cancelButton.style.display = dp.cancelButton ? "" : "none"; }

function openModalDialog (dp: DialogParms) {
   init();
   closeDialog();
   updateDialog(dp);
   cancelDelayedDisplayTimer();
   activeDialogType = dp.dialogType;
   activeDialogParms = dp;
   dialogResult = dp.defaultDialogResult;
   setDisplayState(DisplayState.fadeIn);
   setWaitCursor(dp.dialogType == DialogType.progressInfo);
   getAutoFocusElement().focus();
   startFocusJail(); }

//--- Event handling -----------------------------------------------------------

function animationEndEventHandler() {
   if (displayState == DisplayState.fadeOut) {
      setDisplayState(DisplayState.none); }}

function rootElementClickEventHandler (event: Event) {
   if (event.target == rootElement && activeDialogType != undefined && activeDialogParms && activeDialogParms.closeEnabled) {
      closeDialog(); }}

function okButtonClickEventHandler() {
   if (activeDialogParms && activeDialogParms.formInputProcessor) {
      try {
         dialogResult = activeDialogParms.formInputProcessor(); }
       catch (e) {
         // if (!(e instanceof FormInputProcessorException)) {   -> does not work with IE11
         if (!e.isFormInputProcessorException) {
            alert("Error in formInputProcessor: " + e); }
         return; }}
    else {
      dialogResult = true; }
   closeDialog(); }

function cancelButtonClickEventHandler() {
   closeDialog(); }

function documentKeyDownEventHandler (event: KeyboardEvent) {
   if (activeDialogType != undefined) {
      if ((event.key == "Escape" || event.key == "Esc") && activeDialogParms && activeDialogParms.closeEnabled) {
         event.preventDefault();
         closeDialog(); }}
   if (displayState == DisplayState.transparentOverlay) {
      event.preventDefault(); }}

//--- Focus jail ---------------------------------------------------------------

function startFocusJail() {
   stopFocusJail();
   document.addEventListener("focusin", documentFocusInEventHandler); }

function stopFocusJail() {
   document.removeEventListener("focusin", documentFocusInEventHandler); }

function documentFocusInEventHandler (event: Event) {
   const t = event.target;
   if (t instanceof Element && !rootElement.contains(t)) {
      getAutoFocusElement().focus(); }}

//--- Delayed display ----------------------------------------------------------

var delayedDisplayTimerId: number | undefined;
var delayedDialogType:     DialogType | undefined;

function startDelayedDisplayTimer (dialogType: DialogType, delayTime: number, callback: Function) {
   cancelDelayedDisplayTimer();
   delayedDialogType = dialogType;
   delayedDisplayTimerId = setTimeout(timeout, delayTime);
   function timeout() {
      delayedDisplayTimerId = undefined;
      callback(); }}

function cancelDelayedDisplayTimer() {
   if (delayedDisplayTimerId) {
      clearTimeout(delayedDisplayTimerId);
      delayedDisplayTimerId = undefined; }
   delayedDialogType = undefined; }

//--- Main dialog functions ----------------------------------------------------

function createFragment (html: string) : DocumentFragment {
   return document.createRange().createContextualFragment(html); }

function genContentTextElement (msgText: string) : HTMLElement {
   const e = document.createElement("div");
   e.className = "dialogMgr_contentTextPreWrap";
   e.textContent = msgText;
   return e; }

function genContentFrameElement (contentNode: Node) : HTMLElement {
   const e = document.createElement("div");
   e.className = "dialogMgr_contentPadding";
   e.appendChild(contentNode);
   return e; }

export interface MsgParms {
   titleText?:     string;
   msgText?:       string;             // preformatted text (with newline characters)
   msgHtml?:       string;             // HTML text
   msgNode?:       Node;               // DOM node / element / DocumentFragment
      // The three msg* fields are alternatives. Only one of them is used for the message text.
   wide?:          boolean; }          // false=small, true=wide, undefined=automatic width

function getDialogParmsFromMsgParms (mp: MsgParms) : DialogParms {
   return {
      dialogType: DialogType.prompt,
      titleText: mp.titleText,
      content:
         mp.msgText ? genContentTextElement(mp.msgText) :
         mp.msgHtml ? genContentFrameElement(createFragment(mp.msgHtml)) :
         mp.msgNode ? genContentFrameElement(mp.msgNode) :
         genContentTextElement("(no text)"),
      wide:
         (mp.wide != undefined) ? mp.wide :
         mp.msgText ? mp.msgText.length > 500 :
         mp.msgHtml ? mp.msgHtml.length > 800 :
         false}; }

// Displays a permanent message that can not be closed by the user.
// The user has to re-load the page to continue.
export function showFatalError (mp: MsgParms) {
   const dp : DialogParms = {
      ...getDialogParmsFromMsgParms(mp),
      dialogType: DialogType.fatalError};
   if (dp.titleText == undefined) {
      dp.titleText = "Fatal error"; }
   openModalDialog(dp); }

var progressInfoTitleText: string | undefined;

export interface ProgressInfoParms extends MsgParms {
   delayTime?:     number; }           // delay time (in ms) to show the progress info popup

// Displays a modal popup with progress information.
// Using the delayTime parameter, display of the popup can be delayed.
// The titleText parameter is preserved and applied to future calls until closeProgressInfo() is called.
export function showProgressInfo (mp: ProgressInfoParms) {
   init();
   progressInfoTitleText = mp.titleText || progressInfoTitleText;   // keep previous title if new one is undefined or empty
   if (mp.delayTime && mp.delayTime > 0 && activeDialogType == undefined) {
      setDisplayState(DisplayState.transparentOverlay);
      setWaitCursor(true);
      startDelayedDisplayTimer(DialogType.progressInfo, mp.delayTime, () => {
         showProgressInfo({...mp, delayTime: 0}); });
      return; }
   const dp : DialogParms = {
      ...getDialogParmsFromMsgParms(mp),
      dialogType: DialogType.progressInfo,
      titleText: progressInfoTitleText};
   if (activeDialogType == DialogType.progressInfo) {
      updateDialog(dp); }
    else {
      openModalDialog(dp); }}

// Closes a progress info popup.
// When no progress info popup is shown oder pending (with delay), this function has no effect.
export function closeProgressInfo() {
   if (!initDone) {
      return; }
   if (delayedDialogType == DialogType.progressInfo) {
      cancelDelayedDisplayTimer(); }
   if (activeDialogType == DialogType.progressInfo) {
      closeDialog(true); }
    else if (activeDialogType == undefined) {
      setDisplayState(DisplayState.none);
      setWaitCursor(false); }
   progressInfoTitleText = undefined; }

export function showMsg (mp: MsgParms) : Promise<void> {
   return new Promise(executor);
   function executor (resolve: () => void, _reject: Function) {
      const dp : DialogParms = {
         ...getDialogParmsFromMsgParms(mp),
         closeEnabled: true,
         okButton:     true,
         onClose:      resolve};
      openModalDialog(dp); }}

// The returned promise yields true when the confirmation prompt has been affirmed.
export function promptConfirmation (mp: MsgParms) : Promise<boolean> {
   return new Promise(executor);
   function executor (resolve: (result: boolean) => void, _reject: Function) {
      const dp : DialogParms = {
         ...getDialogParmsFromMsgParms(mp),
         closeEnabled:        true,
         okButton:            true,
         cancelButton:        true,
         defaultDialogResult: false,
         onClose:             resolve };
      openModalDialog(dp); }}

export interface PromptInputParms {
   promptText:     string;
   titleText?:     string; }

export function promptInput (pp: PromptInputParms) : Promise<string|undefined> {
   return new Promise(executor);
   function executor (resolve: (result: string) => void, _reject: Function) {
      const template = `
         <form class="dialogMgr_contentPadding">
          <div class="dialogMgr_promptText"></div>
          <div style="margin-top: 10px;">
           <input type="text" required style="width: 100%">
          </div>
         </form>`;
      const fragment = createFragment(template);
      fragment.querySelector(".dialogMgr_promptText")!.textContent = pp.promptText;
      const formElement = <HTMLFormElement>fragment.querySelector("form");
      const inputElement = <HTMLInputElement>fragment.querySelector("input");
      formElement.addEventListener("submit", formSubmitEventListener);
      inputElement.addEventListener("blur", trimInput);
      let reportValidityActive = false;                    // necessary for the reportValidity polyfill
      function formSubmitEventListener (event: Event) {
         trimInput();
         if (reportValidityActive) {
            return; }
         event.preventDefault();
         okButton.click(); }
      function trimInput() {
         inputElement.value = inputElement.value.trim(); }
      function formInputProcessor() : string {
         reportValidityActive = true;
         const isValid = formElement.reportValidity();
         reportValidityActive = false;
         if (!isValid) {
            throw new FormInputProcessorException(); }
         return inputElement.value.trim(); }
      const dp : DialogParms = {
         dialogType:          DialogType.prompt,
         content:             fragment,
         titleText:           pp.titleText,
         closeEnabled:        true,
         okButton:            true,
         cancelButton:        true,
         focusElement:        inputElement,
         formInputProcessor:  formInputProcessor,
         onClose:             resolve };
      openModalDialog(dp); }}

//--- Toast --------------------------------------------------------------------

const enum ToastDisplayState { none, fadeIn, fadeOut }
var toastDisplayState :      ToastDisplayState;
var toastTimerId:            number | undefined;

function setToastDisplayState (newDisplayState: ToastDisplayState) {
   setClass(toastRootElement, "dialogMgr_fadeIn", newDisplayState == ToastDisplayState.fadeIn);
   setClass(toastRootElement, "dialogMgr_fadeOut", newDisplayState == ToastDisplayState.fadeOut && animationSupported);
   toastDisplayState = newDisplayState; }

function toastAnimationEndEventHandler() {
   if (toastDisplayState == ToastDisplayState.fadeOut) {
      setToastDisplayState(ToastDisplayState.none); }}

export interface ToastParms {
   msgText:        string;
   duration?:      number; }           // duration in ms, default is defaultToastDuration

const defaultToastDuration = 1500;

export function showToast (tp: ToastParms) {
   init();
   if (toastTimerId) {
      clearTimeout(toastTimerId);
      toastTimerId = undefined; }
   toastBoxElement.textContent = tp.msgText;
   setToastDisplayState(ToastDisplayState.fadeIn);
   const duration = tp.duration || defaultToastDuration;
   toastTimerId = setTimeout(timeout, duration);
   function timeout() {
      toastTimerId = undefined;
      setToastDisplayState(ToastDisplayState.fadeOut); }}

//--- Templates ----------------------------------------------------------------

const cssTemplate = `
 @keyframes dialogMgr_fadeIn {
    from { opacity: 0; }
      to { opacity: 1; }}
 @keyframes dialogMgr_fadeOut {
    from { opacity: 1; }
      to { opacity: 0; }}
 .dialogMgr_root {
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    overflow: hidden;
    font-size: 1rem;
    background-color: rgba(64, 64, 64, 0.5);
    box-sizing: border-box;
    z-index: 990; }
 .dialogMgr_root.dialogMgr_fadeIn {
    display: flex;
    animation: dialogMgr_fadeIn 150ms ease-in forwards; }
 .dialogMgr_root.dialogMgr_fadeOut {
    display: flex;
    animation: dialogMgr_fadeOut 190ms ease-in forwards; }
 .dialogMgr_root.dialogMgr_transparentOverlay {
    display: flex;
    background-color: transparent; }
 .dialogMgr_root.dialogMgr_transparentOverlay > * {
    display: none; }
 .dialogMgr_upperFiller {
    flex-grow: 2;
    visibility: hidden; }
 .dialogMgr_lowerFiller {
    flex-grow: 3;
    visibility: hidden; }
 .dialogMgr_frame {
    position: relative;
    width: 500px;
    background-color: #fff;
    border-radius: 4px;
    outline: none; }
 .dialogMgr_frame.dialogMgr_wide {
    width: 800px; }
 .dialogMgr_header {
    font-size: 1.2rem;
    line-height: 1.125;
    font-weight: bold;
    padding: 18px 21px;
    border-bottom: 1px solid #ddd; }
 .dialogMgr_content {
    max-height: calc(100vh - 180px);
    overflow: auto; }
 .dialogMgr_contentPadding {
    padding: 21px; }
 .dialogMgr_contentTextPreWrap {
    padding: 21px;
    white-space: pre-wrap; }
 .dialogMgr_footer {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #ddd;
    background: #fcfcfc;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    padding: 14px; }
 .dialogMgr_footer button {
    min-width: 70px;
    margin-left: 14px; }
 .dialogMgr_waitCursor {
    cursor: wait; }

 .dialogMgr_toastRoot {
    display: none;
    visibility: hidden;
    position: fixed;
    box-sizing: border-box;
    left: 0;
    right: 0;
    bottom: 30px;
    z-index: 991; }
 .dialogMgr_toastRoot.dialogMgr_fadeIn {
    display: flex;
    animation: dialogMgr_fadeIn 150ms ease-in forwards; }
 .dialogMgr_toastRoot.dialogMgr_fadeOut {
    display: flex;
    animation: dialogMgr_fadeOut 190ms ease-in forwards; }
 .dialogMgr_toastBox {
    visibility: visible;
    bottom: 0;
    max-width: 400px;
    padding: 15px;
    margin: 0 auto;
    font-size: 1rem;
    color: #fff;
    background-color: #555;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
    border-radius: 6px; }`;

const htmlTemplate = `
 <div class="dialogMgr_root">
  <div class="dialogMgr_upperFiller"></div>
  <div class="dialogMgr_frame" tabindex="-1">
   <div class="dialogMgr_header"></div>
   <div class="dialogMgr_content"></div>
   <div class="dialogMgr_footer">
    <button class="dialogMgr_okButton primary">
     OK
    </button>
    <button class="dialogMgr_cancelButton">
     Cancel
    </button>
   </div>
  </div>
  <div class="dialogMgr_lowerFiller"></div>
 </div>

 <div class="dialogMgr_toastRoot">
  <div class="dialogMgr_toastBox"></div>
 </div>`;

//--- General helper routines --------------------------------------------------

// This function is necessary because IE11 does not fully implement ClassList.toggle().
function setClass (element: Element, cssClassName: string, enabled: boolean) {
   const cl = element.classList;
   if (enabled) {
      cl.add(cssClassName); }
    else {
      cl.remove(cssClassName); }}

let dummyResolvedPromise: Promise<void>;

function nextTick (callback: () => void) {
   if (!dummyResolvedPromise) {
      // The Promise must only be created after a possibly existing polyfill is loaded.
      dummyResolvedPromise = Promise.resolve(); }
   void dummyResolvedPromise.then(callback); }
