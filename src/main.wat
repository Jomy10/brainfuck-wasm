(module
    (import "env" "dbg" (func $dbg (param i32)))
    (import "env" "runtime_err" (func $runtime_err (param (;ptr;) i32) (param (;len;) i32)))

    (memory $mem 1) ;; 64_000 bytes
    (global $ARR_SIZE i32 (i32.const 30000))
    (global $MEM_PTR (mut i32) (i32.const 0))
    (global $INPUT_PTR i32 (i32.const 30000))
    (global $OUTPUT_PTR i32 (i32.const 30001))
    (global $LOOP_BRANCH_START i32 (i32.const 30002))
    (global $LOOP_PTR (mut i32) (i32.const 30002))
    
    (data (i32.const 40000) "Closing [ did not match any opening [")
    
    ;; execute command for character
    ;; # Return
    ;; - 0
    ;; - 1: needs input
    ;; - 2: gave output
    ;; - 3: needs jump ptr
    ;; - 4: jump
    (func $exec_char (param $char i32) (result i32)
        (block $switch
            ;; >
            local.get $char
            i32.const 62
            i32.eq
            if
                global.get $MEM_PTR
                i32.const 1
                i32.add
                global.set $MEM_PTR
        
                global.get $MEM_PTR
                global.get $ARR_SIZE
                i32.eq
                if
                    i32.const 0
                    global.set $MEM_PTR
                end
                
                br $switch
            end
    
            ;; <
            local.get $char
            i32.const 60
            i32.eq
            if
                global.get $MEM_PTR
                i32.const 0
                i32.eq
                if
                    global.get $ARR_SIZE
                    i32.const 1
                    i32.sub
                    global.set $MEM_PTR
                else
                    global.get $MEM_PTR
                    i32.const 1
                    i32.sub
                    global.set $MEM_PTR
                end
                
                br $switch
            end
    
            ;; +
            local.get $char
            i32.const 43
            i32.eq
            if
                global.get $MEM_PTR
                global.get $MEM_PTR
                i32.load8_u
                i32.const 1
                i32.add
                i32.store8
                
                br $switch
            end
    
            ;; -
            local.get $char
            i32.const 45
            i32.eq
            if
                global.get $MEM_PTR
                global.get $MEM_PTR
                i32.load8_u
                i32.const 1
                i32.sub
                i32.store8
                
                br $switch
            end
    
            ;; ,
            local.get $char
            i32.const 44
            i32.eq
            if
                ;; ask for input
                i32.const 1
                return
            end
    
            ;; .
            local.get $char
            i32.const 46
            i32.eq
            if
                ;; return output
                global.get $OUTPUT_PTR
                global.get $MEM_PTR
                i32.load8_u
                
                i32.store8
                
                i32.const 2
                return
            end
            
            ;; [
            local.get $char
            i32.const 91
            i32.eq
            if
                ;; ask for program pointer
                i32.const 3
                return
            end
            
            ;; ]
            local.get $char
            i32.const 93
            i32.eq
            if
                global.get $MEM_PTR
                i32.load8_u
                i32.eqz
                if
                    ;; decrease jump ptr
                    global.get $LOOP_PTR
                    i32.const 4
                    i32.sub
                    global.set $LOOP_PTR
                else
                    ;; not equal to zero => loop
                    i32.const 4
                    return
                end
            end
        )

        i32.const 0
    )
    
    (func $store_program_pointer (param $pp i32)
        global.get $LOOP_PTR
        local.get $pp
        i32.store
        
        global.get $LOOP_PTR
        i32.const 4
        i32.add
        global.set $LOOP_PTR
    )
    
    (func $jump (result i32)
        ;; decrease loop pointer
        global.get $LOOP_PTR
        i32.const 4
        i32.sub
        global.set $LOOP_PTR
        
        global.get $LOOP_PTR
        global.get $LOOP_BRANCH_START
        i32.lt_u
        if
            i32.const 40000
            i32.const 37
            call $runtime_err
            
            i32.const -1
            return
        end
        
        global.get $LOOP_PTR
        i32.load
    )
    
    (func $read_input
        ;; load input into current address
        global.get $MEM_PTR

        global.get $INPUT_PTR
        i32.load8_u

        i32.store8
    )
    
    ;; Clears all memory
    (func $clear_mem (local $i i32)
        (loop $lp
            local.get $i
            i32.const 0
            i32.store8
        
            local.get $i
            i32.const 1
            i32.add
            local.tee $i
    
            i32.const 64000
            i32.lt_u
            if
                br $lp
            end
        )
    )
    
    (export "clear_mem" (func $clear_mem))
    
    (export "MEM_PTR" (global $MEM_PTR))
    
    (export "store_program_pointer" (func $store_program_pointer))
    (export "read_input" (func $read_input))
    (export "jump" (func $jump))
    
    (export "exec_char" (func $exec_char))
    (export "memory" (memory $mem))
)
