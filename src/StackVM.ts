import { Action } from "./Action";
import { Instruction, Value, ValueType } from "./Instruction";

export class StackVM {
    public operands : Stack<Value> = new Stack;

    public frames : Stack<StackFrame> = new Stack;

    public heap : Heap<Value> = new Heap;

    public strings : StringsHeap = new StringsHeap;

    public registers : StackVMRegisters = new StackVMRegisters( this );

    public actions : Map<string, Action> = new Map;

    public instructions : Instruction[] = [];

    maxStackSize : number = Infinity;

    constructor ( actions : Action[] = [], instructions : Instruction[] = [] ) {
        this.extend( actions );

        this.feed( instructions );
    }

    reset () : this {
        this.operands = new Stack;
        this.frames = new Stack;
        this.heap = new Heap;
        this.strings = new StringsHeap;
        this.registers = new StackVMRegisters( this );

        this.instructions = [];

        return this;
    }

    extend ( actions : Action[] ) : this {
        for ( let action of actions ) {
            action.setup( this );
        }

        return this;
    }

    feed ( instructions : Instruction[] ) : this {
        this.instructions = this.instructions.concat( instructions );

        return this;
    }

    async execute () {
        if ( this.registers.stackPointer > this.maxStackSize ) {
            return new Error( `Stack Overflow.` );
        }

        const instruction = this.instructions[ this.registers.codePointer ];
        
        if ( !this.actions.has( instruction.name ) ) {
            return new Error( `No registered action named "${ instruction.name }".` );
        }

        const action = this.actions.get( instruction.name );

        let error = action.check( instruction.name, instruction.parameters );

        if ( error ) {
            return error;
        }

        try {
            return await action.execute( this, instruction.name, instruction.parameters );
        } catch ( error ) {
            return error;
        } finally {
            this.registers.codePointer++;
        }
    }

    async * stepByStep () {
        while ( this.registers.codePointer < this.instructions.length ) {
            let result = await this.execute();

            yield result;

            if ( result instanceof StopError ) {
                break;
            }
        }
    }

    async executeAll () {
        for await ( let error of this.stepByStep() ) {
            if ( error instanceof Error && !( error instanceof StopError ) ) {
                throw error;
            }
        }
    }
}

export class RuntimeError extends Error {
    constructor ( message : string ) {
        super( `Runtime Error: ${ message }.` );
    }
}

export class StopError extends Error {
    constructor () {
        super( null );
    }
}

export class StackFrame {
    public framePointer : number;
    public codePointer : number;

    constructor ( framePointer : number, codePointer : number ) {
        this.framePointer = framePointer;
        this.codePointer = codePointer;
    }
}

export class StackVMRegisters {
    protected vm : StackVM;
    
    public framePointer : number = 0;
    public globalPointer : number = 0;
    public codePointer : number = 0;

    public get stackPointer (): number {
        return this.vm.operands.count;
    }

    constructor ( vm : StackVM ) {
        this.vm = vm;
    }
}

export class Stack<I> {
    list : I[] = [];

    get count () : number {
        return this.list.length;
    }

    load ( index : number ) : I {
        if ( index < 0 ) {
            throw new Error( `Index ${ index } must be greater than zero.` );
        } else if ( index >= this.count ) {
            throw new Error( `Index ${ index } must be lesser than ${ this.count }.` );
        }

        return this.list[ index ];
    }

    store ( index : number, item : I ) {
        if ( index < 0 ) {
            throw new Error( `Index ${ index } must be greater than zero.` );
        } else if ( index >= this.count ) {
            throw new Error( `Index ${ index } must be lesser than ${ this.count }.` );
        }

        this.list[ index ] = item;
    }

    push ( item : I ) {
        this.list.push( item );
    }

    pop () : I {
        if ( this.list.length == 0 ) {
            throw new Error( `Cannot pop item out of an empty stack.` );
        }

        return this.list.pop();
    }
}

export class Heap<I> {
    protected memory : Value[] = [];

    protected addresses : Map<number, number> = new Map;

    alloc ( size : number ) : number {
        const address : number = this.memory.length;

        for ( let i = 0; i < size; i++ ) {
            this.memory.push( new Value( ValueType.Integer, 0 ) );
        }

        this.addresses.set( address, size );

        return address;
    }

    free ( address : number ) : void {
        if ( !this.addresses.has( address ) ) {
            throw new Error( `Trying to free unregistered address ${ address }.` );
        }

        const size = this.addresses.get( address );

        for ( let i = 0; i < size; i++ ) {
            this.memory[ address + i ] = null;
        }

        this.addresses.delete( address );
    }

    load ( address : number ) : Value {
        if ( address < 0 || address >= this.memory.length || this.memory[ address ] == null ) {
            throw new Error( `Trying to access invalid memory address ${ address }.` );
        }

        return this.memory[ address ];
    }

    store ( address : number, value : Value ) : void {
        if ( address < 0 || address >= this.memory.length || this.memory[ address ] == null ) {
            throw new Error( `Trying to mutate invalid memory address ${ address }.` );
        }

        this.memory[ address ] = value;
    }
}

export class StringsHeap {
    public positions : Map<string, number> = new Map;
    public strings : string[] = [];

    protected counter : number = 0;

    store ( string : string ) : number {
        if ( this.positions.has( string ) ) {
            return this.positions.get( string );
        }

        this.positions.set( string, this.counter );

        this.strings.push( string );

        return this.counter++;
    }

    load ( position : number ) : string {
        if ( position < 0 || position >= this.strings.length ) {
            throw new Error( `Invalid string address out of bounds 0 <= ${ position } <= ${ this.strings.length - 1 }.` );
        }

        return this.strings[ position ];
    }
}