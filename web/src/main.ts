import type { WasmExports } from './init';
import exports from './init';

const input: HTMLInputElement = document.querySelector("#bf-input")!;
const outputSpan: HTMLSpanElement = document.querySelector("#bf-output")!;

document.querySelector("#bf-run")?.addEventListener('click', (e) => {
  e.preventDefault();
  
  (async () => {
    // Clear ouput
    outputSpan!.textContent = "";
    let call = await exports;
    const promise: Promise<string> = new Promise((resolve, _rejext) => {
      exec_brainfuck(
        input.value, 
        call,
        // Output callback
        (v) => {
          outputSpan!.textContent += v;
        }
      ).then(() => {
        resolve("Proram finished");
      });
    });

    let returnVal = await asyncCallWithTimeout(promise, 1000);
    console.info(returnVal);
    // clear all memory used by the program
    call.clear_mem();
  })();
});

async function exec_brainfuck(source: string, exports: WasmExports, print: (i: string) => void) {
  let mem = new Uint8Array(exports.memory.buffer);
  for_loop: for (let i = 0; i < source.length; i++) {
    let c = source.charCodeAt(i);
    let return_val = exports.exec_char(c);
    
    // console.log("current i", i, return_val, c, mem[exports.MEM_PTR.value]);
    // break;
    switch (return_val) {
      case 1:
        // needs input
        mem[30000] = await receive_input();
        exports.read_input();
        break;
      case 2:
        print(String.fromCharCode(mem[30001]));
        break;
      case 3:
        exports.store_program_pointer(i);
        break;
      case 4:
        i = exports.jump() - 1; // because i is incremented next iteration
        if (i == -1) {
          break for_loop;
        }
        break;
    }
  }
}

async function asyncCallWithTimeout(asyncPromise: Promise<string>, timeLimit: number): Promise<string> {
  let timeoutHandle: number;
  
  const timeoutPromise: Promise<string> = new Promise((_resolve, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new Error("Async call timeout limit reached.")),
      timeLimit
    );
  });
  
  return Promise.race([asyncPromise, timeoutPromise]).then((result) => {
    clearTimeout(timeoutHandle);
    return result;
  });
}

async function receive_input(): Promise<number> {
  return 0;
}

export {};
