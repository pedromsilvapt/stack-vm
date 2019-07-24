import { Action } from "../Action";
import { StackVM } from "../StackVM";
import { ValueType, Value } from "../Instruction";

// Suspending a fiber means setting the current active fiber to null
export class FiberSuspendAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'suspend', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        vm.scheduler.suspend();
    }
}

// Spawning a fiber accepts an instruction address from where the Fiber shall be run
export class FiberSpawnAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'spawn', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const address : Value<number> = vm.operands.pop();

        this.expect( address, ValueType.AddressCode );

        const newFiber = vm.createFiber();

        newFiber.registers.codePointer = address.value;

        vm.valuesPool.free( address );

        // for ( let i = 1; i <= loadStoreCount; i++ ) {
        //     newFiber.operands.push( vm.operands.load( vm.operands.count - ( loadStoreCount - i ) ) );
        // }

        vm.operands.push( vm.valuesPool.acquire( ValueType.Integer, newFiber.id ) );
    }
}

// In order to allow data to be passed between different fibers, we have the send action.
// It expects two parameters to be in the operands stack: a value, and a fiber id beneath
export class FiberSendAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'send', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : Value<any> = vm.operands.pop();

        const id : Value<number> = vm.operands.pop();

        this.expect( id, ValueType.Integer );

        const fiber = vm.fibers[ id.value ];

        if ( !fiber ) {
            throw new Error( `Can't send to non existing fiber ${ id }.` );
        }

        vm.valuesPool.free( id );

        fiber.operands.push( value );
    }
}

export class FiberSwitchAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'switch', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const id : Value<number> = vm.operands.pop();

        this.expect( id, ValueType.Integer );

        const fiber = vm.fibers[ id.value ];

        if ( !fiber ) {
            throw new Error( `Can't switch to non existing fiber ${ id }.` );
        }

        vm.valuesPool.free( id );

        vm.scheduler.switch( fiber );
    }
}

// Unlike switching, which only sets the 
export class FiberRunAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'run', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const id : Value<number> = vm.operands.pop();

        this.expect( id, ValueType.Integer );

        const fiber = vm.fibers[ id.value ];

        if ( !fiber ) {
            throw new Error( `Can't switch to non existing fiber ${ id }.` );
        }

        vm.valuesPool.free( id );

        vm.scheduler.run( fiber );
    }
}

export class FiberYieldAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'yield', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const count : number = parameters[ 0 ].value;

        if ( !vm.fiber.caller ) {
            throw new Error( `Cannot yield on a fiber that was not called by another.` );
        }

        for ( let i = 1; i <= count; i++ ) {
            vm.fiber.caller.operands.push( vm.fiber.operands.load( vm.fiber.operands.count - i ) );
        }

        vm.fiber = vm.fiber.caller;
    }
}

export class FiberYieldNAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'yieldn', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const count : Value<number> = vm.operands.pop();

        this.expect( count, ValueType.Integer );

        return vm.actions.get( 'fiber' ).execute( vm, 'yield', [ count ] );
    }
}

export enum FiberStatus {
    Dead = 0,
    Sleeping = 1,
    Running = 2
}

export class FiberCurrentAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'fiber', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        vm.fiber.operands.push( vm.valuesPool.acquire( ValueType.Integer, vm.fiber.id ) );
    }
}

export class FiberStatusAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'fiberst', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const id : Value<number> = vm.operands.pop();

        this.expect( id, ValueType.Integer );

        const fiber = vm.fibers[ id.value ];

        let state = FiberStatus.Sleeping;

        if ( !fiber ) {
            state = FiberStatus.Dead;
        } else if ( fiber.id == vm.fiber.id ) {
            state = FiberStatus.Running;
        }
        
        vm.fiber.operands.push( vm.valuesPool.acquire( ValueType.Integer, state ) );
    }
}

// Killing a fiber has two possible outcomes: yielding control to the caller (if there is one)
// or suspending the vm if there was none
export class FiberKillAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'kill', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const count : Value<number> = parameters[ 0 ];

        const current = vm.fiber;

        if ( current != null && current.caller != null ) {
            vm.actions.get( 'yield' ).execute( vm, 'yield', [ count ] );

            delete vm.fibers[ current.id ];
        } else {
            vm.actions.get( 'stop' ).execute( vm, 'stop', [] );
        }
    }
}

export class FiberKillNAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'killn', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const count : Value<number> = vm.operands.pop();

        this.expect( count, ValueType.Integer );

        vm.actions.get( 'kill' ).execute( vm, 'kill', [ count ] );
    }
}

