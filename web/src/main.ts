import RunWorker from './run.ts?worker';
import { MainThreadMessageType, WorkerMessage, WorkerMessageType } from './worker_types';

const input: HTMLTextAreaElement = document.querySelector("#bf-input")!;
const outputSpan: HTMLSpanElement = document.querySelector("#bf-output")!;
const programInput: HTMLInputElement = document.querySelector("#program-input")!;

if (!window.Worker) {
  console.error("Browser does not support web workers.");
}

const webWorker: Worker = new RunWorker();
let awaitingInput = 0;
let cancelInput = false;

// on run program
document.querySelector("#bf-run")?.addEventListener('click', (_) => {
  // clear output
  outputSpan.textContent = "";
  
  // Ask the web worker to execute the brainfuck code
  webWorker.postMessage({
    type: MainThreadMessageType.SourceCode,
    value: input.value
  });
  
  // Message received from worker
  webWorker.onmessage = (e: MessageEvent<WorkerMessage>) => {
    console.debug("Received message from worker thread", e);
    if (e.data.type == WorkerMessageType.ProgramOutput) {
      // on program output
      outputSpan!.textContent += e.data.value as string;
    } else if (e.data.type == WorkerMessageType.AskForInput) {
      awaitInput()
        .then((n) => {
          if (n != null) {
            --awaitingInput;
            webWorker.postMessage({
              type: MainThreadMessageType.Input,
              value: n
            });
          } 
        }).catch((_) => {});
    }
  };
});

/** Retrieves input from the user. Takes one character from the input buffer field */
async function awaitInput(): Promise<number> {
  awaitingInput++;

  while (programInput.value == "") {
    if (cancelInput == true) {
      cancelInput = false;
      throw new Error("");
    }

    await new Promise(r => setTimeout(r, 100));
  }
  
  let firstChar = programInput.value.charCodeAt(0);
  programInput.value = programInput.value.substring(1, programInput.value.length);
  
  return firstChar
}

const interruptButton = document.querySelector("#bf-interrupt");
// On interupt
interruptButton?.addEventListener('click', (_) => {
  webWorker.postMessage({
    type: MainThreadMessageType.ProgramInterrupt,
    value: 1
  });
  
  while (awaitingInput > 0) {
    awaitingInput--;
    programInput.value += "#";
  }
});

const escButton = document.querySelector("#bf-add-null");
escButton?.addEventListener('click', (_) => {
  if (awaitingInput > 0) {
    cancelInput = true;
  }
  
  awaitingInput--;
  // Send null character (0)
  webWorker.postMessage({
    type: MainThreadMessageType.Input,
    value: 0
  });
});

export {};
