import { ValueType, Value } from "../Instruction";
import { StackVM } from "../StackVM";
import { Action } from "../Action";

export class LoadAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'load', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const address : Value<number> = vm.operands.pop();

        const offset : number = parameters[ 0 ].value;

        this.expect( address, [ ValueType.AddressStack, ValueType.AddressHeap ] );

        if ( address.type == ValueType.AddressHeap ) {
            const index = address.value + offset;

            vm.operands.push( vm.heap.load( index ).clone( vm ) );
        } else if ( address.type == ValueType.AddressStack ) {
            const index = address.value + offset;
            
            vm.operands.push( vm.operands.load( index ).clone( vm ) );
        }

        vm.valuesPool.free( address );
    }
}

export class LoadNAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'loadn', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const offset : Value<number> = vm.operands.pop();

        this.expect( offset, ValueType.Integer );

        return vm.actions.get( 'load' ).execute( vm, name, [ offset ] );
    }
}