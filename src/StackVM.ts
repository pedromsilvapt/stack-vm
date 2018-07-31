import { Action } from "./Action";
import { Instruction, Value, ValueType } from "./Instruction";
import EventEmitter from 'eventemitter3';
import microtime from 'microtime';

export class StackVM {
    public fibers : StackVMFiber[] = [];

    public fiber : StackVMFiber = null;

    public heap : Heap = new Heap( this );

    public strings : StringsHeap = new StringsHeap;

    public actions : Map<string, Action> = new Map;

    public instructions : Instruction[] = [];

    public scheduler : StackVMScheduler = new StackVMScheduler( this );
    
    public valuesPool : ValuesPool = new ValuesPool();

    public instructionsCount : number = 0;

    public clocks = {
        cpu : new Clock(),
        user : new Clock()
    };

    public get operands () : Stack<Value> {
        if ( !this.fiber ) {
            return null;
        }

        return this.fiber.operands;
    }

    public get frames () : Stack<StackFrame> {
        if ( !this.fiber ) {
            return null;
        }
        
        return this.fiber.frames;
    }

    public get registers () : StackVMRegisters {
        if ( !this.fiber ) {
            return null;
        }

        return this.fiber.registers;
    }

    maxStackSize : number = Infinity;

    constructor ( actions : Action[] = [], instructions : Instruction[] = [] ) {
        this.extend( actions );

        this.feed( instructions );
    }

    reset () : this {
        this.heap = new Heap( this );
        this.strings = new StringsHeap;
        this.fiber = null;
        this.fibers = [];
        this.scheduler = new StackVMScheduler( this );

        this.instructions = [];

        this.clocks.cpu = new Clock();
        this.clocks.user = new Clock();

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

    createFiber () : StackVMFiber {
        const fiber = new StackVMFiber( this.fibers.length );

        this.fibers.push( fiber );

        return fiber;
    }

    createFiberAndSwitch () {
        const fiber = this.createFiber();

        this.fiber = fiber;
    }

    async execute ( options ?: { stopOn ?: { instruction ?: boolean; fiber ?: boolean; wait ?: boolean; } } ) {
        this.scheduler.busy = true;

        let error : Error = null;

        this.clocks.user.resume();

        this.clocks.cpu.resume();

        while ( error == null ) {
            debugger;

            try {
                if ( !this.fiber ) {
                    if ( options && options.stopOn && options.stopOn.wait ) {
                        break;
                    }
    
                    if ( this.scheduler.scheduled.length > 0 ) {
                        this.scheduler.suspend();
                    } else if ( this.scheduler.waiting.size === 0 ) {
                        break;
                    } else {
                        this.clocks.cpu.pause();

                        this.scheduler.busy = false;
    
                        await new Promise( resolve => this.scheduler.once( 'awake', resolve ) );
    
                        this.scheduler.busy = false;
    
                        this.clocks.cpu.resume();

                        this.scheduler.suspend();
                    }
                }
    
                const fiber = this.fiber;
    
                if ( fiber.registers.stackPointer > this.maxStackSize ) {
                    throw new Error( `Stack Overflow.` );
                }
    
                const instruction = this.instructions[ fiber.registers.codePointer ];
    
                if ( !instruction.action ) {
                    if ( !this.actions.has( instruction.name ) ) {
                        return new Error( `No registered action named "${ instruction.name }".` );
                    }
                    
                    instruction.action = this.actions.get( instruction.name );

                    let error = instruction.action.check( instruction.name, instruction.parameters );
            
                    if ( error ) {
                        throw error;
                    }
                }

                this.instructionsCount++;

                const action = instruction.action;                
                
                try {
                    action.execute( this, instruction.name, instruction.parameters );
                } finally {
                    fiber.registers.codePointer++;
                }
    
                if ( options && options.stopOn ) {
                    if ( options.stopOn.instruction ) {
                        break;
                    }
    
                    if ( options.stopOn.fiber && fiber != this.fiber ) {
                        break;
                    }
                }
            } catch ( err ) {
                error = err;
            }
        }

        this.clocks.user.pause();

        if ( error && !( error instanceof StopError ) ) throw error;
    }

    async * stepByStep () {
        while ( true ) {
            this.execute( { stopOn: { instruction: true } } );

            yield null;
        }
    }
}

export enum StackVMFiberState {
    Sleeping = 0,
    Running = 1,
    Finished = 2
}

export class StackVMFiber {
    public id : number;

    public caller : StackVMFiber = null;

    public operands : Stack<Value> = new Stack;

    public frames : Stack<StackFrame> = new Stack;

    public registers : StackVMRegisters = new StackVMRegisters( this );

    public state : StackVMFiberState = StackVMFiberState.Sleeping;

    constructor ( id : number ) {
        this.id = id;
    }
}

export interface StackVMFiberResult {
    fiber : StackVMFiber;
    args : any[];
}

export class StackVMScheduler extends EventEmitter {
    vm : StackVM;
    
    waiting : Map<StackVMFiber, Promise<Value<any>>>;

    scheduled : StackVMFiberResult[];

    busy : boolean = false;

    constructor ( vm : StackVM ) {
        super();

        this.vm = vm;
        this.waiting = new Map();
        this.scheduled = [];
    }

