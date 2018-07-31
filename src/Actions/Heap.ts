import { ValueType, Value } from "../Instruction";
import { StackVM } from "../StackVM";
import { Action } from "../Action";

export class AllocAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'alloc', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const size : Value<number> = parameters[ 0 ];

        const address = vm.heap.alloc( size.value );

        vm.operands.push( new Value( ValueType.AddressHeap, address ) );
    }
}

export class AllocNAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'allocn', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const offset : Value<number> = vm.operands.pop();
        
        this.expect( offset, ValueType.Integer );

        vm.actions.get( 'alloc' ).execute( vm, name, [ offset ] );
    }
}

export class FreeAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'free', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const address : Value<number> = vm.operands.pop();
        
        this.expect( address, ValueType.AddressHeap );

        vm.heap.free( address.value );
    }
}

export class EqualAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'equal', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const op2 : Value<number> = vm.operands.pop();
        const op1 : Value<number> = vm.operands.pop();
        
        if ( op2.type == op1.type && op1.value == op2.value ) {
            vm.operands.push( new Value( ValueType.Integer, 1 ) );
        } else {
            vm.operands.push( new Value( ValueType.Integer, 0 ) );
        }
    }
}