import { ValueType, Value } from "../Instruction";
import { StackVM, StackFrame, RuntimeError, StopError } from "../StackVM";
import { Action } from "../Action";

export class JumpAction extends Action {
    parameters : ValueType[] = [ ValueType.AddressCode ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'jump', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const address : number = parameters[ 0 ].value;

        vm.registers.codePointer = address - 1;
    }
}

export class JumpConditionalAction extends Action {
    parameters : ValueType[] = [ ValueType.AddressCode ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'jz', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const address : number = parameters[ 0 ].value;

        const condition : Value<number> = vm.operands.pop();

        if ( !condition.value ) {
            vm.registers.codePointer = address - 1;
        }

        vm.valuesPool.free( condition );
    }
}

export class PushAddressAction extends Action {
    parameters : ValueType[] = [ ValueType.AddressCode ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'pusha', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const address : number = parameters[ 0 ].value;

        vm.operands.push( vm.valuesPool.acquire( ValueType.AddressCode, address ) );
    }
}

export class CallAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'call', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const address : Value<number> = vm.operands.pop();

        this.expect( address, ValueType.AddressCode );

        const frame = new StackFrame( vm.registers.framePointer, vm.registers.codePointer );

        vm.registers.framePointer = vm.registers.stackPointer;
        vm.registers.codePointer = address.value - 1;

        vm.frames.push( frame );
        
        vm.valuesPool.free( address );
    }
}

export class ReturnAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'return', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const frame : StackFrame = vm.frames.pop();

        while ( vm.registers.stackPointer > vm.registers.framePointer ) {
            vm.valuesPool.free( vm.operands.pop() );
        }

        vm.registers.framePointer = frame.framePointer;
        vm.registers.codePointer = frame.codePointer;
    }
}

export class StartAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'start', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) { }
}

export class NopAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'nop', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) { }
}

export class StopAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'stop', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        throw new StopError();
    }
}

export class ErrorAction extends Action {
    parameters : ValueType[] = [ ValueType.String ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'err', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        throw new RuntimeError( parameters[ 0 ].value );
    }
}