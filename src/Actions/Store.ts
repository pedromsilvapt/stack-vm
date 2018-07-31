import { Action } from "../Action";
import { ValueType, Value } from "../Instruction";
import { StackVM } from "../StackVM";

export class StoreFrameAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'storel', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : Value = vm.operands.pop();
        
        const offset : number = parameters[ 0 ].value;
        
        const framePointer : number = vm.registers.framePointer;

        vm.valuesPool.free( vm.operands.load( framePointer + offset ) );

        vm.operands.store( framePointer + offset, value );
    }
}

export class StoreGlobalAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'storeg', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : Value = vm.operands.pop();
        
        const offset : number = parameters[ 0 ].value;
        
        const globalPointer : number = vm.registers.globalPointer;

        vm.valuesPool.free( vm.operands.load( globalPointer + offset ) );

        vm.operands.store( globalPointer + offset, value );
    }
}

export class StoreAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'store', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        // We read the value we want to store from the operands stack
        const value : Value = vm.operands.pop();

        // And also the address to store it in, from the operands stack
        const address : Value<number> = vm.operands.pop();

        // Additionally we also accept an offset for the address, as a parameter
        const offset : number = parameters[ 0 ].value;
        
        this.expect( address, [ ValueType.AddressHeap, ValueType.AddressStack ] );
        
        if ( address.type == ValueType.AddressHeap ) {
            vm.valuesPool.free( vm.operands.load( address.value + offset + offset ) );

            vm.heap.store( address.value + offset, value );
        } else if ( address.type == ValueType.AddressStack ) {
            vm.valuesPool.free( vm.operands.load( address.value + offset + offset ) );

            vm.operands.store( address.value + offset, value );
        }

        vm.valuesPool.free( address );
    }
}

// Same as store, but instead of the offset being a parameter in the instruction code, it is
// stored in the operands stack
// So, we pop it (it is beneath the value in the stack, which means we have to pop the value, then pop the offset, 
// and finally put back the value on the top of the stack) and pass it on to the store action as a parameter
export class StoreNAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'storen', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : Value = vm.operands.pop();

        const offset : Value<number> = vm.operands.pop();

        vm.operands.push( value );
        
        this.expect( offset, [ ValueType.Integer ] );

        vm.actions.get( 'store' ).execute( vm, name, [ offset ] );
    }
}
