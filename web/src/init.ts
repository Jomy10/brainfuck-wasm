import wasmInit from "./../out/main.wasm?init";

export type WasmExports = {
  exec_char: (char: number) => number;
  memory: WebAssembly.Memory;

  /** Call after setting input in memory */
  read_input: () => void;
  /** Store the current program poiter into the loop buffer */
  store_program_pointer: (pp: number) => void;
  /** Returns the new program counter */
  jump: () => number;
  
  MEM_PTR: WebAssembly.Global;
  
  clear_mem: () => void;
};

export let mem: Uint8Array;
const exports: Promise<WasmExports> = (async() => {
  let instance: WebAssembly.Instance = await wasmInit({
    env: {
      dbg: (i: number) => { console.info("[DBG]", i); },
      runtime_err: (ptr: number, len: number) => {
        console.error(new TextDecoder("ascii").decode(mem.slice(ptr, ptr + len)));
      }
    }
  });
  mem = new Uint8Array((instance.exports as WasmExports).memory.buffer);
  return instance.exports as WasmExports;
})();

export default exports;