    waitFor ( fiber : StackVMFiber, promise : Promise<Value<any>> ) {
        if ( this.waiting.has( fiber ) ) {
            throw new Error( `The fiber is already waiting for a value, can't wait for any more.` );
        }

        if ( fiber.state !== StackVMFiberState.Sleeping ) {
            throw new Error( `Can't make a fiber that is not sleeping wait.` );
        }

        this.waiting.set( fiber, promise );

        promise.then( res => {
            this.waiting.delete( fiber );

            this.schedule( fiber, [ res ] )
        } );
    }

    schedule ( fiber : StackVMFiber, args : Value<any>[] ) {
        this.scheduled.push( { fiber, args } );

        if ( !this.busy && this.scheduled.length == 1 ) {
            this.emit( 'awake' );
        }
    }

    nextTick ( fiber : StackVMFiber ) {
        this.scheduled.unshift( { fiber, args: [] } );

        if ( !this.busy && this.scheduled.length == 1 ) {
            this.emit( 'awake' );
        }
    }

    yield ( args : Value<any>[] ) {
        const caller = this.vm.fiber.caller;

        for ( let arg of args ) {
            caller.operands.push( arg );
        }

        this.vm.fiber = caller;
    }

    switch ( fiber : StackVMFiber, args : Value<any>[] ) {
        for ( let arg of args ) {
            fiber.operands.push( arg );
        }

        this.vm.fiber = fiber;
    }

    run ( fiber : StackVMFiber, args : Value<any>[] ) {
        fiber.caller = this.vm.fiber;

        this.switch( fiber, args );
    }

    suspend () {
        if ( this.scheduled.length > 0 ) {
            const { fiber, args } = this.scheduled.shift();

            this.switch( fiber, args );
        } else {
            this.vm.fiber = null;
        }
    }

    reset () {
        this.waiting = new Map();
        this.scheduled = [];
        this.busy = false;
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
    protected vm : StackVMFiber;
    
    public framePointer : number = 0;
    public globalPointer : number = 0;
    public codePointer : number = 0;

    public get stackPointer (): number {
        return this.vm.operands.count;
    }

    constructor ( vm : StackVMFiber ) {
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

export class Heap {
    vm : StackVM;

    constructor ( vm : StackVM ) {
        this.vm = vm;
    }

    protected memory : Value[] = [];

    protected addresses : Map<number, number> = new Map;

    alloc ( size : number ) : number {
        const address : number = this.memory.length;

        for ( let i = 0; i < size; i++ ) {
            this.memory.push( this.vm.valuesPool.acquire( ValueType.Integer, 0 ) );
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

export class ValuesPool {
    protected pool : Value<any>[] = [];

    public cacheHitsCount : number = 0;

    public cacheMissesCount : number = 0;

    public maxLiveCount : number = 0;

    public liveCount : number = 0;

    public enabled : boolean;

    constructor ( enable : boolean = true ) {
        this.enabled = enable;
    }

    public get availableCount  () {
        return this.pool.length;
    }

    acquire <T> ( type : ValueType, value : T ) : Value<T> {
        if ( this.enabled ) {
            this.liveCount++;
    
            if ( this.liveCount > this.maxLiveCount ) {
                this.maxLiveCount = this.liveCount;
            }
    
            if ( this.pool.length > 0 ) {
                this.cacheHitsCount++;
                
                const obj = this.pool.pop();
                
                obj.type = type;
                obj.value = value;
                
                return obj;
            }
            
            this.cacheMissesCount++;
        }

        return new Value( type, value );
    }

    free ( value : Value<any> ) : void {
        if ( this.enabled ) {
            if ( this.liveCount > 0 ) {
                this.liveCount--;
            }
    
            if ( this.availableCount <= Math.max( this.liveCount * 2, 10 ) ) {
                // Right now the values pool is disabled because of unfound bugs
                this.pool.push( value );
            }
        }
    }
}

export type MicroTime = [ number, number ];

export class Clock {
    static add ( [ s1, m1 ] : MicroTime, [ s2, m2 ] : MicroTime ) : MicroTime {
        const m = m1 + m2;
    
        return [ s1 + s2 + Math.floor( m / 1000000 ), m % 1000000 ];
    }
    
    static sub ( [ s1, m1 ] : MicroTime, [ s2, m2 ] : MicroTime ) : MicroTime {
        const m = m1 - m2;
    
        const rm = m > 0
            ? m
            : 1000000 - Math.abs( m % 1000000 );
    
        return [ s1 - s2 - Math.floor( Math.abs( m ) / 1000000 ), rm ];
    }
    
    static humanize ( [ s, m ] : MicroTime ) : string {
        if ( s == 0 && m < 1000 ) {
            return `${ m }us`;
        } else if ( s == 0 ) {
            return `${ m / 1000 }ms`;
        } else {
            return `${ s + m / 1000000 }s`;
        }
    }

    savedTime : MicroTime = [ 0, 0 ];

    startTime : MicroTime = null;

    clocking : boolean = false;

    constructor ( autoStart : boolean = false ) {
        if ( autoStart ) {
            this.resume();
        }
    }

    resume () {
        if ( !this.clocking ) {
            this.clocking = true;

            this.startTime = microtime.nowStruct();
        }
    }

    pause () {
        if ( this.clocking ) {
            this.savedTime = this.duration;
            
            this.clocking = false;
        }
    }

    get partialDuration () : MicroTime {
        if ( this.clocking ) {
            const now = microtime.nowStruct();

            return Clock.sub( now, this.startTime );
        }

        return [ 0, 0 ];
    }

    get duration () : MicroTime {
        if ( this.clocking ) {
            return Clock.add( this.savedTime, this.partialDuration );
        }

        return this.savedTime;
    }
}