import { Action } from "../Action";
import { ValueType, Value } from "../Instruction";
import { StackVM } from "../StackVM";

export class PushIntegerAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'pushi', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        vm.operands.push( parameters[ 0 ] );
    }
}

export class PushRepeatAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'pushn', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : number = parameters[ 0 ].value;

        for ( let i = 0; i < value; i++ ) {
            vm.operands.push( new Value( ValueType.Integer, 0 ) );
        }
    }
}

export class PushFloatAction extends Action {
    parameters : ValueType[][] = [ [ ValueType.Float, ValueType.Integer ] ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'pushf', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        vm.operands.push( new Value( ValueType.Float, parameters[ 0 ].value ) );
    }
}

export class PushStringAction extends Action {
    parameters : ValueType[] = [ ValueType.String ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'pushs', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const str : string = parameters[ 0 ].value;
        
        const address = vm.strings.store( str );

        vm.operands.push( new Value( ValueType.AddressString, address ) );
    }
}

export class PushGlobalOperandAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'pushg', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : number = parameters[ 0 ].value;
        
        const index = vm.registers.globalPointer + value;

        vm.operands.push( vm.operands.load( index ).clone() );
    }
}

export class PushFrameOperandAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'pushl', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : number = parameters[ 0 ].value;
        
        const index = vm.registers.framePointer + value;

        vm.operands.push( vm.operands.load( index ).clone() );
    }
}

export class PushStackAddressAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'pushsp', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        vm.operands.push( new Value( ValueType.AddressStack, vm.registers.stackPointer ) );
    }
}

export class PushFrameAddressAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'pushfp', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        vm.operands.push( new Value( ValueType.AddressStack, vm.registers.framePointer ) );
    }
}

export class PushGlobalAddressAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'pushgp', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        vm.operands.push( new Value( ValueType.AddressStack, vm.registers.globalPointer ) );
    }
}