import type { WasmExports } from './init';
import { MainThreadMessage, MainThreadMessageType, WorkerMessageType } from './worker_types';
import exports from './init';

let inputBuffer: number | null = null;
let interruptSignal = 0;
// on message received by main thread (received source code)
onmessage = (e: MessageEvent<MainThreadMessage>) => {
  switch (e.data.type) {
    case MainThreadMessageType.SourceCode:
      run(e.data.value as string);
      break;
    case MainThreadMessageType.Input:
      inputBuffer = e.data.value as number;
      break;
    case MainThreadMessageType.ProgramInterrupt:
      interruptSignal = e.data.value as number;
      break;
  }
};

/** Executes when run is pressed */
export async function run(source: string) {
  let call = await exports;
  // clear all memory used by the previous program
  call.clear_mem();
  // reset interruptSignal
  interruptSignal = 0;

  await exec_brainfuck(
    // input.value,
    source,
    call,
    // output callback
    (v) => {
      postMessage({
        type: WorkerMessageType.ProgramOutput,
        value: v
      });
    }
  );
  
  console.log("Program exited.")
};

async function exec_brainfuck(source: string, exports: WasmExports, print: (i: string) => void) {
  let mem = new Uint8Array(exports.memory.buffer);
  for_loop: for (let i = 0; i < source.length; i++) {
    if (interruptSignal != 0) {
      console.error("Received interrupt signal", interruptSignal);
      return;
    }
    
    let c = source.charCodeAt(i);
    let return_val = exports.exec_char(c);
    
    // console.log("current i", i, return_val, c, mem[exports.MEM_PTR.value]);
    // break;
    switch (return_val) {
      case 1:
        // needs input
        mem[30000] = await receive_input();
        console.log("Received input", mem[30000]);
        exports.read_input();
        break;
      case 2:
        // console.debug(mem[30001], String.fromCharCode(mem[30001]));
        print(String.fromCharCode(mem[30001]));
        break;
      case 3:
        exports.store_program_pointer(i);
        break;
      case 4:
        i = exports.jump() - 1; // because i is incremented next iteration
        // console.log("jumping to", i);
        if (i == -2) { // jump returns -1 when an error occurs
          break for_loop;
        }
        break;
    }
  }
}

async function receive_input() {
  postMessage({
    type: WorkerMessageType.AskForInput
  });

  while (inputBuffer === null) {
    await new Promise(r => setTimeout(r, 100));
  }
  
  let char = inputBuffer;
  inputBuffer = null;
  return char;
}
